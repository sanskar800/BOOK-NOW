import express from 'express';
import { createReview, getHotelReviews, getUserReviews, updateReview, deleteReview, canReviewBooking } from '../controllers/reviewController.js';
import authUser from '../middlewares/authUser.js';

const router = express.Router();

// Routes that require authentication
router.post('/create', authUser, createReview);
router.get('/user', authUser, getUserReviews);
router.patch('/:reviewId', authUser, updateReview);
router.delete('/:reviewId', authUser, deleteReview);
router.get('/can-review/:bookingId', authUser, canReviewBooking);

// Public routes
router.get('/hotel/:hotelId', getHotelReviews);

export default router; 