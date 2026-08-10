import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
    try {
        const data = await authService.registerUser(req.body);
        res.status(201).json({ success: true, message: 'User registered successfully', data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const data = await authService.loginUser(req.body);
        res.status(200).json({ success: true, message: 'Login successful', data });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

        const tokens = await authService.refreshTokenRotation(refreshToken);
        res.status(200).json({ success: true, tokens });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        if (req.user.role !== 'DRIVER') {
            return res.status(403).json({ success: false, message: 'Only drivers can update availability status' });
        }

        const { isOnline, isBusy } = req.body;
        const profile = await authService.toggleDriverStatus(req.user.id, { isOnline, isBusy });
        res.status(200).json({
            success: true,
            message: 'Driver profile status updated successfully',
            data: profile,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const profile = await authService.getUserProfile(req.user.id);
        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: profile,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

export const logout = async (req, res) => {
    try {
        await authService.logoutUser(req.user.id);
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};