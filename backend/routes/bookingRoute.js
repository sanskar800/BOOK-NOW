import express from 'express';
import {
    bookHotel,
    userBookings,
    allBookings,
    cancelBooking,
    handleStripeWebhook,
    checkPaymentStatus,
    convertToPayOnline,
    revertToPayLater,
    sendPaymentConfirmationEmails
} from '../controllers/bookingController.js';
import authUser from '../middlewares/authUser.js';
import authAdmin from '../middlewares/authAdmin.js';
import authHotel from '../middlewares/authHotel.js';

const bookingRouter = express.Router();

// Middleware to allow both users and admins
const authUserOrAdmin = async (req, res, next) => {
    try {
        const userToken = req.headers.token;
        const adminToken = req.headers['atoken'] || req.headers['aToken'];

        if (userToken) {
            await authUser(req, res, () => {
                req.isAdmin = false;
                next();
            });
        } else if (adminToken) {
            await authAdmin(req, res, () => {
                req.isAdmin = true;
                next();
            });
        } else {
            return res.status(401).json({ success: false, message: "Unauthorized - No valid token provided" });
        }
    } catch (error) {
        console.error("Error in authUserOrAdmin:", error);
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
};

// Use raw body for Stripe webhook
bookingRouter.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Booking routes
bookingRouter.post('/book', authUser, bookHotel);
bookingRouter.get('/my-bookings', authUser, userBookings);
bookingRouter.get('/all-bookings', authAdmin, allBookings);

// Payment-related routes
bookingRouter.get('/check-payment-status/:bookingId', authUserOrAdmin, checkPaymentStatus); // Allow users to check their own bookings
bookingRouter.post('/bookings/:bookingId/pay-online', authUser, convertToPayOnline); // New route for converting to pay_online
bookingRouter.post('/bookings/:bookingId/revert-to-pay-later', authUser, revertToPayLater); // New route for reverting to pay_later

// Booking cancellation
bookingRouter.delete('/bookings/:bookingId', authUserOrAdmin, cancelBooking);

// Route to manually trigger payment confirmation emails
bookingRouter.post('/send-payment-confirmation/:bookingId', authAdmin, sendPaymentConfirmationEmails);

export default bookingRouter;