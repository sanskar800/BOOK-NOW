import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    try {
        console.log("authUser middleware called for route:", req.originalUrl);
        console.log("Headers received:", req.headers);

        // Try to get token from either token header or authorization header
        let token = req.headers.token;
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }
        console.log("Extracted token:", token);

        if (!token) {
            console.log("No token provided in headers");
            return res.status(401).json({ success: false, message: 'Not Authorized, no token' });
        }

        // Verify token
        console.log("Verifying token with JWT_SECRET:", process.env.JWT_SECRET ? 'exists' : 'missing');
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", {
            id: token_decode.id,
            exp: token_decode.exp,
            currentTime: Math.floor(Date.now() / 1000)
        });

        if (!token_decode.id) {
            console.log("Token does not contain an id field");
            return res.status(401).json({ success: false, message: 'Not Authorized, invalid token structure' });
        }

        // Check token expiration (jwt.verify already handles this, but let's log for clarity)
        const currentTime = Math.floor(Date.now() / 1000);
        if (token_decode.exp && token_decode.exp < currentTime) {
            console.log("Token expired:", token_decode.exp, "Current time:", currentTime);
            return res.status(401).json({ success: false, message: 'Not Authorized, token expired' });
        }

        req.userId = token_decode.id;
        console.log("Set req.userId:", req.userId);
        next();
    } catch (error) {
        console.log("Error in authUser:", error.message);
        return res.status(401).json({ success: false, message: 'Not Authorized, invalid token' });
    }
};

export default authUser;