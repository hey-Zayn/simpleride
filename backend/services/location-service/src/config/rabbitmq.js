import amqplib from 'amqplib';
import { findNearbyDrivers } from '../services/location.service.js';
import { getIO } from '../services/socket.service.js';

let connection = null;
let channel = null;
const exchange = 'ride_events';
const deadLetterExchange = 'ride_events.dlx';
const queueName = 'location_service_queue';

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
        await channel.bindQueue(queue.queue, exchange, 'ride.requested');
        await channel.bindQueue(queue.queue, exchange, 'ride.completed');
        await channel.bindQueue(queue.queue, exchange, 'ride.cancelled');
        await channel.bindQueue(dlq.queue, deadLetterExchange, '#');
        await channel.prefetch(Number(process.env.RABBITMQ_PREFETCH || 10));
        channel.consume(queue.queue, async (msg) => {
            if (!msg) return;
            try {
                const content = JSON.parse(msg.content.toString());
                if (msg.fields.routingKey === 'ride.requested') {
                    const nearbyDrivers = await findNearbyDrivers(content.pickup.lat, content.pickup.lng, 5);
                    console.log(`Found ${nearbyDrivers.length} nearby drivers for ${content.rideId}`);
                } else {
                    const io = getIO();
                    const status = msg.fields.routingKey === 'ride.completed' ? 'COMPLETED' : 'CANCELLED';
                    io.to(`ride_${content.rideId}`).emit('ride_ended', { rideId: content.rideId, status, message: 'Live tracking ended for this ride.' });
                    io.in(`ride_${content.rideId}`).socketsLeave(`ride_${content.rideId}`);
                }
                channel.ack(msg);
            } catch (error) {
                console.error('Location RabbitMQ message failed:', error.message);
                channel.nack(msg, false, false);
            }
        });
        connection.on('close', () => console.warn('Location RabbitMQ connection closed'));
    } catch (error) {
        console.error('Location RabbitMQ connection error:', error.message);
        setTimeout(() => initRabbitMQConsumer().catch(() => {}), 5000).unref();
        throw error;
    }
};
export const closeRabbitMQConsumer = async () => { if (channel) await channel.close(); if (connection) await connection.close(); };