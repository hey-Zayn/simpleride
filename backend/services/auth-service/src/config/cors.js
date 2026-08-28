import 'dotenv/config';
const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const corsOptions = {
    origin(origin, callback) {
        if (!origin || configuredOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};