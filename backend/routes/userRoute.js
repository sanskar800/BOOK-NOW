import express from 'express';
import { registerUser, loginUser, getProfile, updateProfile, forgotPassword, resetPassword } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', upload, authUser, updateProfile)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password', resetPassword)

export default userRouter