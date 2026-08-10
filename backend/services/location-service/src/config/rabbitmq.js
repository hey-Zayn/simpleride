// src/config/rabbitmq.js
import amqplib from 'amqplib';
import { findNearbyDrivers } from '../services/location.service.js';
import { getIO } from '../services/socket.service.js';

let channel = null;

export const initRabbitMQConsumer = async () => {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    try {
        const connection = await amqplib.connect(rabbitUrl);
        channel = await connection.createChannel();

        await channel.assertExchange('ride_events', 'topic', { durable: true });

        const q = await channel.assertQueue('location_service_queue', { durable: true });

        // Bind to ride request, completion, and cancellation events
        await channel.bindQueue(q.queue, 'ride_events', 'ride.requested');
        await channel.bindQueue(q.queue, 'ride_events', 'ride.completed');
        await channel.bindQueue(q.queue, 'ride_events', 'ride.cancelled');

        console.log('Location Service bound to RabbitMQ events [ride.requested, ride.completed, ride.cancelled]');

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                const routingKey = msg.fields.routingKey;
                const content = JSON.parse(msg.content.toString());

                if (routingKey === 'ride.requested') {
                    console.log(`[EVENT RECEIVED] ride.requested for Ride ID: ${content.rideId}`);
                    const { pickup } = content;
                    const nearbyDrivers = await findNearbyDrivers(pickup.lat, pickup.lng, 5.0);
                    console.log(`Found ${nearbyDrivers.length} nearby drivers:`, nearbyDrivers);
                }

                else if (routingKey === 'ride.completed' || routingKey === 'ride.cancelled') {
                    console.log(`[EVENT RECEIVED] ${routingKey} for Ride ID: ${content.rideId}`);

                    try {
                        const io = getIO();
                        const roomName = `ride_${content.rideId}`;

                        // 1. Notify rider and family that trip has finished
                        io.to(roomName).emit('ride_ended', {
                            rideId: content.rideId,
                            status: routingKey === 'ride.completed' ? 'COMPLETED' : 'CANCELLED',
                            message: 'Live tracking ended for this ride.',
                        });

                        // 2. Disconnect/Clear all sockets from this room
                        io.in(roomName).socketsLeave(roomName);
                        console.log(`Closed socket room: ${roomName}`);
                    } catch (err) {
                        console.error('Error handling ride end in Socket:', err.message);
                    }
                }

                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('RabbitMQ Consumer Error:', error.message);
        setTimeout(initRabbitMQConsumer, 5000);
    }
};