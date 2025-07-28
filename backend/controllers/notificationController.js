import Notification from '../models/notificationModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Create a new notification
export const createNotification = catchAsync(async (req, res) => {
    const notification = await Notification.create({
        ...req.body,
        recipientModel: req.body.recipientModel || 'User'  // Default to User if not specified
    });
    
    // Send real-time notification if recipient is connected
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    
    const recipientId = notification.recipient.toString();
    const socketId = connectedUsers.get(recipientId);
    
    if (socketId) {
        io.to(socketId).emit('newNotification', notification);
    }
    
    res.status(201).json({
        status: 'success',
        data: notification
    });
});

// Get notifications with pagination and filters
export const getNotifications = catchAsync(async (req, res, next) => {
    // Determine the recipient ID
    let recipientId = req.userId || req.hotelId;
    let isAdmin = req.isAdmin;
    
    console.log('Notification controller - Auth info:', {
        userId: req.userId,
        hotelId: req.hotelId,
        isAdmin: req.isAdmin,
        admin: req.admin
    });
    
    if (!recipientId && !isAdmin) {
        return next(new AppError('Authentication required', 401));
    }
    
    console.log('Fetching notifications for:', recipientId || 'Admin');
    console.log('User type:', isAdmin ? 'Admin' : (req.userId ? 'User' : 'Hotel'));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // If admin, get all system notifications
    if (isAdmin) {
        query = { type: 'SYSTEM' };
    } else {
        // For regular users/hotels, get their specific notifications
        query = { recipient: recipientId };
    }
    
    // Add type filter if provided
    if (req.query.type && !isAdmin) {
        query.type = req.query.type;
    }

    // Add read status filter if provided
    if (req.query.read !== undefined) {
        query.read = req.query.read === 'true';
    }

    console.log('Query for fetching notifications:', query);

    try {
        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(query)
        ]);

        const unreadCount = await Notification.countDocuments({
            ...query,
            read: false
        });

        console.log(`Found ${notifications.length} notifications, ${unreadCount} unread`);

        res.status(200).json({
            success: true,
            results: notifications.length,
            total,
            unreadCount,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            notifications: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return next(new AppError('Failed to fetch notifications', 500));
    }
});

// Mark a single notification as read
export const markAsRead = catchAsync(async (req, res, next) => {
    const recipientId = req.userId || req.hotelId;
    const isAdmin = req.isAdmin;
    
    if (!recipientId && !isAdmin) {
        return next(new AppError('Authentication required', 401));
    }

    console.log('Looking for notification with ID:', req.params.id);
    console.log('User type:', isAdmin ? 'Admin' : (req.userId ? 'User' : 'Hotel'));

    let findQuery = { _id: req.params.id };
    
    // For regular users/hotels, add recipient to query
    if (!isAdmin) {
        findQuery.recipient = recipientId;
    }

    const notification = await Notification.findOneAndUpdate(
        findQuery,
        { read: true },
        { new: true }
    );

    if (!notification) {
        // Try finding it without constraints for debugging
        const existingNotification = await Notification.findById(req.params.id);
        if (existingNotification) {
            console.log('Notification exists but with different criteria:', {
                foundRecipient: existingNotification.recipient.toString(),
                requestedRecipient: recipientId || 'Admin'
            });
        } else {
            console.log('No notification found with ID:', req.params.id);
        }
        return next(new AppError('Notification not found or unauthorized', 404));
    }

    // Log success
    console.log('Successfully marked notification as read:', notification._id);

    // Emit update to connected user if socket exists
    if (req.app.get('io') && req.app.get('connectedUsers')) {
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        
        if (!isAdmin && recipientId) {
            const socketId = connectedUsers.get(recipientId.toString());
            if (socketId) {
                io.to(socketId).emit('notificationRead', notification._id);
            }
        }
    }

    res.status(200).json({
        success: true,
        notification
    });
});

// Mark all notifications as read
export const markAllAsRead = catchAsync(async (req, res, next) => {
    const recipientId = req.userId || req.hotelId;
    const isAdmin = req.isAdmin;
    
    if (!recipientId && !isAdmin) {
        return next(new AppError('Authentication required', 401));
    }

    console.log('Marking all notifications as read for:', isAdmin ? 'Admin' : recipientId);

    let updateQuery = { read: false };
    
    // For regular users/hotels, add recipient to query
    if (!isAdmin) {
        updateQuery.recipient = recipientId;
    } else {
        // For admin, only mark system notifications
        updateQuery.type = 'SYSTEM';
    }

    const result = await Notification.updateMany(
        updateQuery,
        { read: true }
    );

    console.log('Updated notifications count:', result.modifiedCount);

    // Emit update to connected user if socket exists
    if (req.app.get('io') && req.app.get('connectedUsers') && !isAdmin) {
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        const socketId = connectedUsers.get(recipientId.toString());
        
        if (socketId) {
            io.to(socketId).emit('allNotificationsRead');
        }
    }

    res.status(200).json({
        success: true,
        message: `Marked ${result.modifiedCount} notifications as read`
    });
});

// Delete a notification
export const deleteNotification = catchAsync(async (req, res, next) => {
    const recipientId = req.userId || req.hotelId;
    const isAdmin = req.isAdmin;
    
    if (!recipientId && !isAdmin) {
        return next(new AppError('Authentication required', 401));
    }
    
    console.log(`Deleting notification ${req.params.id} for:`, isAdmin ? 'Admin' : recipientId);

    let deleteQuery = { _id: req.params.id };
    
    // For regular users/hotels, add recipient to query
    if (!isAdmin) {
        deleteQuery.recipient = recipientId;
    }

    const notification = await Notification.findOneAndDelete(deleteQuery);

    if (!notification) {
        return next(new AppError('Notification not found or unauthorized', 404));
    }

    // Emit update to connected user if socket exists
    if (req.app.get('io') && req.app.get('connectedUsers') && !isAdmin) {
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        const socketId = connectedUsers.get(recipientId.toString());
        
        if (socketId) {
            io.to(socketId).emit('notificationDeleted', notification._id);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
    });
});

// Delete all read notifications
export const deleteAllRead = catchAsync(async (req, res, next) => {
    const recipientId = req.userId || req.hotelId;
    
    if (!recipientId) {
        return next(new AppError('Authentication required', 401));
    }
    
    console.log(`Deleting all read notifications for recipient ${recipientId}`);

    const result = await Notification.deleteMany({
        recipient: recipientId,
        read: true
    });

    // Emit update to connected user if socket exists
    if (req.app.get('io') && req.app.get('connectedUsers')) {
        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');
        const socketId = connectedUsers.get(recipientId.toString());
        
        if (socketId) {
            io.to(socketId).emit('readNotificationsDeleted');
        }
    }

    res.status(200).json({
        success: true,
        message: `${result.deletedCount} read notifications deleted`
    });
});

// Create a new notification (internal use)
export const createSystemNotification = async (recipientId, type, title, message, isAdminNotification = false) => {
    try {
        // Validate notification type
        const validTypes = ['BOOKING', 'REVIEW', 'SYSTEM', 'PAYMENT'];
        const normalizedType = type.toUpperCase();
        
        if (!validTypes.includes(normalizedType)) {
            throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
        }

        // For admin notifications, we don't need a specific recipient
        if (!isAdminNotification && !recipientId) {
            throw new Error('Recipient is required for non-admin notifications');
        }

        const notificationData = {
            type: normalizedType,
            title,
            message
        };

        // Only set recipient for non-admin notifications
        if (!isAdminNotification) {
            notificationData.recipient = recipientId;
        }

        const notification = await Notification.create(notificationData);

        // Get Socket.IO instance and connected users/admins
        const io = global.io;
        const connectedUsers = global.connectedUsers;
        const connectedAdmins = global.connectedAdmins;
        
        if (io) {
            if (isAdminNotification && connectedAdmins) {
                // Send to all connected admins
                for (const adminSocketId of connectedAdmins) {
                    io.to(adminSocketId).emit('newNotification', notification);
                }
                console.log(`System notification sent to ${connectedAdmins.size} admins`);
            } else if (connectedUsers) {
                // Send to specific user/hotel
                const socketId = connectedUsers.get(recipientId.toString());
                if (socketId) {
                    io.to(socketId).emit('newNotification', notification);
                    console.log(`Notification sent to recipient: ${recipientId}`);
                }
            }
        }

        return notification;
    } catch (error) {
        console.error('Error creating system notification:', error);
        throw error;
    }
};

// Create a notification for admin
export const createAdminNotification = async (title, message) => {
    try {
        return await createSystemNotification(null, 'SYSTEM', title, message, true);
    } catch (error) {
        console.error('Error creating admin notification:', error);
        throw error;
    }
}; 