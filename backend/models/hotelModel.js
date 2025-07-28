import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    galleryImages: {
        type: [String],
        default: [],
    },
    location: {
        type: String,
        required: true,
    },
    about: {
        type: String,
        required: true,
    },
    pricePerNight: {
        type: Number,
        required: true,
    },
    address: {
        line1: { type: String, required: true },
        line2: { type: String, required: true },
    },
    amenities: {
        type: [String],
        required: true,
    },
    totalRooms: {
        type: Number,
        required: true,
    },
    roomTypes: {
        type: [{
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String, required: true },
            quantity: { type: Number, required: true },
            amenities: { type: [String], default: [] }
        }],
        default: []
    },
    available: {
        type: Boolean,
        default: true,
    },
    slots_booked: {
        type: Map,
        of: Number,
        default: {}
    }
});

export default mongoose.model('Hotel', hotelSchema);