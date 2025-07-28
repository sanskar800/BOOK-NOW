import Email from '../models/emailModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { sendEmail } from '../utils/emailService.js';

// Create a new email record and send it
export const createEmail = catchAsync(async (req, res) => {
    const { recipient, type, title, message, html } = req.body;

    // Create email record
    const email = await Email.create({
        recipient,
        type,
        title,
        message,
        html
    });

    // Send the email
    const result = await sendEmail(req.body.to, title, html);

    // Update email status based on result
    email.status = result.success ? 'SENT' : 'FAILED';
    email.messageId = result.messageId;
    email.error = result.error;
    await email.save();

    res.status(201).json({
        status: 'success',
        data: email
    });
});

// Get emails with pagination and filters
export const getEmails = catchAsync(async (req, res, next) => {
    // Determine the recipient ID
    let recipientId = req.userId || req.hotelId;
    let isAdmin = req.isAdmin;

    if (!recipientId && !isAdmin) {
        return next(new AppError('Authentication required', 401));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // If admin, get all system emails
    if (isAdmin) {
        query = { type: 'SYSTEM' };
    } else {
        // For regular users/hotels, get their specific emails
        query = { recipient: recipientId };
    }
    
    // Add type filter if provided
    if (req.query.type && !isAdmin) {
        query.type = req.query.type;
    }

    // Add status filter if provided
    if (req.query.status) {
        query.status = req.query.status;
    }

    try {
        const [emails, total] = await Promise.all([
            Email.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Email.countDocuments(query)
        ]);

        const failedCount = await Email.countDocuments({
            ...query,
            status: 'FAILED'
        });

        res.status(200).json({
            success: true,
            results: emails.length,
            total,
            failedCount,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            emails: emails
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        return next(new AppError('Failed to fetch emails', 500));
    }
});

// Delete an email record
export const deleteEmail = catchAsync(async (req, res, next) => {
    const recipientId = req.userId || req.hotelId;
    const isAdmin = req.isAdmin;
    
    if (!recipientId && !isAdmin) {
        return next(new AppError('Authentication required', 401));
    }

    let deleteQuery = { _id: req.params.id };
    
    // For regular users/hotels, add recipient to query
    if (!isAdmin) {
        deleteQuery.recipient = recipientId;
    }

    const email = await Email.findOneAndDelete(deleteQuery);

    if (!email) {
        return next(new AppError('Email record not found or unauthorized', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Email record deleted successfully'
    });
});

// Create a new email (internal use)
export const createSystemEmail = async (recipientId, type, title, message, html, isAdminEmail = false) => {
    try {
        // Validate email type
        const validTypes = ['BOOKING', 'REVIEW', 'SYSTEM', 'PAYMENT'];
        const normalizedType = type.toUpperCase();
        
        if (!validTypes.includes(normalizedType)) {
            throw new Error(`Invalid email type. Must be one of: ${validTypes.join(', ')}`);
        }

        // For admin emails, we don't need a specific recipient
        if (!isAdminEmail && !recipientId) {
            throw new Error('Recipient is required for non-admin emails');
        }

        const emailData = {
            type: normalizedType,
            title,
            message,
            html
        };

        // Only set recipient for non-admin emails
        if (!isAdminEmail) {
            emailData.recipient = recipientId;
        }

        const email = await Email.create(emailData);

        // Send the email
        const result = await sendEmail(recipientId, title, html);

        // Update email status
        email.status = result.success ? 'SENT' : 'FAILED';
        email.messageId = result.messageId;
        email.error = result.error;
        await email.save();

        return email;
    } catch (error) {
        console.error('Error creating system email:', error);
        throw error;
    }
};

// Create an email for admin
export const createAdminEmail = async (title, message, html) => {
    try {
        return await createSystemEmail(null, 'SYSTEM', title, message, html, true);
    } catch (error) {
        console.error('Error creating admin email:', error);
        throw error;
    }
}; 