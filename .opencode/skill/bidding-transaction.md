# Skill: bidding-transaction

## Domain Context

Handles atomic counter-bid acceptance in the inDriver fare negotiation flow to prevent race conditions.

## Implementation Standard (JavaScript - Node.js / Prisma)

```javascript
import { prisma } from "../lib/prisma.js";
import { rabbitClient } from "../lib/rabbitmq.js";

export async function acceptDriverBid({ rideId, driverId, acceptedFare }) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current ride state with row lock
    const ride = await tx.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride || ride.status !== "SEARCHING") {
      throw new Error("RIDE_UNAVAILABLE_OR_ALREADY_ACCEPTED");
    }

    // 2. Lock ride to winning driver & update fare
    const updatedRide = await tx.ride.update({
      where: { id: rideId },
      data: {
        status: "ACCEPTED",
        driverId: driverId,
        finalFare: acceptedFare,
      },
    });

    // 3. Reject all other pending counter-bids
    await tx.bid.updateMany({
      where: { rideId: rideId, driverId: { not: driverId } },
      data: { status: "REJECTED" },
    });

    // 4. Mark winning bid as accepted
    await tx.bid.update({
      where: { rideId_driverId: { rideId, driverId } },
      data: { status: "ACCEPTED" },
    });

    // 5. Emit async event to RabbitMQ
    await rabbitClient.publish("ride_events", "ride.accepted", {
      rideId: updatedRide.id,
      driverId: updatedRide.driverId,
      riderId: updatedRide.riderId,
      fare: updatedRide.finalFare,
      timestamp: new Date().toISOString(),
    });

    return updatedRide;
  });
}
```
