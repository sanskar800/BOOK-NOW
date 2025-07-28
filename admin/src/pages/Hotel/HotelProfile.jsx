import React, { useContext, useState, useEffect } from 'react';
import { HotelContext } from '../../context/HotelContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import validator from 'validator';

const HotelProfile = () => {
    const { hotelData, backendUrl, hToken, getHotelDetails } = useContext(HotelContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [about, setAbout] = useState('');
    const [pricePerNight, setPricePerNight] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [location, setLocation] = useState('');
    const [totalRooms, setTotalRooms] = useState('');
    const [roomTypes, setRoomTypes] = useState(hotelData?.roomTypes || []);
    const [newRoomType, setNewRoomType] = useState({
        name: "",
        price: "",
        description: "",
        quantity: "",
        amenities: []
    });
    const [amenities, setAmenities] = useState({
        'Free WiFi': true,
        Parking: true,
        Breakfast: true,
        'Air Conditioning': true,
    });
    const [hotImg, setHotImg] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [existingGalleryImages, setExistingGalleryImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHotelDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getHotelDetails();
                if (!data) setError('Failed to load hotel profile.');
            } catch (error) {
                setError(error.response?.data?.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        if (!hotelData) {
            fetchHotelDetails();
        } else {
            setLoading(false);
            setName(hotelData.name || '');
            setEmail(hotelData.email || '');
            setAbout(hotelData.about || '');
            setPricePerNight(hotelData.pricePerNight || '');
            setAddress1(hotelData.address?.line1 || '');
            setAddress2(hotelData.address?.line2 || '');
            setLocation(hotelData.location || '');
            setTotalRooms(hotelData.totalRooms || '');
            setExistingGalleryImages(hotelData.galleryImages || []);
            setAmenities({
                'Free WiFi': hotelData.amenities.includes('Free WiFi'),
                Parking: hotelData.amenities.includes('Parking'),
                Breakfast: hotelData.amenities.includes('Breakfast'),
                'Air Conditioning': hotelData.amenities.includes('Air Conditioning'),
            });
            setRoomTypes(hotelData.roomTypes || []);
        }
    }, [hotelData, getHotelDetails]);

    const validateForm = () => {
        if (email && !validator.isEmail(email)) {
            toast.error('Invalid email format');
            return false;
        }
        if (pricePerNight && Number(pricePerNight) <= 0) {
            toast.error('Price per night must be greater than 0');
            return false;
        }
        if (totalRooms && Number(totalRooms) <= 0) {
            toast.error('Total rooms must be greater than 0');
            return false;
        }
        return true;
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);

        try {
            const selectedAmenities = Object.keys(amenities).filter((key) => amenities[key]);

            const formData = new FormData();
            if (hotImg) formData.append('image', hotImg);
            galleryImages.forEach((image) => formData.append('galleryImages', image));
            formData.append('name', name);
            formData.append('email', email);
            formData.append('about', about);
            formData.append('pricePerNight', Number(pricePerNight));
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));
            formData.append('amenities', JSON.stringify(selectedAmenities));
            formData.append('location', location);
            formData.append('totalRooms', Number(totalRooms));
            
            // Ensure roomTypes is properly formatted
            const formattedRoomTypes = roomTypes.map(roomType => ({
                ...roomType,
                price: Number(roomType.price),
                quantity: Number(roomType.quantity)
            }));
            formData.append('roomTypes', JSON.stringify(formattedRoomTypes));

            const { data } = await axios.put(`${backendUrl}/api/hotel/update`, formData, {
                headers: { hToken, 'Content-Type': 'multipart/form-data' },
            });

            if (data.success) {
                toast.success('Profile updated successfully');
                await getHotelDetails();
                setHotImg(null);
                setGalleryImages([]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
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

    const removeExistingGalleryImage = (index) => {
        setExistingGalleryImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);
            formData.append("location", location);
            formData.append("about", about);
            formData.append("pricePerNight", pricePerNight);
            formData.append("totalRooms", totalRooms);
            formData.append("address[line1]", address1);
            formData.append("address[line2]", address2);
            formData.append("roomTypes", JSON.stringify(roomTypes));
            // ... existing code ...
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
            </div>
        );
    }

    if (error || !hotelData) {
        return (
            <div className="container mx-auto p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Update Hotel Profile</h2>
                <p className="text-red-500">{error || 'Unable to load hotel profile.'}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Update Hotel Profile</h2>
            <form onSubmit={onSubmitHandler} className="card max-w-5xl">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Hotel Image</label>
                    <div className="flex items-center gap-4">
                        <img
                            className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                            src={hotImg ? URL.createObjectURL(hotImg) : hotelData.image}
                            alt="Hotel"
                        />
                        <input
                            onChange={(e) => setHotImg(e.target.files[0])}
                            type="file"
                            accept="image/*"
                            className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                    <input
                        onChange={handleGalleryChange}
                        type="file"
                        accept="image/*"
                        multiple
                        className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <div className="flex flex-wrap gap-4 mt-4">
                        {existingGalleryImages.map((image, index) => (
                            <div key={index} className="relative">
                                <img
                                    className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                                    src={image}
                                    alt={`Gallery ${index}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeExistingGalleryImage(index)}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        {galleryImages.map((image, index) => (
                            <div key={index} className="relative">
                                <img
                                    className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                                    src={URL.createObjectURL(image)}
                                    alt={`Gallery ${index}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
                        <input
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            type="text"
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <select
                            onChange={(e) => setLocation(e.target.value)}
                            value={location}
                            className="input-field"
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price Per Night (Rs)</label>
                        <input
                            onChange={(e) => setPricePerNight(e.target.value)}
                            value={pricePerNight}
                            type="number"
                            className="input-field"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Rooms</label>
                        <input
                            onChange={(e) => setTotalRooms(e.target.value)}
                            value={totalRooms}
                            type="number"
                            className="input-field"
                            min="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                        <input
                            onChange={(e) => setAddress1(e.target.value)}
                            value={address1}
                            type="text"
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                        <input
                            onChange={(e) => setAddress2(e.target.value)}
                            value={address2}
                            type="text"
                            className="input-field"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.keys(amenities).map((amenity) => (
                                <label key={amenity} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={amenities[amenity]}
                                        onChange={() => handleAmenityChange(amenity)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-600">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">About Hotel</label>
                        <textarea
                            onChange={(e) => setAbout(e.target.value)}
                            value={about}
                            className="input-field"
                            rows="6"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Types</label>
                        <div className="space-y-4">
                            {roomTypes.map((roomType, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={roomType.name}
                                                onChange={(e) => {
                                                    const newRoomTypes = [...roomTypes];
                                                    newRoomTypes[index].name = e.target.value;
                                                    setRoomTypes(newRoomTypes);
                                                }}
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                                            <input
                                                type="number"
                                                value={roomType.price}
                                                onChange={(e) => {
                                                    const newRoomTypes = [...roomTypes];
                                                    newRoomTypes[index].price = e.target.value;
                                                    setRoomTypes(newRoomTypes);
                                                }}
                                                className="input-field"
                                                min="0"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea
                                                value={roomType.description}
                                                onChange={(e) => {
                                                    const newRoomTypes = [...roomTypes];
                                                    newRoomTypes[index].description = e.target.value;
                                                    setRoomTypes(newRoomTypes);
                                                }}
                                                className="input-field"
                                                rows="2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                value={roomType.quantity}
                                                onChange={(e) => {
                                                    const newRoomTypes = [...roomTypes];
                                                    newRoomTypes[index].quantity = e.target.value;
                                                    setRoomTypes(newRoomTypes);
                                                }}
                                                className="input-field"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities (comma-separated)</label>
                                            <input
                                                type="text"
                                                value={roomType.amenities.join(", ")}
                                                onChange={(e) => {
                                                    const newRoomTypes = [...roomTypes];
                                                    newRoomTypes[index].amenities = e.target.value.split(",").map(a => a.trim());
                                                    setRoomTypes(newRoomTypes);
                                                }}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newRoomTypes = roomTypes.filter((_, i) => i !== index);
                                                setRoomTypes(newRoomTypes);
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 border rounded-lg p-4">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Room Type</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={newRoomType.name}
                                        onChange={(e) => setNewRoomType({ ...newRoomType, name: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                                    <input
                                        type="number"
                                        value={newRoomType.price}
                                        onChange={(e) => setNewRoomType({ ...newRoomType, price: e.target.value })}
                                        className="input-field"
                                        min="0"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={newRoomType.description}
                                        onChange={(e) => setNewRoomType({ ...newRoomType, description: e.target.value })}
                                        className="input-field"
                                        rows="2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        value={newRoomType.quantity}
                                        onChange={(e) => setNewRoomType({ ...newRoomType, quantity: e.target.value })}
                                        className="input-field"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={newRoomType.amenities.join(", ")}
                                        onChange={(e) => setNewRoomType({ ...newRoomType, amenities: e.target.value.split(",").map(a => a.trim()) })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newRoomType.name && newRoomType.price && newRoomType.description && newRoomType.quantity) {
                                            setRoomTypes([...roomTypes, newRoomType]);
                                            setNewRoomType({
                                                name: "",
                                                price: "",
                                                description: "",
                                                quantity: "",
                                                amenities: []
                                            });
                                        }
                                    }}
                                    className="btn-primary"
                                >
                                    Add Room Type
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-8 btn-primary w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                            </svg>
                            Updating...
                        </span>
                    ) : (
                        'Update Profile'
                    )}
                </button>
            </form>
        </div>
    );
};

export default HotelProfile;