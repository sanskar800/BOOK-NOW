import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

const authAdmin = asyncHandler(async (req, res, next) => {
    // Extract token (case-insensitive)
    const token = req.headers['atoken'] || req.header('aToken');
    console.log('authAdmin - Extracted token:', token);
    console.log('authAdmin - Request headers:', req.headers);

    if (!token) {
        console.log('authAdmin - No token provided');
        return res.status(401).json({ success: false, message: 'Not Authorized, no token' });
    }

    try {
        // Verify token
        console.log('authAdmin - Verifying token with JWT_SECRET:', process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('authAdmin - Decoded token:', decoded);

        // Check if the decoded email matches ADMIN_EMAIL
        if (decoded.email !== process.env.ADMIN_EMAIL) {
            console.log('authAdmin - Email mismatch, expected:', process.env.ADMIN_EMAIL, 'got:', decoded.email);
            return res.status(401).json({ success: false, message: 'Not Authorized, invalid email' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.error('authAdmin - Token verification error:', error.message);
        res.status(401).json({ success: false, message: 'Not Authorized, invalid token' });
    }
});

export default authAdmin;