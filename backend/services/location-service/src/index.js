// src/index.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import locationRoutes from './routes/location.routes.js';
import { initRabbitMQConsumer } from './config/rabbitmq.js';
import { initSocket } from './services/socket.service.js';
import { startGrpcServer } from './grpc/server.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/location', locationRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'location-service' });
});
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: '✔ Location service is running' });
});

// Create HTTP server wrapping express app
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 4002;

const startServer = async () => {
    await initRabbitMQConsumer();
    await startGrpcServer();
    server.listen(PORT, () => {
        console.log(`Location Service running on http://localhost:${PORT}`);
        console.log(`WebSockets listening on ws://localhost:${PORT}`);
    });
};



startServer();