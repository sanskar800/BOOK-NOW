import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
    checkInDate: {
        type: String,
        required: true
    },
    checkOutDate: {
        type: String,
        required: true
    },
    roomQuantity: {
        type: Number,
        required: true
    },
    roomType: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentOption: {
        type: String,
        enum: ['pay_later', 'pay_online'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    stripePaymentIntentId: {
        type: String
    },
    stripeClientSecret: {
        type: String
    },
    status: {
        type: String,
        enum: ['Active', 'Cancelled'],
        default: 'Active'
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: String,
        enum: ['user', 'hotel', 'admin']
    },
    cancellationReason: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.model('Booking', bookingSchema);