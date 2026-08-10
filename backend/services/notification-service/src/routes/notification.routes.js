// src/routes/notification.routes.js
import { Router } from 'express';
import { getNotifications } from '../controllers/notification.controller.js';

const router = Router();

router.get('/user/:userId', getNotifications);

export default router;