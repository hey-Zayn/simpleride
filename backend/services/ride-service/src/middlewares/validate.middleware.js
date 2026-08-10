import { z } from 'zod';

export const estimateSchema = z.object({
    pickup: z.object({
        lat: z.number({ required_error: 'Pickup latitude is required' }),
        lng: z.number({ required_error: 'Pickup longitude is required' }),
    }),
    dropoff: z.object({
        lat: z.number({ required_error: 'Dropoff latitude is required' }),
        lng: z.number({ required_error: 'Dropoff longitude is required' }),
    }),
});

export const requestRideSchema = z.object({
    pickupLat: z.number(),
    pickupLng: z.number(),
    pickupAddress: z.string().min(1, 'Pickup address is required'),
    dropoffLat: z.number(),
    dropoffLng: z.number(),
    dropoffAddress: z.string().min(1, 'Dropoff address is required'),
    vehicleType: z.enum(['BIKE', 'MINI', 'COMFORT']).default('BIKE'),
    offeredFare: z.number().positive('Offered fare must be positive in PKR'),
});

export const driverCounterBidSchema = z.object({
    counterFare: z.number().positive('Counter fare must be a valid PKR amount'),
});

export const updateStatusSchema = z.object({
    status: z.enum(['ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    otp: z.string().optional(),
});

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issueList = error.issues || error.errors || [];
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: issueList.map((e) => ({
                    field: e.path.join('.') || 'body',
                    message: e.message,
                })),
            });
        }
        next(error);
    }
};