import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    reviewDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// A user can only review a booking once
reviewSchema.index({ bookingId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema); 