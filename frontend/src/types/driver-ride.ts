import { z } from 'zod';

export const vehicleTypeSchema = z.enum(['BIKE', 'MINI', 'COMFORT']);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export const rideStatusSchema = z.enum([
  'REQUESTED',
  'SEARCHING',
  'ACCEPTED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
]);
export type RideStatus = z.infer<typeof rideStatusSchema>;

export const driverActionStatusSchema = z.enum([
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
export type DriverActionStatus = z.infer<typeof driverActionStatusSchema>;

const coordinateSchema = z.number().finite();
const fareSchema = z.number().finite().positive();

export const driverRideSchema = z.object({
  id: z.string().min(1),
  rideId: z.string().min(1),
  riderId: z.string().min(1),
  driverId: z.string().min(1).nullable().optional(),
  vehicleType: vehicleTypeSchema,
  status: rideStatusSchema,
  pickupAddress: z.string().min(1),
  dropoffAddress: z.string().min(1),
  pickupLat: coordinateSchema.optional(),
  pickupLng: coordinateSchema.optional(),
  dropoffLat: coordinateSchema.optional(),
  dropoffLng: coordinateSchema.optional(),
  offeredFare: fareSchema,
  calculatedFare: fareSchema.optional(),
  finalFare: fareSchema.nullable().optional(),
  fare: fareSchema.optional(),
  otp: z.string().regex(/^\d{4}$/).nullable().optional(),
  passengerName: z.string().min(1).optional(),
  passengerRating: z.number().finite().min(0).max(5).optional(),
  distanceKm: z.number().finite().nonnegative().optional(),
  estimatedMins: z.number().finite().nonnegative().optional(),
});
export type DriverRide = z.infer<typeof driverRideSchema>;

export const incomingRideRequestSchema = driverRideSchema.pick({
  id: true,
  rideId: true,
  riderId: true,
  pickupAddress: true,
  dropoffAddress: true,
  vehicleType: true,
  offeredFare: true,
  calculatedFare: true,
  passengerName: true,
  passengerRating: true,
  pickupLat: true,
  pickupLng: true,
  dropoffLat: true,
  dropoffLng: true,
  distanceKm: true,
  estimatedMins: true,
});
export type IncomingRideRequest = z.infer<typeof incomingRideRequestSchema>;

export const rideStatusUpdateSchema = z.object({
  rideId: z.string().min(1),
  status: rideStatusSchema,
});

export const rideRemovalSchema = z.object({
  rideId: z.string().min(1),
  reason: z.enum(['ACCEPTED', 'EXPIRED']).optional(),
});

const driverTransitions = {
  REQUESTED: [],
  SEARCHING: [],
  ACCEPTED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
} as const satisfies Record<RideStatus, readonly RideStatus[]>;

export const canDriverTransition = (
  currentStatus: RideStatus,
  nextStatus: DriverActionStatus,
): boolean => driverTransitions[currentStatus].includes(nextStatus as never);

export type DriverAction =
  | { kind: 'GO_ONLINE'; label: 'Go online' }
  | { kind: 'RETRY_CONNECTION'; label: 'Retry connection' }
  | { kind: 'WAIT_FOR_OFFERS'; label: 'Waiting for offers' }
  | { kind: 'RESPOND_TO_OFFER'; label: 'Accept or counter' }
  | { kind: 'MARK_ARRIVED'; label: 'Mark arrived' }
  | { kind: 'VERIFY_OTP'; label: 'Verify OTP' }
  | { kind: 'COMPLETE_TRIP'; label: 'Complete trip' }
  | { kind: 'RETURN_TO_IDLE'; label: 'Return to online' };

export const getNextDriverAction = (status: RideStatus | null, availability: 'OFFLINE' | 'CONNECTING' | 'ONLINE'): DriverAction => {
  if (availability === 'OFFLINE') return { kind: 'GO_ONLINE', label: 'Go online' };
  if (availability === 'CONNECTING') return { kind: 'RETRY_CONNECTION', label: 'Retry connection' };
  if (status === null) return { kind: 'WAIT_FOR_OFFERS', label: 'Waiting for offers' };
  switch (status) {
    case 'REQUESTED': case 'SEARCHING': return { kind: 'RESPOND_TO_OFFER', label: 'Accept or counter' };
    case 'ACCEPTED': return { kind: 'MARK_ARRIVED', label: 'Mark arrived' };
    case 'ARRIVED': return { kind: 'VERIFY_OTP', label: 'Verify OTP' };
    case 'IN_PROGRESS': return { kind: 'COMPLETE_TRIP', label: 'Complete trip' };
    case 'COMPLETED': case 'CANCELLED': case 'EXPIRED': return { kind: 'RETURN_TO_IDLE', label: 'Return to online' };
  }
};

const rawRideSchema = z.object({
  id: z.string().min(1).optional(), rideId: z.string().min(1).optional(), riderId: z.string().min(1).optional(), driverId: z.string().min(1).nullable().optional(), vehicleType: vehicleTypeSchema, status: rideStatusSchema.optional(),
  pickupAddress: z.string().min(1).optional(), dropoffAddress: z.string().min(1).optional(), pickupLat: coordinateSchema.optional(), pickupLng: coordinateSchema.optional(), dropoffLat: coordinateSchema.optional(), dropoffLng: coordinateSchema.optional(),
  pickup: z.object({ lat: coordinateSchema, lng: coordinateSchema, address: z.string().min(1) }).optional(), dropoff: z.object({ lat: coordinateSchema, lng: coordinateSchema, address: z.string().min(1) }).optional(),
  offeredFare: fareSchema, calculatedFare: fareSchema.optional(), finalFare: fareSchema.nullable().optional(), fare: fareSchema.optional(), otp: z.string().regex(/^\d{4}$/).nullable().optional(), passengerName: z.string().min(1).optional(), passengerRating: z.number().finite().min(0).max(5).optional(), distanceKm: z.number().finite().nonnegative().optional(), estimatedMins: z.number().finite().nonnegative().optional(),
});

export const normalizeDriverRide = (payload: unknown, fallbackStatus: RideStatus = 'SEARCHING'): DriverRide | null => {
  const result = rawRideSchema.safeParse(payload);
  if (!result.success) return null;
  const ride = result.data;
  const id = ride.rideId ?? ride.id;
  const pickupAddress = ride.pickupAddress ?? ride.pickup?.address;
  const dropoffAddress = ride.dropoffAddress ?? ride.dropoff?.address;
  if (!id || !ride.riderId || !pickupAddress || !dropoffAddress) return null;
  const normalized = driverRideSchema.safeParse({ ...ride, id, rideId: id, status: ride.status ?? fallbackStatus, pickupAddress, dropoffAddress, pickupLat: ride.pickupLat ?? ride.pickup?.lat, pickupLng: ride.pickupLng ?? ride.pickup?.lng, dropoffLat: ride.dropoffLat ?? ride.dropoff?.lat, dropoffLng: ride.dropoffLng ?? ride.dropoff?.lng });
  return normalized.success ? normalized.data : null;
};

