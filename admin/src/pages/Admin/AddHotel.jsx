import React, { useContext, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import validator from 'validator';
import { FaHotel, FaImage, FaMapMarkerAlt, FaMoneyBillWave, FaBed, FaInfoCircle, FaCheck } from 'react-icons/fa';

const AddHotel = () => {
    const [hotImg, setHotImg] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [location, setLocation] = useState('Biratnagar');
    const [pricePerNight, setPricePerNight] = useState('');
    const [about, setAbout] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [totalRooms, setTotalRooms] = useState('');
    const [amenities, setAmenities] = useState({
        'Free WiFi': true,
        Parking: true,
        Breakfast: true,
        'Air Conditioning': true,
    });
    const [isLoading, setIsLoading] = useState(false);

    const { backendUrl, aToken } = useContext(AdminContext);

    const validateForm = () => {
        if (!hotImg) {
            toast.error('Please upload a main hotel image');
            return false;
        }
        if (!validator.isEmail(email)) {
            toast.error('Invalid email format');
            return false;
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return false;
        }
        if (Number(pricePerNight) <= 0) {
            toast.error('Price per night must be greater than 0');
            return false;
        }
        if (Number(totalRooms) <= 0) {
            toast.error('Total rooms must be greater than 0');
            return false;
        }
        return true;
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const selectedAmenities = Object.keys(amenities).filter((key) => amenities[key]);

            const formData = new FormData();
            formData.append('image', hotImg);
            galleryImages.forEach((image) => formData.append('galleryImages', image));
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('location', location);
            formData.append('pricePerNight', Number(pricePerNight));
            formData.append('about', about);
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));
            formData.append('amenities', JSON.stringify(selectedAmenities));
            formData.append('totalRooms', Number(totalRooms));

            const { data } = await axios.post(`${backendUrl}/api/admin/add-hotel`, formData, {
                headers: { aToken, 'Content-Type': 'multipart/form-data' },
            });

            if (data.success) {
                toast.success('Hotel added successfully');
                setHotImg(null);
                setGalleryImages([]);
                setName('');
                setEmail('');
                setPassword('');
                setLocation('Biratnagar');
                setPricePerNight('');
                setAbout('');
                setAddress1('');
                setAddress2('');
                setTotalRooms('');
                setAmenities({
                    'Free WiFi': true,
                    Parking: true,
                    Breakfast: true,
                    'Air Conditioning': true,
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add hotel');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmenityChange = (amenity) => {
        setAmenities((prev) => ({ ...prev, [amenity]: !prev[amenity] }));
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        setGalleryImages((prev) => [...prev, ...files]);
    };

    const removeGalleryImage = (index) => {
        setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="pt-16 pl-64 min-h-screen bg-gray-50">
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <FaHotel className="text-3xl text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-800">Add New Hotel</h1>
                    </div>

                    <form onSubmit={onSubmitHandler} className="space-y-8">
                        {/* Main Hotel Image Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FaImage className="text-xl text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Hotel Images</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Hotel Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-32 h-32">
                                            {hotImg ? (
                                                <img
                                                    className="w-full h-full rounded-lg object-cover border-2 border-gray-200"
                                                    src={URL.createObjectURL(hotImg)}
                                                    alt="Hotel Preview"
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center">
                                                    <FaImage className="w-8 h-8 text-gray-400 mb-2" />
                                                    <span className="text-xs text-gray-500">Upload Image</span>
                                                </div>
                                            )}
                                            {hotImg && (
                                                <div className="absolute top-0 right-0 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                                                    <FaCheck className="text-xs" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file && file.type.startsWith('image/')) {
                                                        setHotImg(file);
                                                    } else {
                                                        toast.error('Please upload a valid image file');
                                                    }
                                                }}
                                                type="file"
                                                accept="image/*"
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-lg file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-blue-50 file:text-blue-700
                                                    hover:file:bg-blue-100
                                                    cursor-pointer"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Upload a high-quality image of your hotel (PNG, JPG, JPEG)</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                                    <input
                                        onChange={handleGalleryChange}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-lg file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100"
                                    />
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {galleryImages.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                                                    src={URL.createObjectURL(image)}
                                                    alt={`Gallery ${index}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeGalleryImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FaInfoCircle className="text-xl text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
                                    <input
                                        onChange={(e) => setName(e.target.value)}
                                        value={name}
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter hotel name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Email</label>
                                    <input
                                        onChange={(e) => setEmail(e.target.value)}
                                        value={email}
                                        type="email"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter hotel email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                    <input
                                        onChange={(e) => setPassword(e.target.value)}
                                        value={password}
                                        type="password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                    <select
                                        onChange={(e) => setLocation(e.target.value)}
                                        value={location}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {['Biratnagar', 'Butwal', 'Chitwan', 'Kathmandu', 'Dhangadi', 'Jhapa', 'Nepalgunj', 'Pokhara'].map(
                                            (city) => (
                                                <option key={city} value={city}>
                                                    {city}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Pricing and Rooms Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FaMoneyBillWave className="text-xl text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Pricing and Rooms</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Per Night (Rs)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                        <input
                                            onChange={(e) => setPricePerNight(e.target.value)}
                                            value={pricePerNight}
                                            type="number"
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter price"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Rooms</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">
                                            <FaBed />
                                        </span>
                                        <input
                                            onChange={(e) => setTotalRooms(e.target.value)}
                                            value={totalRooms}
                                            type="number"
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter total rooms"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FaMapMarkerAlt className="text-xl text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">Address</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                                    <input
                                        onChange={(e) => setAddress1(e.target.value)}
                                        value={address1}
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter address line 1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                                    <input
                                        onChange={(e) => setAddress2(e.target.value)}
                                        value={address2}
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter address line 2"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Amenities Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Amenities</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.keys(amenities).map((amenity) => (
                                    <label key={amenity} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={amenities[amenity]}
                                            onChange={() => handleAmenityChange(amenity)}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700">{amenity}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* About Hotel Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">About Hotel</h2>
                            <textarea
                                onChange={(e) => setAbout(e.target.value)}
                                value={about}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe your hotel..."
                                rows="6"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                                        </svg>
                                        Adding Hotel...
                                    </span>
                                ) : (
                                    'Add Hotel'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddHotel;