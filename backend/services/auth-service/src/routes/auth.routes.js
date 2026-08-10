// src/routes/auth.routes.js
import { Router } from 'express';
import { register, login, refresh, getMe, updateStatus, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate, registerSchema, loginSchema, driverStatusSchema } from '../middlewares/validate.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);

// Protected Routes
router.get('/me', authenticate, getMe);
router.patch('/driver/status', authenticate, validate(driverStatusSchema), updateStatus);
router.post('/logout', authenticate, logout);


export default router;