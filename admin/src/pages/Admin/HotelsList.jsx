import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { FaHotel, FaMapMarkerAlt, FaBed, FaMoneyBillWave, FaFilter, FaSpinner } from 'react-icons/fa';

const HotelsList = () => {
    const { hotels, aToken, getAllHotels, changeAvailability } = useContext(AdminContext);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (aToken) {
            loadHotels();
        }
    }, [aToken]);

    const loadHotels = async () => {
        setIsLoading(true);
        try {
            await getAllHotels();
        } catch (error) {
            toast.error('Failed to load hotels');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAvailability = async (hotId) => {
        try {
            await changeAvailability(hotId);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to toggle availability');
        }
    };

    const filteredHotels = hotels.filter(hotel => {
        if (filter === 'Available') return hotel.available;
        if (filter === 'Unavailable') return !hotel.available;
        return true;
    }).filter(hotel =>
        searchTerm === '' ||
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pt-16 pl-64 pr-8 min-h-screen bg-gray-50">
            <div className="p-4">
                <div className="mx-4">
                    <div className="flex items-center gap-3 mb-6">
                        <FaHotel className="text-3xl text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-800">Hotels List</h1>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-5">
                        {/* Search and Filter Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search hotels..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaFilter className="text-gray-400" />
                                    </div>
                                </div>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Hotels</option>
                                    <option value="Available">Available</option>
                                    <option value="Unavailable">Unavailable</option>
                                </select>
                            </div>
                            <button
                                onClick={loadHotels}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>

                        {/* Hotels Grid */}
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
                            </div>
                        ) : filteredHotels.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No hotels found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredHotels.map((hotel) => (
                                    <div
                                        key={hotel._id}
                                        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-100"
                                    >
                                        <div className="relative">
                                            <img
                                                className="w-full h-48 object-cover"
                                                src={hotel.image}
                                                alt={hotel.name}
                                            />
                                            <div className={`absolute top-3 right-3 ${hotel.available ? 'bg-green-500' : 'bg-red-500'} text-white text-xs font-medium px-2 py-1 rounded-full`}>
                                                {hotel.available ? 'Available' : 'Unavailable'}
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <h2 className="text-lg font-semibold text-gray-800 mb-2">{hotel.name}</h2>
                                            
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-gray-600">
                                                    <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                                                    <span className="text-sm">{hotel.location}</span>
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <FaBed className="w-4 h-4 mr-2" />
                                                    <span className="text-sm">{hotel.totalRooms} Rooms</span>
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <FaMoneyBillWave className="w-4 h-4 mr-2" />
                                                    <span className="text-sm">₹{hotel.pricePerNight}/night</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={hotel.available}
                                                        onChange={() => handleToggleAvailability(hotel._id)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${hotel.available ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                                        <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${hotel.available ? 'translate-x-5' : ''}`} />
                                                    </div>
                                                    <span className="ml-3 text-sm text-gray-600">Available</span>
                                                </label>
                                            </div>

                                            {hotel.amenities && hotel.amenities.length > 0 && (
                                                <div className="mt-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {hotel.amenities.slice(0, 3).map((amenity, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
                                                            >
                                                                {amenity}
                                                            </span>
                                                        ))}
                                                        {hotel.amenities.length > 3 && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                +{hotel.amenities.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelsList;