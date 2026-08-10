// src/app.js
import express from 'express';
import cors from 'cors';
import rideRoutes from './routes/ride.routes.js';

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

app.use('/api/rides', rideRoutes);


app.get('/', (req, res) => {
    res.status(200).json({ message: "✔ Ride service is running on port " + process.env.PORT });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'ride-service' });
});

export default app;