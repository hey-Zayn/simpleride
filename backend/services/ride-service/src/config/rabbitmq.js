import amqp from 'amqplib';

let channel = null;
let connection = null;

const EXCHANGE_NAME = 'ride_events';

/**
 * Establishes connection to RabbitMQ and asserts the topic exchange.
 */
export const connectRabbitMQ = async () => {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            connection = await amqp.connect(rabbitUrl);
            channel = await connection.createChannel();

            // Assert a Topic Exchange for flexible routing (e.g., ride.requested, ride.accepted)
            await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

            console.log('✔Successfully connected to RabbitMQ (Ride Service)');

            // Handle connection closures gracefully
            connection.on('close', () => {
                console.warn('RabbitMQ connection closed. Attempting reconnect...');
                setTimeout(connectRabbitMQ, 5000);
            });

            return;
        } catch (error) {
            retries += 1;
            console.error(`✘RabbitMQ connection attempt ${retries}/${MAX_RETRIES} failed: ${error.message}`);
            if (retries === MAX_RETRIES) {
                console.error('✘ Could not establish RabbitMQ connection. Continuing without events.');
            } else {
                await new Promise((res) => setTimeout(res, 3000));
            }
        }
    }
};

/**
 * Publishes an event payload to the 'ride_events' exchange.
 * @param {string} routingKey Event pattern (e.g., 'ride.requested', 'ride.accepted')
 * @param {object} payload JSON payload data
 */
export const publishEvent = async (routingKey, payload) => {
    if (!channel) {
        console.error(`✘ Cannot publish event '${routingKey}': RabbitMQ channel is uninitialized.`);
        return false;
    }

    try {
        const messageBuffer = Buffer.from(
            JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
            })
        );

        const published = channel.publish(EXCHANGE_NAME, routingKey, messageBuffer, {
            persistent: true,
        });

        console.log(`✔ Published event [${routingKey}]`);
        return published;
    } catch (error) {
        console.error(`✘ Failed to publish event [${routingKey}]:`, error.message);
        return false;
    }
};