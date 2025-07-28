import express from 'express';
import { changeAvailability, hotelList, loginHotel, getHotelDetails, getHotelBookings, cancelBooking, updateHotel, forgotPassword, resetPassword } from '../controllers/hotelController.js';
import authHotel from '../middlewares/authHotel.js';
import upload from '../middlewares/multer.js';

const router = express.Router();

router.post('/availability', authHotel, changeAvailability);
router.get('/list', hotelList);
router.post('/login', loginHotel);
router.get('/details', authHotel, getHotelDetails);
router.get('/bookings', authHotel, getHotelBookings);
router.delete('/bookings/:bookingId', authHotel, cancelBooking);
router.put('/update', authHotel, upload, updateHotel);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;