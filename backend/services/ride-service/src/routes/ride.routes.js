import { Router } from 'express';
import {
    estimate,
    createRide,
    acceptRideBid,
    submitDriverCounterBid,
    acceptCounterBid,
    updateStatus,
    getRide,
    getHistory,
} from '../controllers/ride.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
    validate,
    estimateSchema,
    requestRideSchema,
    driverCounterBidSchema,
    updateStatusSchema,
} from '../middlewares/validate.middleware.js';

const router = Router();

// Estimation and Initial Bidding
router.post('/estimate', authenticate, validate(estimateSchema), estimate);
router.post('/request', authenticate, validate(requestRideSchema), createRide);
router.get('/history/me', authenticate, getHistory);
router.get('/:id', authenticate, getRide);

// Bidding Interactivity
router.patch('/:id/accept', authenticate, acceptRideBid); // Driver accepts Rider's bid
router.post('/:id/counter', authenticate, validate(driverCounterBidSchema), submitDriverCounterBid); // Driver sends counter offer
router.patch('/:id/counter/:bidId/accept', authenticate, acceptCounterBid); // Rider accepts driver's counter offer

// Trip Progression Routes
router.patch('/:id/status', authenticate, validate(updateStatusSchema), updateStatus);

export default router;