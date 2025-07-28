import Review from '../models/reviewModel.js';
import Booking from '../models/bookingModel.js';
import Hotel from '../models/hotelModel.js';
import mongoose from 'mongoose';

// Create a new review
export const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;
        const userId = req.userId;

        if (!bookingId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if booking exists and belongs to the user
        const booking = await Booking.findOne({ 
            _id: bookingId, 
            userId: userId,
            status: 'Active' // Only active bookings can be reviewed
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or cannot be reviewed"
            });
        }

        // Check if booking is completed (checkout date in the past)
        const checkOutDate = new Date(booking.checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkOutDate >= today) {
            return res.status(400).json({
                success: false,
                message: "Booking must be completed before leaving a review"
            });
        }

        // Check if user has already reviewed this booking
        const existingReview = await Review.findOne({ bookingId, userId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this booking"
            });
        }

        // Create new review
        const review = new Review({
            userId,
            hotelId: booking.hotelId,
            bookingId,
            rating,
            comment
        });

        await review.save();

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review
        });
    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit review"
        });
    }
};

// Get reviews for a hotel
export const getHotelReviews = async (req, res) => {
    try {
        const { hotelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hotel ID"
            });
        }

        const reviews = await Review.find({ hotelId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        // Calculate average rating
        let totalRating = 0;
        reviews.forEach(review => {
            totalRating += review.rating;
        });
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

        return res.status(200).json({
            success: true,
            reviews,
            count: reviews.length,
            averageRating
        });
    } catch (error) {
        console.error("Error fetching hotel reviews:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reviews"
        });
    }
};

// Get reviews by a user
export const getUserReviews = async (req, res) => {
    try {
        const userId = req.userId;

        const reviews = await Review.find({ userId })
            .populate('hotelId', 'name image')
            .populate('bookingId', 'checkInDate checkOutDate')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reviews"
        });
    }
};

// Check if a booking can be reviewed
export const canReviewBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;

        // Check if booking exists and belongs to the user
        const booking = await Booking.findOne({ 
            _id: bookingId, 
            userId: userId,
            status: 'Active' // Only active bookings can be reviewed
        });

        if (!booking) {
            return res.status(200).json({
                success: true,
                canReview: false,
                message: "Booking not found or cannot be reviewed"
            });
        }

        // Check if booking is completed (checkout date in the past)
        const checkOutDate = new Date(booking.checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkOutDate >= today) {
            return res.status(200).json({
                success: true,
                canReview: false,
                message: "Booking must be completed before leaving a review"
            });
        }

        // Check if user has already reviewed this booking
        const existingReview = await Review.findOne({ bookingId, userId });
        if (existingReview) {
            return res.status(200).json({
                success: true,
                canReview: false,
                hasReviewed: true,
                existingReview,
                message: "You have already reviewed this booking"
            });
        }

        return res.status(200).json({
            success: true,
            canReview: true
        });
    } catch (error) {
        console.error("Error checking review eligibility:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check review eligibility"
        });
    }
};

// Update a review
export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.userId;

        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "Rating and comment are required"
            });
        }

        // Find the review and check if it belongs to the user
        const review = await Review.findOne({ _id: reviewId, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to update it"
            });
        }

        // Update the review
        review.rating = rating;
        review.comment = comment;
        review.reviewDate = new Date();

        await review.save();

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review
        });
    } catch (error) {
        console.error("Error updating review:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update review"
        });
    }
};

// Delete a review
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.userId;

        // Find the review and check if it belongs to the user
        const review = await Review.findOne({ _id: reviewId, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission to delete it"
            });
        }

        await Review.deleteOne({ _id: reviewId });

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting review:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete review"
        });
    }
}; 