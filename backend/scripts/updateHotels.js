import mongoose from 'mongoose';
import hotelModel from '../models/hotelModel.js';
import userModel from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const updateHotels = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find an admin user
        const adminUser = await userModel.findOne({ role: 'admin' });
        if (!adminUser) {
            throw new Error('No admin user found. Please create an admin user first.');
        }

        // Find all hotels without userId
        const hotels = await hotelModel.find({ userId: { $exists: false } });
        console.log(`Found ${hotels.length} hotels without userId`);

        // Update each hotel with the admin's userId
        for (const hotel of hotels) {
            await hotelModel.findByIdAndUpdate(
                hotel._id,
                { $set: { userId: adminUser._id } },
                { new: true }
            );
            console.log(`Updated hotel ${hotel._id} with userId ${adminUser._id}`);
        }

        console.log('Update completed successfully');
    } catch (error) {
        console.error('Error updating hotels:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the update
updateHotels(); 