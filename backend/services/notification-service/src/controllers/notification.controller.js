import { getUserNotifications } from '../services/notification.service.js';

export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await getUserNotifications(userId);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};