import express from 'express';
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllRead 
} from '../controllers/notificationController.js';
import authUser from '../middlewares/authUser.js';
import authHotel from '../middlewares/authHotel.js';
import authAdmin from '../middlewares/authAdmin.js';
import Notification from '../models/notificationModel.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to check user, hotel or admin auth
const authMulti = (req, res, next) => {
    // Print all headers to debug
    console.log("authMulti middleware - All headers:", req.headers);
    
    // Check for admin token first
    const adminToken = req.headers.atoken || req.headers.aToken;
    const hotelToken = req.headers.htoken || req.headers.hToken;
    
    if (adminToken) {
        console.log("Admin token found, trying admin auth first");
        authAdmin(req, res, (adminErr) => {
            if (!adminErr) {
                console.log("Admin authenticated in authMulti middleware");
                req.isAdmin = true;
                return next();
            }
            // Admin auth failed, try hotel auth if present
            if (hotelToken) {
                tryHotelAuth();
            } else {
                // Try user auth if no hotel token
                tryUserAuth();
            }
        });
    } else if (hotelToken) {
        // Try hotel auth directly if hotel token present
        tryHotelAuth();
    } else {
        // No admin or hotel token, try user auth
        tryUserAuth();
    }
    
    function tryHotelAuth() {
        console.log("Hotel token found, trying hotel auth");
        authHotel(req, res, (hotelErr) => {
            if (!hotelErr) {
                console.log("Hotel authenticated in authMulti middleware");
                return next();
            }
            // Hotel auth failed, try user auth
            tryUserAuth();
        });
    }
    
    function tryUserAuth() {
        authUser(req, res, (userErr) => {
            if (!userErr) {
                console.log("User authenticated in authMulti middleware");
                return next();
            }
            
            // All auth methods failed
            console.log("All authentication methods failed");
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Valid user, hotel, or admin token needed.'
            });
        });
    }
};

// Get notifications
router.get('/', authMulti, getNotifications);

// Mark notification as read (support both PATCH and POST)
router.patch('/:id/read', authMulti, markAsRead);
router.post('/:id/read', authMulti, markAsRead);

// Mark all notifications as read (support both PATCH and POST)
router.patch('/mark-all-read', authMulti, markAllAsRead);
router.post('/mark-all-read', authMulti, markAllAsRead);

// Delete notification
router.delete('/:id', authMulti, deleteNotification);

// Delete all read notifications
router.delete('/read/all', authMulti, deleteAllRead);

// Temporary endpoint to clear all notifications
router.delete('/clear-all', authMulti, async (req, res) => {
    try {
        const recipientId = req.userId || req.hotelId;
        
        const result = await Notification.deleteMany({ 
            recipient: recipientId
        });
        
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} notifications cleared`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router; 