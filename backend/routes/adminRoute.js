import express from 'express';
import { addHotel, allHotels, loginAdmin, dashboardStats } from '../controllers/adminController.js';
import upload from '../middlewares/multer.js';
import authAdmin from '../middlewares/authAdmin.js';
import { changeAvailability } from '../controllers/hotelController.js';

const adminRouter = express.Router();

adminRouter.post('/add-hotel', authAdmin, upload, addHotel);
adminRouter.post('/login', loginAdmin);
adminRouter.get('/all-hotels', authAdmin, allHotels);
adminRouter.post('/change-availability', authAdmin, changeAvailability);
adminRouter.get('/dashboard-stats', authAdmin, dashboardStats);

export default adminRouter;