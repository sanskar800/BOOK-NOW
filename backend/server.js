import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import hotelRouter from './routes/hotelRoute.js';
import userRouter from './routes/userRoute.js';
import bookingRouter from './routes/bookingRoute.js';
import notificationRouter from './routes/notificationRoute.js';
import authRouter from './routes/authRoute.js';
import reviewRouter from './routes/reviewRoutes.js';

// App config
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            process.env.USER_FRONTEND_URL || "http://localhost:5173",
            process.env.ADMIN_FRONTEND_URL || "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket.IO connection handling
const connectedUsers = new Map();
const connectedAdmins = new Set(); // Track admin connections

// Store io and connectedUsers globally
global.io = io;
global.connectedUsers = connectedUsers;
global.connectedAdmins = connectedAdmins;

io.on('connection', (socket) => {
    console.log('A client connected');

    // Handle authentication
    socket.on('authenticate', (data) => {
        let userId;
        let recipientType;

        // Handle different authentication data formats
        if (typeof data === 'object' && data !== null) {
            // If data is an object with id and type fields
            userId = data.id;
            recipientType = data.type;
            console.log(`Authentication with ID object: ${userId}, type: ${recipientType}`);
            
            // Special handling for admin
            if (recipientType === 'admin') {
                console.log('Admin authenticated');
                connectedAdmins.add(socket.id);
                console.log('Current connected admins:', Array.from(connectedAdmins));
                return;
            }
        } else if (data === 'admin') {
            // Legacy format for admin
            console.log('Admin authenticated (legacy format)');
            connectedAdmins.add(socket.id);
            console.log('Current connected admins:', Array.from(connectedAdmins));
            return;
        } else {
            // If data is just the userId (from user frontend)
            userId = data;
            recipientType = 'user';
            console.log(`Authentication with ID string: ${userId}`);
        }

        if (!userId) {
            console.log('No ID provided for authentication');
            return;
        }

        const userIdString = userId.toString();
        console.log(`Authentication attempt with ID: ${userIdString}, type: ${recipientType}`);
        
        // Store the connection
        connectedUsers.set(userIdString, socket.id);
        console.log(`${recipientType === 'hotel' ? 'Hotel' : 'User'} ${userIdString} authenticated`);
        console.log('Current connected users/hotels:', Array.from(connectedUsers.entries()));
    });

    socket.on('disconnect', () => {
        // Check if this was an admin connection
        if (connectedAdmins.has(socket.id)) {
            connectedAdmins.delete(socket.id);
            console.log('Admin disconnected');
            console.log('Current connected admins:', Array.from(connectedAdmins));
            return;
        }

        // Remove user/hotel from connected map
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`Client ${userId} disconnected`);
                console.log('Current connected clients:', Array.from(connectedUsers.entries()));
                break;
            }
        }
    });
});

// Make io accessible to our routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

const port = process.env.PORT || 4000;

// Connect to MongoDB and Cloudinary
connectDB();
connectCloudinary();

// Middleware
app.use(express.json());

// Comprehensive CORS setup
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.USER_FRONTEND_URL || "http://localhost:5173",
      process.env.ADMIN_FRONTEND_URL || "http://localhost:5174",
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(null, true); // Allow all origins in development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'atoken', 'htoken']
};

app.use(cors(corsOptions));

// Pre-flight OPTIONS handler
app.options('*', cors(corsOptions));

// Root health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'BookNow API is running',
        version: '1.0',
        timestamp: new Date().toISOString()
    });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'API service is healthy',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API endpoints
app.use('/api/admin', adminRouter);
app.use('/api/hotel', hotelRouter);
app.use('/api/user', userRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
httpServer.listen(port, () => console.log(`Server started on port ${port}`));

console.log("Server started with JWT_SECRET:", process.env.JWT_SECRET ? "available" : "missing"); // Debug