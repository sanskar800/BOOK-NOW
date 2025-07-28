import React, { useContext, useEffect, useState } from 'react';
import { HotelContext } from '../../context/HotelContext';
import { toast } from 'react-toastify';
import { format, parseISO, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { FaSort, FaSortUp, FaSortDown, FaCalendarAlt, FaUser, FaHotel, FaMoneyBillWave, FaTrash, FaFilter, FaEye, FaEyeSlash } from 'react-icons/fa';

const HotelBookings = () => {
    const { getHotelBookings, cancelBooking } = useContext(HotelContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelled, setShowCancelled] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc');
    const [activeTab, setActiveTab] = useState('all');

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await getHotelBookings();
            console.log('Bookings response:', response);
            
            if (response.success) {
                setBookings(response.bookings || []);
            } else {
                setBookings([]);
                toast.error(response.message || 'Failed to load bookings');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This will mark the booking as cancelled and notify the guest.')) return;
        const success = await cancelBooking(bookingId);
        if (success) {
            await fetchBookings();
            toast.success('Booking marked as cancelled and guest has been notified');
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Helper function to categorize bookings based on today's date
    const categorizeBookings = (booking) => {
        const today = new Date();
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);

        // Check if booking is cancelled
        if (booking.status?.toLowerCase() === 'cancelled') {
            return 'cancelled';
        }

        // Upcoming: CheckIn date is in future
        if (isAfter(checkInDate, today)) {
            return 'upcoming';
        }
        
        // Active: Today is between checkIn and checkOut
        if (isWithinInterval(today, { start: checkInDate, end: checkOutDate })) {
            return 'active';
        }
        
        // Completed: CheckOut date is in past
        if (isBefore(checkOutDate, today)) {
            return 'completed';
        }

        // Default case - should not happen, but just in case
        return 'all';
    };

    const formatCancelledInfo = (booking) => {
        if (!booking.cancelledAt) return 'Cancelled';
        
        const cancelDate = new Date(booking.cancelledAt);
        const formattedDate = format(cancelDate, 'MMM dd, yyyy h:mm a');
        
        let cancelledBy = 'System';
        switch(booking.cancelledBy) {
            case 'user':
                cancelledBy = 'Customer';
                break;
            case 'hotel':
                cancelledBy = 'Hotel';
                break;
            case 'admin':
                cancelledBy = 'Admin';
                break;
            default:
                cancelledBy = 'System';
        }
        
        return `Cancelled by ${cancelledBy} on ${formattedDate}`;
    };

    // Sort bookings
    const sortedBookings = [...(bookings || [])].sort((a, b) => {
        const dateA = new Date(a.checkInDate);
        const dateB = new Date(b.checkInDate);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Filter bookings by category and exclude cancelled bookings from main views
    const filteredBookings = sortedBookings.filter(booking => {
        // For cancelled tab, show only cancelled
        if (activeTab === 'cancelled') {
            return booking.status?.toLowerCase() === 'cancelled';
        }
        
        // For other tabs, exclude cancelled bookings
        if (booking.status?.toLowerCase() === 'cancelled') {
            return false;
        }
        
        // For all tab, show everything non-cancelled
        if (activeTab === 'all') {
            return true;
        }
        
        // Filter by category
        return categorizeBookings(booking) === activeTab;
    });

    // Count bookings by category for showing counts in tabs
    const bookingCounts = sortedBookings.reduce((acc, booking) => {
        const category = categorizeBookings(booking);
        acc[category] = (acc[category] || 0) + 1;
        // Add to all count if not cancelled
        if (category !== 'cancelled') {
            acc.all = (acc.all || 0) + 1;
        }
        return acc;
    }, { all: 0, upcoming: 0, active: 0, completed: 0, cancelled: 0 });

    const getStatusBadge = (booking) => {
        const category = categorizeBookings(booking);
        
        switch(category) {
            case 'upcoming':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Upcoming</span>;
            case 'active':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
            case 'completed':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Completed</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Hotel Bookings</h1>
                <div className="flex items-center gap-2">
                    <label className="text-gray-600">Sort:</label>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>
                </div>
            </div>
            
            {/* Booking category tabs */}
            <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2 border-b">
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'all' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All
                        <span className="ml-2 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                            {bookingCounts.all || 0}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'upcoming' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Upcoming
                        <span className="ml-2 bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs">
                            {bookingCounts.upcoming || 0}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'active' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Active
                        <span className="ml-2 bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs">
                            {bookingCounts.active || 0}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'completed' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Completed
                        <span className="ml-2 bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                            {bookingCounts.completed || 0}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('cancelled')}
                        className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'cancelled' 
                            ? 'text-blue-600 border-b-2 border-blue-600' 
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Cancelled
                        <span className="ml-2 bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs">
                            {bookingCounts.cancelled || 0}
                        </span>
                    </button>
                </div>
            </div>

            {filteredBookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">No {activeTab !== 'all' ? activeTab : ''} bookings found</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {/* Bookings List */}
                    {filteredBookings.map((booking) => {
                        const isBookingCancelled = booking.status?.toLowerCase() === 'cancelled';
                        
                        return (
                            <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
                                {isBookingCancelled && (
                                    <div className="absolute top-0 right-0 z-10">
                                        <div className="bg-red-500 text-white px-6 py-1 text-sm font-bold transform origin-top-right rotate-0">
                                            CANCELLED
                                        </div>
                                    </div>
                                )}
                                
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-lg">Booking #{booking._id.substr(-6)}</h3>
                                            {!isBookingCancelled && getStatusBadge(booking)}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Booked on {format(new Date(booking.createdAt || Date.now()), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="flex items-center">
                                            <div className={`${isBookingCancelled ? 'bg-red-100' : 'bg-blue-100'} rounded-full p-3 mr-3`}>
                                                <FaCalendarAlt className={`${isBookingCancelled ? 'text-red-500' : 'text-blue-500'} text-xl`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Check-in</p>
                                                <p className={`font-medium ${isBookingCancelled ? 'line-through decoration-red-500' : ''}`}>
                                                    {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className={`${isBookingCancelled ? 'bg-red-100' : 'bg-blue-100'} rounded-full p-3 mr-3`}>
                                                <FaCalendarAlt className={`${isBookingCancelled ? 'text-red-500' : 'text-blue-500'} text-xl`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Check-out</p>
                                                <p className={`font-medium ${isBookingCancelled ? 'line-through decoration-red-500' : ''}`}>
                                                    {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className={`${isBookingCancelled ? 'bg-red-100' : 'bg-blue-100'} rounded-full p-3 mr-3`}>
                                                <FaUser className={`${isBookingCancelled ? 'text-red-500' : 'text-blue-500'} text-xl`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Guest</p>
                                                <p className="font-medium">{booking.userId?.name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{booking.userId?.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className={`${isBookingCancelled ? 'bg-red-100' : 'bg-blue-100'} rounded-full p-3 mr-3`}>
                                                <FaMoneyBillWave className={`${isBookingCancelled ? 'text-red-500' : 'text-blue-500'} text-xl`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Amount</p>
                                                <p className={`font-medium ${isBookingCancelled ? 'line-through decoration-red-500' : ''}`}>
                                                    ₹{booking.totalAmount}
                                                </p>
                                                <p className="text-xs">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        booking.paymentStatus === 'Completed' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : booking.paymentStatus === 'Failed'
                                                                ? 'bg-red-100 text-red-800'
                                                                : booking.paymentStatus === 'Refunded'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {booking.paymentStatus}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center">
                                            <div className="bg-gray-100 rounded-full p-2 mr-3">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Room Type</p>
                                                <p className="font-medium">{booking.roomType}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="bg-gray-100 rounded-full p-2 mr-3">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Quantity</p>
                                                <p className="font-medium">{booking.roomQuantity} rooms</p>
                                            </div>
                                        </div>
                                    </div>

                                    {isBookingCancelled && (
                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                            <p className="text-sm text-red-500 font-medium">{formatCancelledInfo(booking)}</p>
                                            {booking.cancellationReason && (
                                                <p className="text-sm text-gray-600 mt-1">Reason: {booking.cancellationReason}</p>
                                            )}
                                        </div>
                                    )}

                                    {!isBookingCancelled && categorizeBookings(booking) !== 'completed' && (
                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={() => handleCancelBooking(booking._id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Cancel Booking</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HotelBookings;