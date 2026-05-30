import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { createReview, getUserReviews, getReviewByServiceRequest, getProviderReviews } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', auth(), createReview);
router.get('/my', auth(), getUserReviews);
router.get('/service/:serviceRequestId', auth(), getReviewByServiceRequest);
router.get('/provider', auth(), getProviderReviews);

export default router;
