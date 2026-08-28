import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.status(200).json({ success: true, message: 'Auth service is running' }));
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok', service: 'auth-service' }));
app.get('/readyz', (req, res) => res.status(200).json({ status: 'ready', service: 'auth-service' }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});
export default app;