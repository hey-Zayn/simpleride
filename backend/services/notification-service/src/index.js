// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'; // 👈 1. Import http module
import notificationRoutes from './routes/notification.routes.js';
import { initRabbitMQConsumer } from './config/rabbitmq.js';
import { initSocket } from './socket.js'; // 👈 2. Import initSocket

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 👈 3. Create HTTP server & initialize Socket.io
const server = http.createServer(app);
initSocket(server);

app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "✔ Notification service is running"
    });
});

const PORT = process.env.PORT || 4003;

const startServer = async () => {
    // 👈 4. Initialize consumer AFTER Socket.io is initialized
    await initRabbitMQConsumer();

    // 👈 5. Listen on 'server' instead of 'app'
    server.listen(PORT, () => {
        console.log(`Notification Service running on http://localhost:${PORT}`);
    });
};

startServer();