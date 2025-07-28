import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ['user', 'hotel'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // OTP expires after 10 minutes (600 seconds)
  },
});

// Create index for fast lookups
otpSchema.index({ email: 1, userType: 1 });

export default mongoose.model('OTP', otpSchema); 