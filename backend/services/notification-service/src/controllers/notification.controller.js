import { getUserNotifications } from '../services/notification.service.js';

export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user.id !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to view these notifications' });
        }
        const notifications = await getUserNotifications(userId);
        return res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};