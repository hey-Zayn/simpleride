import amqplib from 'amqplib';
import { handleRideRequested, handleRideAccepted, handleRideCounterBid, handleRideArrived, handleRideInProgress, handleRideCompleted, handleRideCancelled, handleRideExpired } from '../services/notification.service.js';

let connection = null;
let channel = null;
const exchange = 'ride_events';
const deadLetterExchange = 'ride_events.dlx';
const queueName = 'notification_service_queue';
const handlers = { 'ride.requested': handleRideRequested, 'ride.accepted': handleRideAccepted, 'ride.counter_bid': handleRideCounterBid, 'ride.arrived': handleRideArrived, 'ride.in_progress': handleRideInProgress, 'ride.completed': handleRideCompleted, 'ride.cancelled': handleRideCancelled, 'ride.expired': handleRideExpired };
export const initRabbitMQConsumer = async () => {
    const rabbitUrl = process.env.RABBITMQ_URL;
    if (!rabbitUrl) throw new Error('RABBITMQ_URL is required');
    try {
        connection = await amqplib.connect(rabbitUrl);
        channel = await connection.createChannel();
        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertExchange(deadLetterExchange, 'topic', { durable: true });
        const queue = await channel.assertQueue(queueName, { durable: true, arguments: { 'x-dead-letter-exchange': deadLetterExchange } });
        const dlq = await channel.assertQueue(`${queueName}.dlq`, { durable: true });
        await channel.bindQueue(queue.queue, exchange, 'ride.#');
        await channel.bindQueue(dlq.queue, deadLetterExchange, '#');
        await channel.prefetch(Number(process.env.RABBITMQ_PREFETCH || 10));
        channel.consume(queue.queue, async (msg) => {
            if (!msg) return;
            try {
                const handler = handlers[msg.fields.routingKey];
                if (handler) await handler(JSON.parse(msg.content.toString()));
                else console.warn(`Unhandled event: ${msg.fields.routingKey}`);
                channel.ack(msg);
            } catch (error) {
                console.error(`RabbitMQ message failed (${msg.fields.routingKey}):`, error.message);
                channel.nack(msg, false, false);
            }
        });
        connection.on('close', () => console.warn('Notification RabbitMQ connection closed'));
    } catch (error) {
        console.error('Notification RabbitMQ connection error:', error.message);
        setTimeout(() => initRabbitMQConsumer().catch(() => {}), 5000).unref();
        throw error;
    }
};
export const closeRabbitMQConsumer = async () => { if (channel) await channel.close(); if (connection) await connection.close(); };