import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
const app = express();

// Auth is reached through the internal API gateway, which forwards the client IP.
// Trust exactly that single proxy hop so rate limiting keys requests by the real client IP.
app.set('trust proxy', 1);

app.use(cors(
    {
        origin: 'http://localhost:3000',
        credentials: true,
    }
));
app.use(express.json());
app.use(cookieParser());
// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "✔ Auth service is running" });
})

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;