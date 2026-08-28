import amqp from 'amqplib';

let channel = null;
let connection = null;
const exchange = 'ride_events';
export const connectRabbitMQ = async () => {
    const rabbitUrl = process.env.RABBITMQ_URL;
    if (!rabbitUrl) throw new Error('RABBITMQ_URL is required');
    const maxRetries = Number(process.env.RABBITMQ_CONNECT_RETRIES || 10);
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            connection = await amqp.connect(rabbitUrl);
            channel = await connection.createConfirmChannel();
            await channel.assertExchange(exchange, 'topic', { durable: true });
            connection.on('close', () => { channel = null; connection = null; console.warn('Ride RabbitMQ connection closed'); });
            console.log('Connected to RabbitMQ (Ride Service)');
            return;
        } catch (error) {
            console.error(`RabbitMQ connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            if (attempt === maxRetries) throw error;
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
};
export const publishEvent = async (routingKey, payload) => {
    if (!channel) throw new Error(`Cannot publish ${routingKey}; RabbitMQ channel is unavailable`);
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify({ ...payload, timestamp: new Date().toISOString() })), { persistent: true, contentType: 'application/json' });
    await channel.waitForConfirms();
    return true;
};
export const closeRabbitMQ = async () => { if (channel) await channel.close(); if (connection) await connection.close(); };