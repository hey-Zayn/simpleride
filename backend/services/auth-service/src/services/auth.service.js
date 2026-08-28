import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.utils.js';

export const registerUser = async (data) => {
    const { email, password, fullName, phone, role, vehicleType, vehicleNumber, licenseNumber } = data;

    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
        throw new Error('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                phone,
                role: role || 'RIDER',
            },
        });

        if (role === 'DRIVER') {
            if (!vehicleType || !vehicleNumber || !licenseNumber) {
                throw new Error('Vehicle type (BIKE, MINI, COMFORT), number, and license are required for drivers');
            }

            await tx.driverProfile.create({
                data: {
                    userId: user.id,
                    vehicleType, // Enum: BIKE, MINI, COMFORT
                    vehicleNumber,
                    licenseNumber,
                    isOnline: false,
                    isBusy: false,
                },
            });
        }

        return user;
    });

    const tokens = generateTokens({ id: result.id, role: result.role, email: result.email, fullName: result.fullName });
    await prisma.user.update({
        where: { id: result.id },
        data: { refreshToken: tokens.refreshToken },
    });

    return {
        user: { id: result.id, email: result.email, fullName: result.fullName, role: result.role },
        tokens,
    };
};

export const loginUser = async ({ email, password, role }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { driverProfile: true },
    });

    if (!user || user.role !== role) throw new Error('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    const tokens = generateTokens({ id: user.id, role: user.role, email: user.email, fullName: user.fullName });

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            driverProfile: user.driverProfile || null,
        },
        tokens,
    };
};

export const refreshTokenRotation = async (token) => {
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== token) {
        throw new Error('Invalid or revoked refresh token');
    }

    const newTokens = generateTokens({ id: user.id, role: user.role, email: user.email, fullName: user.fullName });

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newTokens.refreshToken },
    });

    return newTokens;
};

export const toggleDriverStatus = async (userId, { isOnline, isBusy }) => {
    const updateData = {};
    if (typeof isOnline === 'boolean') updateData.isOnline = isOnline;
    if (typeof isBusy === 'boolean') updateData.isBusy = isBusy;

    const driverProfile = await prisma.driverProfile.update({
        where: { userId },
        data: updateData,
    });

    return driverProfile;
};

export const getUserProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            driverProfile: {
                select: {
                    id: true,
                    vehicleType: true,
                    vehicleNumber: true,
                    licenseNumber: true,
                    isOnline: true,
                    isBusy: true,
                    rating: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error('User profile not found');
    }

    return user;
};

export const logoutUser = async (userId) => {
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });
};