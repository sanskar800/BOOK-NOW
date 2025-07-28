import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaHotel, FaUser, FaCalendarAlt, FaMoneyBillWave, FaFilter, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AllBookings = () => {
    const { backendUrl, aToken } = useContext(AdminContext);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const checkPaymentStatusWithRetry = async (bookingId, retries = 2, delay = 2000) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const { data } = await axios.get(
                    `${backendUrl}/api/booking/check-payment-status/${bookingId}`,
                    { headers: { atoken: aToken } }
                );
                if (data.success) {
                    if (data.paymentStatus === 'Completed' || data.paymentStatus === 'Failed') {
                        return data.paymentStatus;
                    }
                }
            } catch (error) {
                console.error(`Check Payment Status - Attempt ${attempt + 1} failed for booking ${bookingId}:`, error);
            }
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        const booking = bookings.find(b => b._id === bookingId);
        return booking ? booking.paymentStatus : 'Pending';
    };

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            // For Active bookings and Completed bookings, we need to fetch all and filter on frontend
            const { data } = await axios.get(`${backendUrl}/api/booking/all-bookings`, {
                headers: { atoken: aToken },
                // Only send status param for Cancelled bookings
                params: { status: filter === 'Cancelled' ? 'Cancelled' : undefined },
            });

            if (data.success) {
                let processedBookings = await Promise.all(
                    data.bookings.map(async (booking) => {
                        if (booking.paymentOption === 'pay_online' && booking.paymentStatus !== 'Completed') {
                            const updatedStatus = await checkPaymentStatusWithRetry(booking._id);
                            return { ...booking, paymentStatus: updatedStatus };
                        }
                        return booking;
                    })
                );

                // Filter bookings based on selected filter
                if (filter !== 'All' && filter !== 'Cancelled') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    processedBookings = processedBookings.filter(booking => {
                        // Skip cancelled bookings for all other filters
                        if (booking.status === 'Cancelled') return false;

                        const checkInDate = new Date(booking.checkInDate);
                        const checkOutDate = new Date(booking.checkOutDate);
                        checkInDate.setHours(0, 0, 0, 0);
                        checkOutDate.setHours(0, 0, 0, 0);

                        switch (filter) {
                            case 'Active':
                                // Current bookings: check-in date has passed but check-out date hasn't
                                return checkInDate <= today && checkOutDate >= today;
                            case 'Upcoming':
                                // Upcoming bookings: check-in date is in the future
                                return checkInDate > today;
                            case 'Completed':
                                // Completed bookings: check-out date has passed
                                return checkOutDate < today;
                            default:
                                return true;
                        }
                    });
                }

                setBookings(processedBookings);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                navigate('/login');
            } else {
                toast.error(error.response?.data?.message || 'Failed to fetch bookings');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const { data } = await axios.delete(`${backendUrl}/api/booking/bookings/${bookingId}`, {
                headers: { atoken: aToken },
            });
            if (data.success) {
                toast.success(data.message);
                fetchBookings();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const getBookingStatus = (booking) => {
        if (booking.status === 'Cancelled') return 'Cancelled';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(booking.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        const checkOutDate = new Date(booking.checkOutDate);
        checkOutDate.setHours(0, 0, 0, 0);

        if (checkOutDate < today) return 'Completed';
        if (checkInDate > today) return 'Upcoming';
        return 'Active';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Upcoming':
                return 'bg-blue-100 text-blue-800';
            case 'Completed':
                return 'bg-gray-100 text-gray-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="pt-16 pl-64 pr-8 min-h-screen bg-gray-50">
            <div className="p-4">
                <div className="mx-4">
                    <div className="flex items-center gap-3 mb-6">
                        <FaHotel className="text-3xl text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-800">All Bookings</h1>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <FaFilter className="text-blue-600" />
                                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="All">All Bookings</option>
                                    <option value="Active">Current</option>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button
                                onClick={fetchBookings}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No bookings found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[22%]">Guest</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Dates</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[17%]">Details</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%]">Booked On</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Payment</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
                                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {bookings.map((booking) => (
                                            <tr key={booking._id} className="hover:bg-gray-50">
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center">
                                                        <FaUser className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                        <div className="ml-2 text-sm font-medium text-gray-900 whitespace-nowrap">{booking.userId?.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center">
                                                        <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                                                        <div className="ml-2">
                                                            <div className="text-sm text-gray-900">
                                                                {new Date(booking.checkInDate).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(booking.checkOutDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="text-sm text-gray-900">{booking.roomQuantity} rooms</div>
                                                        <div className="text-sm text-gray-500 whitespace-nowrap">
                                                            {typeof booking.totalAmount === 'number' && !isNaN(booking.totalAmount)
                                                                ? `Rs. ${booking.totalAmount.toFixed(2)}`
                                                                : 'Rs. N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(booking.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(booking.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <FaMoneyBillWave className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                                                            booking.paymentOption === 'pay_online' && booking.paymentStatus === 'Completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : booking.paymentOption === 'pay_online' && booking.paymentStatus === 'Pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : booking.paymentOption === 'pay_later'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {booking.paymentOption === 'pay_online' ? 'Online' : 'On Arrival'} - {booking.paymentOption === 'pay_online' ? booking.paymentStatus : 'Pending'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        getStatusColor(getBookingStatus(booking))
                                                    }`}>
                                                        {getBookingStatus(booking)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 text-right">
                                                    {booking.status === 'Active' && (
                                                        <button
                                                            onClick={() => handleCancelBooking(booking._id)}
                                                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllBookings;