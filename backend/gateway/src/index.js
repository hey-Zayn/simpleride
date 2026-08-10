import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import proxy from 'express-http-proxy';
import httpProxy from 'http-proxy';

dotenv.config();

const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({ message: `✔ API Gateway is running on port ${process.env.PORT || 8000}` });
});

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
const LOCATION_URL = process.env.LOCATION_SERVICE_URL || 'http://location-service:4002';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4003';
const RIDE_URL = process.env.RIDE_SERVICE_URL || 'http://ride-service:4004';

// HTTP Service Proxy Routes
app.use("/auth", proxy(AUTH_URL));
app.use("/location", proxy(LOCATION_URL));
app.use("/notification", proxy(NOTIFICATION_URL));
app.use("/ride", proxy(RIDE_URL));

// Proxy Socket.IO HTTP polling handshakes directly to notification-service
app.use("/socket.io", proxy(NOTIFICATION_URL));

// Create HTTP Server instance wrapping Express
const server = http.createServer(app);

// Setup WebSockets Proxy using http-proxy
const wsProxy = httpProxy.createProxyServer({
    ws: true,
});

const handleWsError = (err, req, socket) => {
    console.error('[Gateway WS Proxy Error]', err.message);
    socket.destroy();
};

server.on('upgrade', (req, socket, head) => {
    const url = req.url;

    if (url.startsWith('/socket.io') || url.startsWith('/notification')) {
        // Notification service WebSocket — real-time ride event notifications
        wsProxy.ws(req, socket, head, { target: NOTIFICATION_URL }, (err) => {
            handleWsError(err, req, socket);
        });
    } else if (url.startsWith('/location') || url.startsWith('/ws/location')) {
        // Location service WebSocket — live GPS tracking
        wsProxy.ws(req, socket, head, { target: LOCATION_URL }, (err) => {
            handleWsError(err, req, socket);
        });
    } else {
        socket.destroy();
    }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`✔ API Gateway is running on http://localhost:${PORT}`);
    console.log(`✔ WebSocket Gateway listening for upgrade events on port ${PORT}`);
});