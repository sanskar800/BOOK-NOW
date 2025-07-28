const userRoutes = require('./routes/userRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRouter = require('./routes/authRoute');

app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRouter);

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'BookNow API is running',
    version: '1.0'
  });
}); 