import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    type: {
        type: String,
        enum: ["BOOKING", "REVIEW", "SYSTEM", "PAYMENT"],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema); 