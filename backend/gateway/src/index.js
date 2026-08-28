import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import proxy from 'express-http-proxy';
import httpProxy from 'http-proxy';
import { corsOptions } from './config/cors.js';

dotenv.config();

const app = express();
let isShuttingDown = false;
app.set('trust proxy', 1);
app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.status(200).json({ message: `API Gateway is running on port ${process.env.PORT || 5000}` });
});
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok', service: 'gateway' }));
app.get('/readyz', (req, res) => res.status(isShuttingDown ? 503 : 200).json({ status: isShuttingDown ? 'draining' : 'ready', service: 'gateway' }));

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
const LOCATION_URL = process.env.LOCATION_SERVICE_URL || 'http://location-service:4002';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4003';
const RIDE_URL = process.env.RIDE_SERVICE_URL || 'http://ride-service:4004';
const LOCATION_SOCKET_PREFIX = process.env.LOCATION_SOCKET_PREFIX || '/location';

app.use('/auth', proxy(AUTH_URL));
app.use('/location', proxy(LOCATION_URL));
app.use('/notification', proxy(NOTIFICATION_URL));
app.use('/ride', proxy(RIDE_URL));

const server = http.createServer(app);
const wsProxy = httpProxy.createProxyServer({ ws: true });
wsProxy.on('error', (error, req, socket) => {
    console.error('[Gateway WS Proxy Error]', error.message);
    if (socket && !socket.destroyed) socket.destroy();
});

server.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (url.startsWith('/socket.io')) {
        wsProxy.ws(req, socket, head, { target: NOTIFICATION_URL });
        return;
    }
    if (url.startsWith(`${LOCATION_SOCKET_PREFIX}/socket.io`)) {
        req.url = url.slice(LOCATION_SOCKET_PREFIX.length) || '/socket.io';
        wsProxy.ws(req, socket, head, { target: LOCATION_URL });
        return;
    }
    socket.destroy();
});

const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, () => console.log(`API Gateway listening on port ${PORT}`));

const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}; draining gateway connections.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), Number(process.env.SHUTDOWN_TIMEOUT_MS || 55000)).unref();
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));