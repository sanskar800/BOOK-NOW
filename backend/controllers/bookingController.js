import bookingModel from "../models/bookingModel.js";
import hotelModel from "../models/hotelModel.js";
import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import Stripe from 'stripe';
import { 
    sendEmail, 
    createBookingConfirmationEmailHTML, 
    createHotelBookingNotificationHTML,
    createBookingCancellationEmailHTML,
    createHotelBookingCancellationHTML,
    createPaymentConfirmationEmailHTML,
    createHotelPaymentConfirmationHTML,
    createRefundConfirmationEmailHTML,
    createHotelRefundNotificationHTML
} from "../utils/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

const createPaymentIntent = async (amount, bookingId) => {
    try {
        if (!amount || amount <= 0) {
            throw new Error('Invalid payment amount');
        }
        const bookingIdString = bookingId.toString();
        console.log('Creating payment intent with bookingId:', bookingIdString, 'Type:', typeof bookingIdString);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Amount in cents/paise
            currency: 'inr',
            metadata: { bookingId: bookingIdString },
            description: `Payment for booking ${bookingIdString}`,
        });
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    } catch (error) {
        console.error('Error creating payment intent:', error.message);
        throw new Error(`Failed to create payment intent: ${error.message}`);
    }
};

const bookHotel = async (req, res) => {
    try {
        const { hotelId, checkInDate, checkOutDate, roomQuantity, roomType, totalAmount, paymentOption } = req.body;
        const userId = req.userId;

        // Validate request data first
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User authentication required"
            });
        }

        if (!hotelId || !checkInDate || !checkOutDate || !roomQuantity || !roomType || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: "Missing required booking information"
            });
        }

        // Find hotel
        const hotel = await hotelModel.findById(hotelId);
        if (!hotel) {
            return res.status(400).json({
                success: false,
                message: "Hotel not found"
            });
        }

        // Basic user check - we don't need full user details yet for creating booking
        // Just verify the user exists
        const userExists = await userModel.exists({ _id: userId });
        if (!userExists) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        // Create booking 
        const newBooking = new bookingModel({
            userId,
            hotelId,
            checkInDate,
            checkOutDate,
            roomQuantity: Number(roomQuantity),
            roomType,
            totalAmount: Number(totalAmount),
            paymentOption
        });

        const savedBooking = await newBooking.save();

        // Update hotel slots_booked - this is critical and should be done synchronously
        const currentBooked = hotel.slots_booked.get(checkInDate) || 0;
        hotel.slots_booked.set(checkInDate, currentBooked + Number(roomQuantity));
        await hotel.save();

        // Handle online payment if selected - this is critical for the payment flow
        if (paymentOption === "pay_online") {
            try {
                const { clientSecret, paymentIntentId } = await createPaymentIntent(totalAmount, savedBooking._id);
                
                // Update booking with payment info
                await bookingModel.findByIdAndUpdate(
                    savedBooking._id,
                    {
                        stripePaymentIntentId: paymentIntentId,
                        stripeClientSecret: clientSecret
                    }
                );
                
                // Return success to client immediately with client secret
                const response = {
                    success: true,
                    message: "Booking successful",
                    booking: {
                        ...savedBooking.toObject(),
                        stripePaymentIntentId: paymentIntentId,
                        stripeClientSecret: clientSecret
                    },
                    clientSecret,
                    bookingId: savedBooking._id
                };
                
                res.status(200).json(response);
                
                // Process notifications and emails asynchronously after response
                processBookingNotificationsAndEmails(savedBooking, userId, hotel)
                    .catch(err => console.error('Error in async booking notifications/emails:', err));
                
                return;
            } catch (paymentError) {
                console.error("Payment intent creation failed:", paymentError);
                await bookingModel.findByIdAndDelete(savedBooking._id);
                return res.status(500).json({
                    success: false,
                    message: "Payment setup failed",
                    error: paymentError.message
                });
            }
        }

        // For non-payment bookings, return success response immediately
        res.status(200).json({
            success: true,
            message: "Booking successful",
            booking: savedBooking
        });

        // Process notifications and emails asynchronously after response
        processBookingNotificationsAndEmails(savedBooking, userId, hotel)
            .catch(err => console.error('Error in async booking notifications/emails:', err));

    } catch (error) {
        console.error("Error in bookHotel:", error);
        return res.status(500).json({
            success: false,
            message: "Error booking hotel",
            error: error.message
        });
    }
};

// Helper function to process notifications and emails asynchronously
async function processBookingNotificationsAndEmails(booking, userId, hotel) {
    try {
        // Get full user details for emails
        const user = await userModel.findById(userId);
        if (!user) {
            throw new Error('User not found for notifications/emails');
        }

        // Create notifications
        if (mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(hotel._id)) {
            console.log('Creating booking notifications with valid IDs - User:', userId, 'Hotel:', hotel._id);
            
            // Notification for user - don't wait for this to complete
            notificationModel.create({
                recipient: userId,
                type: 'BOOKING',
                title: 'Booking Confirmed',
                message: `Your booking at ${hotel.name} has been confirmed for ${new Date(booking.checkInDate).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()}`
            }).catch(err => console.error('Error creating user notification:', err));

            // Notification for hotel - don't wait for this to complete
            notificationModel.create({
                recipient: hotel._id,
                type: 'BOOKING',
                title: 'New Booking',
                message: `New booking received for ${booking.roomQuantity} ${booking.roomType} room(s) from ${new Date(booking.checkInDate).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()}`
            }).catch(err => console.error('Error creating hotel notification:', err));

            console.log('Notifications created successfully');
        }
        
        // Send email notifications - don't wait for these to complete
        try {
            // Email to user
            const userEmailHTML = createBookingConfirmationEmailHTML(booking, user, hotel);
            sendEmail(
                user.email,
                `Booking Confirmation - ${hotel.name}`,
                userEmailHTML
            ).catch(err => console.error('Error sending user booking email:', err));
            console.log('Booking confirmation email queued for user:', user.email);
            
            // Email to hotel
            const hotelEmailHTML = createHotelBookingNotificationHTML(booking, user, hotel);
            sendEmail(
                hotel.email,
                `New Booking Received - BookNow`,
                hotelEmailHTML
            ).catch(err => console.error('Error sending hotel booking email:', err));
            console.log('Booking notification email queued for hotel:', hotel.email);
        } catch (emailError) {
            console.error('Error preparing booking confirmation emails:', emailError);
        }
    } catch (error) {
        console.error('Error in processBookingNotificationsAndEmails:', error);
        // This function runs asynchronously, so we just log errors and don't throw
    }
}

const userBookings = async (req, res) => {
    try {
        const userId = req.userId;
        const { status } = req.query; // Allow filtering by status (Active/Cancelled)
        
        if (!userId) {
            return res.status(401).json({ success: false, message: "User ID is missing." });
        }

        // Build query
        const query = { userId };
        if (status) {
            query.status = status;
        }

        const bookings = await bookingModel
            .find(query)
            .populate("hotelId", "name image location pricePerNight address")
            .populate("userId", "name email image")
            .lean();

        return res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Error in userBookings:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const allBookings = async (req, res) => {
    try {
        const { status, paymentStatus } = req.query;
        
        // Build query based on provided filters
        const query = {};
        if (status) {
            query.status = status;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        
        const bookings = await bookingModel
            .find(query)
            .populate("hotelId", "name image location pricePerNight address")
            .populate("userId", "name email")
            .lean();

        return res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Error in allBookings:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const userId = req.userId;
        const bookingId = req.params.bookingId;
        const { cancellationReason } = req.body;
        const isAdmin = req.isAdmin || false;

        let booking;
        if (isAdmin) {
            booking = await bookingModel.findById(bookingId);
        } else {
            booking = await bookingModel.findOne({ _id: bookingId, userId });
        }

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found or not authorized." });
        }

        // If booking is already cancelled, return error
        if (booking.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: "Booking is already cancelled." });
        }

        // Get hotel info for later use
        const hotel = await hotelModel.findById(booking.hotelId);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Associated hotel not found." });
        }

        let refundProcessed = false;
        let refundId = null;
        
        // Handle refund if payment was completed - but do this synchronously since it's critical
        if (booking.paymentStatus === 'Completed' && booking.paymentOption === 'pay_online') {
            try {
                // Create refund in Stripe
                const refund = await stripe.refunds.create({
                    payment_intent: booking.stripePaymentIntentId,
                    reason: 'requested_by_customer'
                });

                if (refund.status !== 'succeeded') {
                    return res.status(400).json({ 
                        success: false, 
                        message: "Failed to process refund. Please try again later." 
                    });
                }
                
                // Update payment status to Refunded
                booking.paymentStatus = 'Refunded';
                refundProcessed = true;
                refundId = refund.id;
                console.log('Refund processed successfully, refund ID:', refund.id);
            } catch (refundError) {
                console.error('Error processing refund:', refundError);
                return res.status(500).json({ 
                    success: false, 
                    message: "Failed to process refund. Please contact support." 
                });
            }
        }

        // Update hotel slots_booked - this operation affects availability and should be done synchronously
        if (hotel && hotel.slots_booked) {
            const currentBooked = hotel.slots_booked.get(booking.checkInDate) || 0;
            const newValue = Math.max(0, currentBooked - booking.roomQuantity);
            if (newValue === 0) {
                hotel.slots_booked.delete(booking.checkInDate);
            } else {
                hotel.slots_booked.set(booking.checkInDate, newValue);
            }
            await hotel.save();
        }

        // Update the booking status to Cancelled
        const bookingUpdate = { 
            status: 'Cancelled',
            // Store cancellation metadata
            cancelledAt: new Date(),
            cancelledBy: isAdmin ? 'admin' : (userId === booking.userId.toString() ? 'user' : 'hotel'),
            cancellationReason: cancellationReason || null,
        };
        
        if (refundProcessed) {
            bookingUpdate.paymentStatus = 'Refunded';
        }
        
        const updatedBooking = await bookingModel.findByIdAndUpdate(
            bookingId, 
            bookingUpdate,
            { new: true }
        );

        // Send success response immediately 
        res.status(200).json({ 
            success: true, 
            message: refundProcessed ? 
                "Booking cancelled successfully. Refund has been processed." : 
                "Booking cancelled successfully.",
            booking: updatedBooking
        });

        // Get user for email notification - this can happen asynchronously after responding to client
        try {
            const user = await userModel.findById(booking.userId);
            
            // Determine who cancelled
            const cancelledBy = isAdmin ? 'admin' : (userId === booking.userId.toString() ? 'user' : 'hotel');
            
            // Process notifications and emails asynchronously - don't use await
            // These processes won't block the response
            
            // Create notifications
            createCancellationNotifications(
                booking, 
                user, 
                hotel, 
                cancelledBy, 
                cancellationReason, 
                refundProcessed
            ).catch(err => console.error('Error creating cancellation notifications:', err));
            
            // Send email notifications
            sendCancellationEmails(
                booking, 
                user, 
                hotel, 
                cancelledBy, 
                cancellationReason
            ).catch(err => console.error('Error sending cancellation emails:', err));
            
        } catch (error) {
            // Just log errors, don't affect the main flow since response was already sent
            console.error('Error processing post-cancellation tasks:', error);
        }
    } catch (error) {
        console.error("Error in cancelBooking:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Error cancelling booking" 
        });
    }
};

// Helper function to create cancellation notifications asynchronously
async function createCancellationNotifications(booking, user, hotel, cancelledBy, cancellationReason, refundProcessed) {
    try {
        // Validate recipient IDs
        if (!booking.userId || !mongoose.Types.ObjectId.isValid(booking.userId)) {
            throw new Error('Invalid user ID for notification');
        }
        if (!hotel._id || !mongoose.Types.ObjectId.isValid(hotel._id)) {
            throw new Error('Invalid hotel ID for notification');
        }

        console.log('Creating cancellation notifications with valid IDs - User:', booking.userId, 'Hotel:', hotel._id);
        
        // Use notificationModel directly as a fallback in case createSystemNotification fails
        let userNotificationSent = false;
        
        // Notify user about cancellation
        try {
            const userNotification = await createSystemNotification(
                booking.userId,
                'BOOKING',
                'Booking Cancelled',
                `Your booking at ${hotel.name} has been cancelled.${refundProcessed ? ' A refund has been processed.' : ''}`
            );
            
            userNotificationSent = !!userNotification;
            console.log('User notification sent status:', userNotificationSent);
        } catch (error) {
            console.error("Error creating user notification:", error);
        }
        
        // Fallback: Create notification directly if the helper function failed
        if (!userNotificationSent && user) {
            try {
                console.log('Using fallback method to create user notification');
                await notificationModel.create({
                    recipient: booking.userId,
                    type: 'BOOKING',
                    title: 'Booking Cancelled',
                    message: `Your booking at ${hotel.name} has been cancelled.${refundProcessed ? ' A refund has been processed.' : ''}`
                });
                console.log('Fallback user notification created successfully');
            } catch (fallbackError) {
                console.error("Error in fallback user notification:", fallbackError);
            }
        }

        // Notify hotel about cancellation
        try {
            const hotelNotification = await createSystemNotification(
                hotel._id,
                'BOOKING',
                'Booking Cancelled',
                `A booking from ${user ? user.name : 'a guest'} for ${booking.roomQuantity} ${booking.roomType} room(s) has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`
            );
            
            console.log('Hotel notification sent status:', !!hotelNotification);
        } catch (error) {
            console.error("Error creating hotel notification:", error);
            
            // Fallback for hotel notification
            try {
                console.log('Using fallback method to create hotel notification');
                await notificationModel.create({
                    recipient: hotel._id,
                    type: 'BOOKING',
                    title: 'Booking Cancelled',
                    message: `A booking from ${user ? user.name : 'a guest'} for ${booking.roomQuantity} ${booking.roomType} room(s) has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`
                });
                console.log('Fallback hotel notification created successfully');
            } catch (fallbackError) {
                console.error("Error in fallback hotel notification:", fallbackError);
            }
        }

        console.log('Cancellation notifications created successfully');
    } catch (error) {
        console.error('Error in createCancellationNotifications:', error);
    }
}

// Helper function to send cancellation emails asynchronously
async function sendCancellationEmails(booking, user, hotel, cancelledBy, cancellationReason) {
    try {
        // Make sure booking has user details for email template
        if (user) {
            booking.userId = user;
            
            // Email to user
            const userEmailHTML = createBookingCancellationEmailHTML(booking, hotel, cancelledBy, cancellationReason);
            await sendEmail(
                user.email,
                `Booking Cancelled - ${hotel.name}`,
                userEmailHTML
            );
            console.log('Booking cancellation email sent to user:', user.email);
        }
        
        // Email to hotel
        const hotelEmailHTML = createHotelBookingCancellationHTML(booking, user, cancelledBy, cancellationReason);
        await sendEmail(
            hotel.email,
            `Booking Cancellation - BookNow`,
            hotelEmailHTML
        );
        console.log('Booking cancellation email sent to hotel:', hotel.email);
    } catch (emailError) {
        console.error('Error sending booking cancellation emails:', emailError);
    }
}

const checkPaymentStatus = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const userId = req.userId;
        const isAdmin = req.isAdmin || false;

        let booking;
        if (isAdmin) {
            booking = await bookingModel.findById(bookingId);
        } else {
            booking = await bookingModel.findOne({ _id: bookingId, userId });
        }

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or not authorized' });
        }

        if (booking.paymentOption !== 'pay_online') {
            return res.status(200).json({ success: true, paymentStatus: booking.paymentStatus });
        }

        if (!booking.stripePaymentIntentId) {
            return res.status(200).json({ success: true, paymentStatus: booking.paymentStatus });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);

        let newStatus = booking.paymentStatus;
        if (paymentIntent.status === 'succeeded' && booking.paymentStatus !== 'Completed') {
            newStatus = 'Completed';
            await bookingModel.findByIdAndUpdate(bookingId, { paymentStatus: 'Completed' });
            
            // Send payment confirmation emails
            try {
                const user = await userModel.findById(booking.userId);
                const hotel = await hotelModel.findById(booking.hotelId);
                
                if (user && hotel) {
                    // Create notifications for payment completion
                    try {
                        // For user
                        await notificationModel.create({
                            recipient: user._id,
                            type: 'PAYMENT',
                            title: 'Payment Successful',
                            message: `Your payment for booking at ${hotel.name} has been successfully processed.`
                        });
                        
                        // For hotel
                        await notificationModel.create({
                            recipient: hotel._id,
                            type: 'PAYMENT',
                            title: 'Payment Received',
                            message: `Payment received for booking #${booking._id} from ${user.name}.`
                        });
                    } catch (notificationError) {
                        console.error('Error creating payment notifications:', notificationError);
                    }
                    
                    // Send payment confirmation email to user
                    const userEmailHTML = createPaymentConfirmationEmailHTML(booking, user, hotel);
                    await sendEmail(
                        user.email,
                        `Payment Confirmed - ${hotel.name}`,
                        userEmailHTML
                    );
                    console.log('Payment confirmation email sent to user:', user.email);
                    
                    // Send payment confirmation email to hotel
                    const hotelEmailHTML = createHotelPaymentConfirmationHTML(booking, user, hotel);
                    await sendEmail(
                        hotel.email,
                        `Payment Received - BookNow`,
                        hotelEmailHTML
                    );
                    console.log('Payment confirmation email sent to hotel:', hotel.email);
                }
            } catch (emailError) {
                console.error('Error sending payment confirmation emails:', emailError);
            }
        }

        return res.status(200).json({ success: true, paymentStatus: newStatus });
    } catch (error) {
        console.error(`Check Payment Status - Error for booking ${req.params.bookingId}:`, error.message);
        return res.status(500).json({ success: false, message: 'Failed to check payment status' });
    }
};

const handleStripeWebhook = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle successful payments
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const bookingId = paymentIntent.metadata.bookingId;

            // Update booking status
            await bookingModel.findByIdAndUpdate(bookingId, {
                paymentStatus: 'Completed'
            });
            
            // Send payment confirmation email
            try {
                const booking = await bookingModel.findById(bookingId);
                if (booking) {
                    const hotel = await hotelModel.findById(booking.hotelId);
                    const user = await userModel.findById(booking.userId);
                    
                    if (user && hotel) {
                        // Create a payment success notification for the user
                        await notificationModel.create({
                            recipient: user._id,
                            type: 'PAYMENT',
                            title: 'Payment Successful',
                            message: `Your payment for booking at ${hotel.name} has been successfully processed.`
                        });
                        
                        // Create a payment notification for the hotel
                        await notificationModel.create({
                            recipient: hotel._id,
                            type: 'PAYMENT',
                            title: 'Payment Received',
                            message: `Payment received for booking #${booking._id} from ${user.name}.`
                        });
                        
                        // Send payment confirmation email to user
                        const userEmailHTML = createPaymentConfirmationEmailHTML(booking, user, hotel);
                        await sendEmail(
                            user.email,
                            `Payment Confirmed - ${hotel.name}`,
                            userEmailHTML
                        );
                        console.log('Payment confirmation email sent to user:', user.email);
                        
                        // Send payment confirmation email to hotel
                        const hotelEmailHTML = createHotelPaymentConfirmationHTML(booking, user, hotel);
                        await sendEmail(
                            hotel.email,
                            `Payment Received - BookNow`,
                            hotelEmailHTML
                        );
                        console.log('Payment confirmation email sent to hotel:', hotel.email);
                    }
                }
            } catch (emailError) {
                console.error('Error sending payment confirmation email:', emailError);
            }
        }
        
        // Handle successful refunds
        else if (event.type === 'charge.refunded') {
            const charge = event.data.object;
            const paymentIntentId = charge.payment_intent;
            
            if (!paymentIntentId) {
                console.error('No payment intent ID found in refund webhook');
                return res.json({ received: true });
            }
            
            // Find booking by payment intent ID
            const booking = await bookingModel.findOne({ stripePaymentIntentId: paymentIntentId });
            
            if (!booking) {
                console.error(`No booking found for payment intent: ${paymentIntentId}`);
                return res.json({ received: true });
            }
            
            // Update booking payment status to Refunded if not already
            if (booking.paymentStatus !== 'Refunded') {
                booking.paymentStatus = 'Refunded';
                await booking.save();
                
                try {
                    // Get associated user and hotel
                    const user = await userModel.findById(booking.userId);
                    const hotel = await hotelModel.findById(booking.hotelId);
                    
                    if (user && hotel) {
                        // Create a refund notification for the user
                        await notificationModel.create({
                            recipient: user._id,
                            type: 'PAYMENT',
                            title: 'Refund Processed',
                            message: `Your refund for the cancelled booking at ${hotel.name} has been processed. The amount should appear in your account within 5-7 business days.`
                        });
                        
                        // Create a refund notification for the hotel
                        await notificationModel.create({
                            recipient: hotel._id,
                            type: 'PAYMENT',
                            title: 'Refund Processed',
                            message: `A refund has been processed for booking #${booking._id} from ${user.name}.`
                        });
                        
                        // Send refund confirmation email to user
                        const refundEmailHTML = createRefundConfirmationEmailHTML(booking, user, hotel);
                        await sendEmail(
                            user.email,
                            `Refund Processed - ${hotel.name}`,
                            refundEmailHTML
                        );
                        console.log('Refund confirmation email sent to user:', user.email);
                        
                        // Send refund notification email to hotel
                        const hotelRefundEmailHTML = createHotelRefundNotificationHTML(booking, user, hotel);
                        await sendEmail(
                            hotel.email,
                            `Refund Processed - BookNow`,
                            hotelRefundEmailHTML
                        );
                        console.log('Refund notification email sent to hotel:', hotel.email);
                    }
                } catch (notificationError) {
                    console.error('Error creating refund notifications:', notificationError);
                }
            }
        }
        // Handle other refund events
        else if (event.type === 'refund.created' || event.type === 'refund.updated' || event.type === 'refund.succeeded') {
            const refund = event.data.object;
            const refundId = refund.id;
            const paymentIntentId = refund.payment_intent;
            
            if (!paymentIntentId) {
                console.error(`No payment intent ID found in ${event.type} webhook`);
                return res.json({ received: true });
            }
            
            // Find booking by payment intent ID
            const booking = await bookingModel.findOne({ stripePaymentIntentId: paymentIntentId });
            
            if (!booking) {
                console.error(`No booking found for payment intent: ${paymentIntentId}`);
                return res.json({ received: true });
            }
            
            // For refund.succeeded or refund.updated with status=succeeded, update to Refunded
            if ((event.type === 'refund.succeeded' || 
                (event.type === 'refund.updated' && refund.status === 'succeeded')) && 
                booking.paymentStatus !== 'Refunded') {
                
                booking.paymentStatus = 'Refunded';
                await booking.save();
                console.log(`Booking ${booking._id} marked as refunded for refund ${refundId}`);
                
                try {
                    // Get associated user and hotel
                    const user = await userModel.findById(booking.userId);
                    const hotel = await hotelModel.findById(booking.hotelId);
                    
                    if (user && hotel) {
                        // Create and send notifications
                        await notificationModel.create({
                            recipient: user._id,
                            type: 'PAYMENT',
                            title: 'Refund Processed',
                            message: `Your refund for the cancelled booking at ${hotel.name} has been processed.`
                        });
                        
                        await notificationModel.create({
                            recipient: hotel._id,
                            type: 'PAYMENT',
                            title: 'Refund Processed',
                            message: `A refund has been processed for booking #${booking._id} from ${user.name}.`
                        });
                        
                        // Send emails
                        const refundEmailHTML = createRefundConfirmationEmailHTML(booking, user, hotel);
                        await sendEmail(user.email, `Refund Processed - ${hotel.name}`, refundEmailHTML);
                        
                        const hotelRefundEmailHTML = createHotelRefundNotificationHTML(booking, user, hotel);
                        await sendEmail(hotel.email, `Refund Processed - BookNow`, hotelRefundEmailHTML);
                    }
                } catch (error) {
                    console.error('Error sending refund notifications:', error);
                }
            } else if (event.type === 'refund.created') {
                console.log(`Refund initiated for booking ${booking._id}, refund ID: ${refundId}`);
            }
        }
        // Handle failed refunds
        else if (event.type === 'refund.failed') {
            const refund = event.data.object;
            const refundId = refund.id;
            const paymentIntentId = refund.payment_intent;
            
            if (!paymentIntentId) {
                console.error('No payment intent ID found in failed refund webhook');
                return res.json({ received: true });
            }
            
            // Find booking by payment intent ID
            const booking = await bookingModel.findOne({ stripePaymentIntentId: paymentIntentId });
            
            if (!booking) {
                console.error(`No booking found for payment intent: ${paymentIntentId}`);
                return res.json({ received: true });
            }
            
            console.log(`Refund failed for booking ${booking._id}, refund ID: ${refundId}`);
            
            try {
                // Get associated user and hotel
                const user = await userModel.findById(booking.userId);
                const hotel = await hotelModel.findById(booking.hotelId);
                
                if (user && hotel) {
                    // Create a refund failure notification for the user
                    await notificationModel.create({
                        recipient: user._id,
                        type: 'PAYMENT',
                        title: 'Refund Processing Issue',
                        message: `There was an issue processing your refund for the booking at ${hotel.name}. Our team has been notified and will resolve this soon.`
                    });
                    
                    // Create a refund failure notification for the hotel
                    await notificationModel.create({
                        recipient: hotel._id,
                        type: 'PAYMENT',
                        title: 'Refund Processing Failed',
                        message: `A refund for booking #${booking._id} from ${user.name} could not be processed. Please check your payment settings.`
                    });
                    
                    // Also notify admin
                    console.error(`Refund failed for booking ${booking._id}, refund ID: ${refundId}. Manual intervention may be required.`);
                }
            } catch (notificationError) {
                console.error('Error creating refund failure notifications:', notificationError);
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const convertToPayOnline = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;

        console.log(`Converting booking ${bookingId} to pay_online for user ${userId}`);
        
        // Validate input first - fast validation check
        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID format" });
        }

        const booking = await bookingModel.findOne({ _id: bookingId, userId });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found or not authorized" });
        }

        if (booking.paymentOption === 'pay_online') {
            return res.status(400).json({ success: false, message: "Booking is already set to pay online" });
        }

        // Verify total amount
        if (!booking.totalAmount || booking.totalAmount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid booking amount" });
        }
        
        try {
            // Create the payment intent - this is the most time-consuming operation
            const { clientSecret, paymentIntentId } = await createPaymentIntent(booking.totalAmount, booking._id);
            
            // Update the booking and return response
            await bookingModel.findByIdAndUpdate(bookingId, {
                paymentOption: 'pay_online',
                stripePaymentIntentId: paymentIntentId,
                stripeClientSecret: clientSecret
            });
    
            // Send success response
            return res.status(200).json({
                success: true,
                message: "Successfully converted to pay online",
                clientSecret,
                bookingId: booking._id
            });
        } catch (paymentError) {
            console.error(`Payment intent creation failed for booking ${bookingId}:`, paymentError);
            return res.status(500).json({ 
                success: false, 
                message: "Failed to setup payment. Please try again later.",
                error: paymentError.message 
            });
        }
    } catch (error) {
        console.error("Error in convertToPayOnline:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const revertToPayLater = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;

        const booking = await bookingModel.findOne({ _id: bookingId, userId });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found or not authorized" });
        }

        if (booking.paymentOption === 'pay_later') {
            return res.status(400).json({ success: false, message: "Booking is already set to pay later" });
        }

        if (booking.paymentStatus === 'Completed') {
            return res.status(400).json({ success: false, message: "Cannot revert completed payments" });
        }

        // Cancel Stripe payment intent if it exists
        if (booking.stripePaymentIntentId) {
            try {
                await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);
            } catch (stripeError) {
                console.error("Error canceling payment intent:", stripeError);
            }
        }

        booking.paymentOption = 'pay_later';
        booking.stripePaymentIntentId = undefined;
        booking.stripeClientSecret = undefined;
        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Successfully reverted to pay later"
        });
    } catch (error) {
        console.error("Error in revertToPayLater:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function for creating notifications
const createSystemNotification = async (recipientId, type, title, message) => {
    try {
        // Validate notification type
        const validTypes = ['BOOKING', 'REVIEW', 'SYSTEM', 'PAYMENT'];
        const normalizedType = type.toUpperCase();
        
        if (!validTypes.includes(normalizedType)) {
            throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
        }

        if (!recipientId) {
            throw new Error('Recipient ID is required for notifications');
        }

        // Convert recipientId to string if it's an ObjectId
        const recipientIdStr = recipientId.toString();

        // Create notification in the database
        console.log(`Creating notification for recipient: ${recipientIdStr}, type: ${normalizedType}, title: ${title}`);
        const notification = await notificationModel.create({
            recipient: recipientId,
            type: normalizedType,
            title,
            message
        });
        console.log(`Notification created with ID: ${notification._id}`);

        // Get Socket.IO instance and connected users
        const io = global.io;
        const connectedUsers = global.connectedUsers;
        
        if (io && connectedUsers) {
            // Send to specific user/hotel
            const socketId = connectedUsers.get(recipientIdStr);
            if (socketId) {
                console.log(`Socket found for recipient ${recipientIdStr}, emitting notification to socket ${socketId}`);
                io.to(socketId).emit('newNotification', notification);
                console.log(`Notification sent to recipient: ${recipientIdStr}`);
            } else {
                console.log(`No socket found for recipient ${recipientIdStr}, notification will be seen on refresh`);
            }
        } else {
            console.log('Socket.IO instance or connected users map not available, skipping real-time notification');
        }

        return notification;
    } catch (error) {
        console.error('Error creating system notification:', error);
        console.error('Notification details:', { recipientId, type, title, message });
        
        // Log the error but don't throw - we want the booking cancellation to continue
        // even if notification fails
        return null;
    }
};

// Function to send payment confirmation emails for completed bookings
const sendPaymentConfirmationEmails = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const isAdmin = req.isAdmin || false;
        
        if (!isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "Only administrators can trigger this action" 
            });
        }
        
        // Find the booking
        const booking = await bookingModel.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ 
                success: false, 
                message: "Booking not found" 
            });
        }
        
        // Check if payment is completed
        if (booking.paymentStatus !== 'Completed') {
            return res.status(400).json({ 
                success: false, 
                message: "Payment is not marked as completed for this booking" 
            });
        }
        
        // Get user and hotel details
        const user = await userModel.findById(booking.userId);
        const hotel = await hotelModel.findById(booking.hotelId);
        
        if (!user || !hotel) {
            return res.status(404).json({ 
                success: false, 
                message: "User or hotel not found" 
            });
        }
        
        // Send payment confirmation email to user
        const userEmailHTML = createPaymentConfirmationEmailHTML(booking, user, hotel);
        await sendEmail(
            user.email,
            `Payment Confirmed - ${hotel.name}`,
            userEmailHTML
        );
        
        // Send payment confirmation email to hotel
        const hotelEmailHTML = createHotelPaymentConfirmationHTML(booking, user, hotel);
        await sendEmail(
            hotel.email,
            `Payment Received - BookNow`,
            hotelEmailHTML
        );
        
        return res.status(200).json({ 
            success: true, 
            message: "Payment confirmation emails sent successfully" 
        });
    } catch (error) {
        console.error("Error sending payment confirmation emails:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export {
    bookHotel,
    userBookings,
    allBookings,
    cancelBooking,
    checkPaymentStatus,
    handleStripeWebhook,
    convertToPayOnline,
    revertToPayLater,
    sendPaymentConfirmationEmails
};