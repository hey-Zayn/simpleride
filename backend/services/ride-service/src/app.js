import express from 'express';
import cors from 'cors';
import rideRoutes from './routes/ride.routes.js';
import { corsOptions } from './config/cors.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api/rides', rideRoutes);
app.get('/', (req, res) => res.status(200).json({ message: `Ride service is running on port ${process.env.PORT || 4004}` }));
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok', service: 'ride-service' }));
app.get('/readyz', (req, res) => res.status(200).json({ status: 'ready', service: 'ride-service' }));
export default app;