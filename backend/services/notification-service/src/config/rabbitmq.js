// src/config/rabbitmq.js
import amqplib from 'amqplib';
import {
    handleRideRequested,
    handleRideAccepted,
    handleRideCounterBid,
    handleRideArrived,
    handleRideInProgress,
    handleRideCompleted,
    handleRideCancelled,
    handleRideExpired,
} from '../services/notification.service.js';

export const initRabbitMQConsumer = async () => {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    try {
        const connection = await amqplib.connect(rabbitUrl);
        const channel = await connection.createChannel();

        await channel.assertExchange('ride_events', 'topic', { durable: true });
        const q = await channel.assertQueue('notification_service_queue', { durable: true });

        // Queue is already bound to 'ride.#', so 'ride.expired' is automatically routed here
        await channel.bindQueue(q.queue, 'ride_events', 'ride.#');

        console.log('✔ Notification Service listening on RabbitMQ [ride.#]');

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                try {
                    const routingKey = msg.fields.routingKey;
                    const content = JSON.parse(msg.content.toString());

                    switch (routingKey) {
                        case 'ride.requested':
                            await handleRideRequested(content);
                            break;
                        case 'ride.accepted':
                            await handleRideAccepted(content);
                            break;
                        case 'ride.counter_bid':
                            await handleRideCounterBid(content);
                            break;
                        case 'ride.arrived':
                            await handleRideArrived(content);
                            break;
                        case 'ride.in_progress':
                            await handleRideInProgress(content);
                            break;
                        case 'ride.completed':
                            await handleRideCompleted(content);
                            break;
                        case 'ride.cancelled':
                            await handleRideCancelled(content);
                            break;
                        case 'ride.expired': // 2. Handle the ride.expired event
                            await handleRideExpired(content);
                            break;
                        default:
                            console.log(`Unhandled event: ${routingKey}`);
                    }

                    channel.ack(msg);
                } catch (err) {
                    console.error(`[RabbitMQ] Error processing event (${msg.fields.routingKey}):`, err.message);
                    // Reject message without requeueing to prevent endless crash loops on malformed payloads
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (error) {
        console.error('RabbitMQ Consumer Error:', error.message);
        setTimeout(initRabbitMQConsumer, 5000);
    }
};