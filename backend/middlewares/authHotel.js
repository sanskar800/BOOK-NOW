import jwt from 'jsonwebtoken';

const authHotel = async (req, res, next) => {
    try {
        console.log("authHotel middleware called for route:", req.originalUrl);
        console.log("Available headers:", Object.keys(req.headers));

        // Try to get token from various possible headers
        let token = req.headers.htoken || req.headers.hToken;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }
        
        // Also check query parameters (for GET requests)
        if (!token && req.query.hToken) {
            token = req.query.hToken;
        }
        
        console.log("Extracted hotel token:", token ? token.substring(0, 15) + "..." : "None");

        if (!token) {
            console.log("No hotel token provided in headers or query");
            return res.status(401).json({ success: false, message: 'Not Authorized, no token' });
        }

        try {
            // Verify token
            console.log("Verifying hotel token with JWT_SECRET");
            const token_decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded hotel token:", {
                id: token_decode.id,
                exp: token_decode.exp,
                currentTime: Math.floor(Date.now() / 1000)
            });

            if (!token_decode.id) {
                console.log("Token does not contain an id field");
                return res.status(401).json({ success: false, message: 'Not Authorized, invalid token structure' });
            }

            // Check token expiration
            const currentTime = Math.floor(Date.now() / 1000);
            if (token_decode.exp && token_decode.exp < currentTime) {
                console.log("Token expired:", token_decode.exp, "Current time:", currentTime);
                return res.status(401).json({ success: false, message: 'Not Authorized, token expired' });
            }

            req.hotelId = token_decode.id;
            console.log("Set req.hotelId:", req.hotelId);
            next();
        } catch (jwtError) {
            console.log("JWT verification error:", jwtError.message);
            return res.status(401).json({ success: false, message: 'Not Authorized, invalid token' });
        }
    } catch (error) {
        console.log("Error in authHotel:", error.message);
        return res.status(401).json({ success: false, message: 'Not Authorized, server error' });
    }
};

export default authHotel;