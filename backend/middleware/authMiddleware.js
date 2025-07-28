import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const authUser = catchAsync(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (err) {
        return next(new AppError('Invalid token. Please log in again!', 401));
    }
});

export const authAdmin = catchAsync(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists and is an admin
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        if (currentUser.role !== 'ADMIN') {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (err) {
        return next(new AppError('Invalid token. Please log in again!', 401));
    }
});

export const authHotel = catchAsync(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists and is a hotel
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        if (currentUser.role !== 'HOTEL') {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (err) {
        return next(new AppError('Invalid token. Please log in again!', 401));
    }
}); 