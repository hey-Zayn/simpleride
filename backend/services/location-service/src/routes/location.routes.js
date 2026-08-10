// src/routes/location.routes.js
import { Router } from 'express';
import { updateLocation, goOffline, getNearby } from '../controllers/location.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/update', authenticate, updateLocation);
router.post('/offline', authenticate, goOffline);
router.get('/nearby', authenticate, getNearby);

export default router;