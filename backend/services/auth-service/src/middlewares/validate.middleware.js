import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    role: z.enum(['RIDER', 'DRIVER']).default('RIDER'),
    vehicleType: z.enum(['BIKE', 'MINI', 'COMFORT']).optional(),
    vehicleNumber: z.string().optional(),
    licenseNumber: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string(),
});

export const driverStatusSchema = z.object({
    isOnline: z.boolean({ required_error: 'isOnline boolean is required' }).optional(),
    isBusy: z.boolean().optional(),
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