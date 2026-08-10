import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
    role: z.enum(['RIDER', 'DRIVER']),
});

export const registerSchema = z
    .object({
        role: z.enum(['RIDER', 'DRIVER']),
        fullName: z.string().min(2, 'Full name is required'),
        email: z.string().email('Invalid email address'),
        phone: z.string().min(10, 'Valid phone number is required'),
        password: z.string().min(8, 'Password must be at least 8 characters long'),

        // Driver-specific fields matching backend enums
        vehicleType: z.enum(['BIKE', 'MINI', 'COMFORT']).optional(),
        vehicleNumber: z.string().optional(),
        licenseNumber: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.role === 'DRIVER') {
                return !!data.vehicleType && !!data.vehicleNumber && !!data.licenseNumber;
            }
            return true;
        },
        {
            message: 'Vehicle type, vehicle number, and license number are required for drivers',
            path: ['vehicleType'],
        }
    );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;