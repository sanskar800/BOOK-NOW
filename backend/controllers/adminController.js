import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import hotelModel from "../models/hotelModel.js";
import bookingModel from "../models/bookingModel.js";
import jwt from "jsonwebtoken";
import asyncHandler from 'express-async-handler';

// API for adding hotel
const addHotel = asyncHandler(async (req, res) => {
    const { name, email, password, location, about, pricePerNight, address, amenities, totalRooms } = req.body;
    const imageFile = req.files?.image?.[0]; // Main image
    const galleryFiles = req.files?.galleryImages; // Gallery images

    // Check if all required data is provided
    if (!name || !email || !password || !imageFile || !location || !about || !pricePerNight || !address || !totalRooms) {
        return res.json({ success: false, message: 'All fields are required' });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
        return res.json({ success: false, message: 'Invalid email format' });
    }

    // Validate strong password
    if (password.length < 8) {
        return res.json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    // Check if email already exists
    const existingHotel = await hotelModel.findOne({ email });
    if (existingHotel) {
        return res.json({ success: false, message: 'Email already registered' });
    }

    // Hash hotel password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload main image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
    const imageUrl = imageUpload.secure_url;

    // Upload gallery images to Cloudinary
    const galleryUrls = [];
    if (galleryFiles && galleryFiles.length > 0) {
        for (const file of galleryFiles) {
            const upload = await cloudinary.uploader.upload(file.path, { resource_type: "image" });
            galleryUrls.push(upload.secure_url);
        }
    }

    const hotelData = {
        name,
        email,
        password: hashedPassword,
        image: imageUrl,
        galleryImages: galleryUrls,
        location,
        about,
        pricePerNight: Number(pricePerNight),
        address: typeof address === 'string' ? JSON.parse(address) : address,
        amenities: typeof amenities === 'string' ? JSON.parse(amenities) : amenities || ['Free WiFi', 'Parking', 'Breakfast', 'Air Conditioning'],
        totalRooms: Number(totalRooms),
    };

    const newHotel = new hotelModel(hotelData);
    await newHotel.save();

    res.json({ success: true, message: 'Hotel added successfully' });
});

// API for admin login
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log('loginAdmin - Login attempt with email:', email);
    console.log('loginAdmin - Expected credentials:', process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('loginAdmin - Generated token:', token);
        console.log('loginAdmin - JWT_SECRET used:', process.env.JWT_SECRET);
        res.json({ success: true, token });
    } else {
        console.log('loginAdmin - Invalid credentials');
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// API to get all hotels for admin panel
const allHotels = asyncHandler(async (req, res) => {
    const hotels = await hotelModel.find({}).select('-password');
    res.json({ success: true, hotels });
});

// API to get dashboard stats
const dashboardStats = asyncHandler(async (req, res) => {
    // Basic stats
    const totalHotels = await hotelModel.countDocuments({});
    const activeHotels = await hotelModel.countDocuments({ available: true });
    const bookings = await bookingModel.find({ status: 'Active' })
        .populate('hotelId', 'name location category')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Booking trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const bookingTrends = await bookingModel.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo },
                status: 'Active'
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                revenue: { $sum: "$totalAmount" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Recent bookings (last 5)
    const recentBookings = bookings.slice(0, 5).map(booking => ({
        _id: booking._id,
        hotelName: booking.hotelId?.name || 'Unknown Hotel',
        userName: booking.userId?.name || 'Unknown User',
        amount: booking.totalAmount,
        status: booking.status,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate
    }));

    // Top performing hotels
    const topHotels = await bookingModel.aggregate([
        {
            $match: { status: 'Active' }
        },
        {
            $group: {
                _id: "$hotelId",
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        },
        {
            $sort: { totalRevenue: -1 }
        },
        {
            $limit: 5
        }
    ]);

    // Populate hotel details for top hotels
    const populatedTopHotels = await hotelModel.populate(topHotels, {
        path: "_id",
        select: "name location category"
    });

    const topHotelsData = populatedTopHotels.map(hotel => ({
        name: hotel._id?.name || 'Unknown Hotel',
        location: hotel._id?.location || 'Unknown Location',
        totalBookings: hotel.totalBookings,
        totalRevenue: hotel.totalRevenue
    }));

    // Revenue by payment method
    const paymentMethodRevenue = await bookingModel.aggregate([
        {
            $match: { status: 'Active' }
        },
        {
            $group: {
                _id: "$paymentOption",
                totalRevenue: { $sum: "$totalAmount" },
                bookingCount: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: {
                    $cond: {
                        if: { $eq: ["$_id", "pay_online"] },
                        then: "Pay Online",
                        else: "Pay Later (Cash)"
                    }
                },
                totalRevenue: 1,
                bookingCount: 1
            }
        },
        {
            $sort: { totalRevenue: -1 }
        }
    ]);

    const stats = {
        totalHotels,
        activeHotels,
        totalBookings,
        totalRevenue,
        bookingTrends,
        recentBookings,
        topHotels: topHotelsData,
        categoryRevenue: paymentMethodRevenue
    };

    res.json({ success: true, stats });
});

export { addHotel, loginAdmin, allHotels, dashboardStats };