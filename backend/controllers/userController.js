import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import otpModel from '../models/otpModel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises'; // For cleaning up temporary files
import { sendEmail, generateOTP, createPasswordResetEmailHTML } from '../utils/emailService.js';

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing details" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" });
        }

        // Validate strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password" });
        }

        // Check if email already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "Email already registered" });
        }

        // Hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword,
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        // Generate JWT token with expiration
        const token = jwt.sign(
            { id: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log("Generated token for register:", token);
        res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            console.log("Current timestamp before token generation:", currentTimestamp);

            const token = jwt.sign(
                { id: user._id.toString() },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Generated token for login:", token);
            console.log("Decoded token:", decoded);

            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get user details
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.json({ success: false, message: "Missing user ID" });
        }
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, userData });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update user details
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phone, address, dob, gender } = req.body;
        const imageFile = req.files?.image?.[0]; // Access the first file in the 'image' field

        console.log("Received userId:", userId);
        console.log("Received body:", req.body);
        console.log("Received files:", req.files);

        // Validate required fields
        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Missing required details" });
        }

        // Parse address if it comes as a string
        let parsedAddress;
        try {
            parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
        } catch (e) {
            return res.json({ success: false, message: "Invalid address format" });
        }

        // Prepare update data
        const updateData = {
            name,
            phone,
            address: parsedAddress,
            dob,
            gender,
        };

        // Handle image upload to Cloudinary
        if (imageFile) {
            console.log("Uploading image to Cloudinary:", imageFile.path);

            // Fetch the current user to get the old image URL
            const currentUser = await userModel.findById(userId);
            if (!currentUser) {
                return res.json({ success: false, message: "User not found" });
            }

            // Delete the old image from Cloudinary if it exists (and isn't the default)
            if (currentUser.image && !currentUser.image.startsWith('data:image')) {
                const publicId = currentUser.image.split('/').slice(-1)[0].split('.')[0];
                try {
                    await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
                    console.log("Deleted old image from Cloudinary:", publicId);
                } catch (error) {
                    console.error("Error deleting old image from Cloudinary:", error);
                }
            }

            // Upload the new image to Cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                resource_type: 'image',
                folder: 'user_profiles',
            }).catch(error => {
                throw new Error(`Cloudinary upload failed: ${error.message}`);
            });
            updateData.image = imageUpload.secure_url;
            console.log("Image uploaded to Cloudinary:", updateData.image);

            // Clean up the temporary file
            try {
                await fs.unlink(imageFile.path);
                console.log("Deleted temporary file:", imageFile.path);
            } catch (error) {
                console.error("Error deleting temporary file:", error);
            }
        } else {
            console.log("No image file provided for upload");
        }

        // Update user details in a single operation
        console.log("Updating user with data:", updateData);
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.json({ success: false, message: "User not found" });
        }

        // Verify the update
        const verifiedUser = await userModel.findById(userId).select('-password');
        console.log("Updated user document:", updatedUser);
        console.log("Verified user document after update:", verifiedUser);

        res.json({
            success: true,
            message: "Profile updated successfully",
            userData: updatedUser,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to request password reset (forgot password)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" });
        }

        // Check if email exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Email not found" });
        }

        // Generate OTP
        const otp = generateOTP();

        // Save OTP to database (replace if exists)
        await otpModel.findOneAndDelete({ email, userType: 'user' });
        await new otpModel({ email, otp, userType: 'user' }).save();

        // Send email with OTP
        const emailHTML = createPasswordResetEmailHTML(user.name, otp);
        const emailResult = await sendEmail(
            email,
            "Password Reset - BookNow",
            emailHTML
        );

        if (!emailResult.success) {
            return res.json({ success: false, message: "Failed to send email" });
        }

        res.json({ 
            success: true,
            message: "OTP has been sent to your email address"
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to verify OTP and reset password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: "Missing details" });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" });
        }

        // Validate strong password
        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Enter a strong password (min. 8 characters)" });
        }

        // Check if OTP exists and is valid
        const otpRecord = await otpModel.findOne({ email, otp, userType: 'user' });
        if (!otpRecord) {
            return res.json({ success: false, message: "Invalid or expired OTP" });
        }

        // Find the user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

        // Delete the OTP record
        await otpModel.findByIdAndDelete(otpRecord._id);

        res.json({ 
            success: true, 
            message: "Password has been reset successfully"
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export { registerUser, loginUser, getProfile, updateProfile, getAllUsers, forgotPassword, resetPassword };