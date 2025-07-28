import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import hotelModel from '../models/hotelModel.js';
import otpModel from '../models/otpModel.js';
import bookingModel from '../models/bookingModel.js';
import notificationModel from '../models/notificationModel.js';
import fs from 'fs';
import { sendEmail, generateOTP, createPasswordResetEmailHTML } from '../utils/emailService.js';

const changeAvailability = async (req, res) => {
    try {
        const { hotId } = req.body;
        const hotData = await hotelModel.findById(hotId);
        if (!hotData) {
            return res.json({ success: false, message: 'Hotel not found' });
        }
        await hotelModel.findByIdAndUpdate(hotId, { available: !hotData.available });
        res.json({ success: true, message: 'Hotel availability changed successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const hotelList = async (req, res) => {
    try {
        const hotels = await hotelModel.find({}).select('-password -email');
        res.json({ success: true, hotels });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const loginHotel = async (req, res) => {
    try {
        const { email, password } = req.body;
        const hotel = await hotelModel.findOne({ email });
        if (!hotel) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, hotel.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: hotel._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const getHotelDetails = async (req, res) => {
    try {
        const hotelId = req.hotelId;
        const hotel = await hotelModel.findById(hotelId).select('-password');
        if (!hotel) {
            return res.json({ success: false, message: 'Hotel not found' });
        }
        res.json({ success: true, hotel });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const getHotelBookings = async (req, res) => {
    try {
        const hotelId = req.hotelId;
        const { status, paymentStatus } = req.query;
        
        // Build query based on provided filters
        const query = { hotelId };
        if (status) {
            query.status = status;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        
        const bookings = await bookingModel
            .find(query)
            .populate('userId', 'email name image')
            .populate('hotelId', 'roomTypes')
            .sort({ createdAt: -1 })
            .lean();

        // Add room type details to each booking
        const bookingsWithRoomTypes = bookings.map(booking => {
            const hotel = booking.hotelId;
            const roomTypeInfo = hotel.roomTypes.find(rt => rt.name === booking.roomType);
            return {
                ...booking,
                roomTypeDetails: roomTypeInfo || null
            };
        });

        res.json({ success: true, bookings: bookingsWithRoomTypes });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const hotelId = req.hotelId;
        const { bookingId } = req.params;

        const booking = await bookingModel.findOne({ _id: bookingId, hotelId });
        if (!booking) {
            return res.json({
                success: false,
                message: 'Booking not found or not associated with this hotel.',
            });
        }

        const hotel = await hotelModel.findById(hotelId);
        
        // Update slots_booked for each day in the date range
        const startDate = new Date(booking.checkInDate);
        const endDate = new Date(booking.checkOutDate);
        const datesToUpdate = [];

        for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
            datesToUpdate.push(date.toISOString().split('T')[0]);
        }

        for (const date of datesToUpdate) {
            const bookedRooms = hotel.slots_booked.get(date) || 0;
            const newBookedRooms = Math.max(0, bookedRooms - booking.roomQuantity);
            if (newBookedRooms === 0) {
                hotel.slots_booked.delete(date);
            } else {
                hotel.slots_booked.set(date, newBookedRooms);
            }
        }
        await hotel.save();

        // Update booking status instead of deleting
        booking.status = 'Cancelled';
        booking.cancelledAt = new Date();
        booking.cancelledBy = 'hotel';
        await booking.save();

        // Create notification in database
        const notificationData = {
            title: 'Booking Cancelled',
            message: `Your booking at ${hotel.name} for ${new Date(booking.checkInDate).toLocaleDateString()} has been cancelled by the hotel.`,
            type: 'BOOKING',
            recipient: booking.userId,
            read: false
        };
        
        // Save notification to database
        const notification = new notificationModel(notificationData);
        await notification.save();

        // Send real-time notification if user is connected
        try {
            const io = req.app.get('io');
            const connectedUsers = req.app.get('connectedUsers');
            const userSocketId = connectedUsers.get(booking.userId.toString());
            
            if (userSocketId) {
                io.to(userSocketId).emit('newNotification', notification);
                console.log('Sent cancellation notification to user');
            }
        } catch (notifyError) {
            console.error('Error sending real-time notification:', notifyError);
            // Continue with response even if notification fails
        }

        res.json({ success: true, message: 'Booking cancelled successfully.' });
    } catch (error) {
        console.error("Error in cancelBooking (hotel):", error);
        res.json({ success: false, message: error.message });
    }
};

const updateHotel = async (req, res) => {
    try {
        const hotelId = req.hotelId;
        const { name, email, about, pricePerNight, address, amenities, totalRooms, roomTypes } = req.body;
        const imageFile = req.files?.image?.[0]; // Main image
        const galleryFiles = req.files?.galleryImages; // Gallery images

        const updateData = {
            name,
            email,
            about,
            pricePerNight: Number(pricePerNight),
            address: typeof address === 'string' ? JSON.parse(address) : address,
            amenities: typeof amenities === 'string' ? JSON.parse(amenities) : amenities,
            totalRooms: Number(totalRooms),
            roomTypes: typeof roomTypes === 'string' ? JSON.parse(roomTypes) : roomTypes,
        };

        // Upload main image if provided
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                resource_type: 'image',
            });
            updateData.image = imageUpload.secure_url;
            fs.unlinkSync(imageFile.path);
        }

        // Upload gallery images if provided
        if (galleryFiles && galleryFiles.length > 0) {
            const galleryUrls = [];
            for (const file of galleryFiles) {
                const upload = await cloudinary.uploader.upload(file.path, { resource_type: "image" });
                galleryUrls.push(upload.secure_url);
                fs.unlinkSync(file.path);
            }
            updateData.galleryImages = galleryUrls;
        }

        // Validate totalRooms
        if (totalRooms !== undefined && Number(totalRooms) <= 0) {
            return res.json({ success: false, message: 'Total rooms must be greater than 0' });
        }

        // Check if totalRooms is sufficient for existing bookings
        if (totalRooms !== undefined) {
            const hotel = await hotelModel.findById(hotelId);
            const bookedRooms = Array.from(hotel.slots_booked.values());
            const maxBookedRooms = bookedRooms.length > 0 ? Math.max(...bookedRooms) : 0;
            if (Number(totalRooms) < maxBookedRooms) {
                return res.json({
                    success: false,
                    message: `Total rooms cannot be less than the maximum booked rooms (${maxBookedRooms}) on any date.`,
                });
            }
        }

        // Validate room types
        if (roomTypes) {
            const parsedRoomTypes = typeof roomTypes === 'string' ? JSON.parse(roomTypes) : roomTypes;
            for (const roomType of parsedRoomTypes) {
                if (!roomType.name || !roomType.price || !roomType.description || !roomType.quantity) {
                    return res.json({ success: false, message: 'All room type fields are required' });
                }
                if (Number(roomType.price) <= 0) {
                    return res.json({ success: false, message: 'Room price must be greater than 0' });
                }
                if (Number(roomType.quantity) <= 0) {
                    return res.json({ success: false, message: 'Room quantity must be greater than 0' });
                }
            }
        }

        const hotel = await hotelModel.findByIdAndUpdate(hotelId, updateData, {
            new: true,
        });
        if (!hotel) {
            return res.json({ success: false, message: 'Hotel not found' });
        }
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

const createHotel = async (req, res) => {
    try {
        const { name, email, password, image, location, about, pricePerNight, address, amenities, totalRooms, roomTypes } = req.body;
        
        // Check if hotel with same email exists
        const existingHotel = await hotelModel.findOne({ email });
        if (existingHotel) {
            return res.status(400).json({ success: false, message: 'Hotel with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new hotel
        const newHotel = new hotelModel({
            userId: req.userId, // Set the userId from the authenticated user
            name,
            email,
            password: hashedPassword,
            image,
            location,
            about,
            pricePerNight,
            address,
            amenities,
            totalRooms,
            roomTypes
        });

        await newHotel.save();

        res.status(201).json({
            success: true,
            message: 'Hotel created successfully',
            hotel: {
                _id: newHotel._id,
                name: newHotel.name,
                email: newHotel.email,
                location: newHotel.location
            }
        });
    } catch (error) {
        console.error('Error in createHotel:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to request password reset (forgot password)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        // Check if email exists
        const hotel = await hotelModel.findOne({ email });
        if (!hotel) {
            return res.json({ success: false, message: "Email not found" });
        }

        // Generate OTP
        const otp = generateOTP();

        // Save OTP to database (replace if exists)
        await otpModel.findOneAndDelete({ email, userType: 'hotel' });
        await new otpModel({ email, otp, userType: 'hotel' }).save();

        // Send email with OTP
        const emailHTML = createPasswordResetEmailHTML(hotel.name, otp);
        const emailResult = await sendEmail(
            email,
            "Password Reset - BookNow Hotel Portal",
            emailHTML
        );

        if (!emailResult.success) {
            return res.json({ success: false, message: "Failed to send email" });
        }

        res.json({ 
            success: true, 
            message: "OTP has been sent to your email address" 
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to verify OTP and reset password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: "Missing details" });
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Enter a strong password (min. 8 characters)" });
        }

        // Check if OTP exists and is valid
        const otpRecord = await otpModel.findOne({ email, otp, userType: 'hotel' });
        if (!otpRecord) {
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }

        // Find the hotel
        const hotel = await hotelModel.findOne({ email });
        if (!hotel) {
            return res.json({ success: false, message: "Hotel not found" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the hotel's password
        await hotelModel.findByIdAndUpdate(hotel._id, { password: hashedPassword });

        // Delete the OTP record
        await otpModel.findByIdAndDelete(otpRecord._id);

        res.json({ 
            success: true, 
            message: "Password has been reset successfully" 
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    changeAvailability,
    hotelList,
    loginHotel,
    getHotelDetails,
    getHotelBookings,
    cancelBooking,
    updateHotel,
    createHotel,
    forgotPassword,
    resetPassword
};