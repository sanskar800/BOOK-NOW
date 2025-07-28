import React, { useState, useEffect, useContext } from 'react';
import { HotelContext } from '../../context/HotelContext';
import { toast } from 'react-toastify';
import { FaHotel, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaChartLine, FaStar } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import NotificationCard from '../../components/NotificationCard';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Link } from 'react-router-dom';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const HotelDashboard = () => {
    const { getHotelDetails, getHotelBookings } = useContext(HotelContext);
    const [hotelDetails, setHotelDetails] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTimeRange, setSelectedTimeRange] = useState('week');
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `₹${context.parsed.y.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                ticks: {
                    callback: (value) => `₹${value.toLocaleString()}`
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        },
        elements: {
            line: {
                tension: 0.4
            },
            point: {
                radius: 4,
                hoverRadius: 6
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('Starting to fetch hotel data...');
            
            // Get hotel details first
            const hotelResponse = await getHotelDetails();
            
            if (!hotelResponse.success || !hotelResponse.hotel) {
                toast.error('Failed to load hotel details');
                setLoading(false);
                return;
            }
            
            console.log('Successfully loaded hotel details:', hotelResponse.hotel);
            setHotelDetails(hotelResponse.hotel);
            
            // Fetch notifications after hotel details are loaded
            await fetchNotifications();
            
            // Get bookings data
            const bookingsResponse = await getHotelBookings();
            if (bookingsResponse.success) {
                console.log('Successfully loaded bookings:', bookingsResponse.bookings);
                console.log('Sample booking dates:', bookingsResponse.bookings.map(b => ({
                    id: b._id,
                    checkInDate: b.checkInDate,
                    amount: b.totalAmount,
                    status: b.status,
                    paymentStatus: b.paymentStatus
                })));
                setBookings(bookingsResponse.bookings);
            } else {
                console.error('Failed to load bookings:', bookingsResponse);
            }

            // Fetch reviews to get average rating
            try {
                const reviewsResponse = await axios.get(`http://localhost:4000/api/reviews/hotel/${hotelResponse.hotel._id}`);
                if (reviewsResponse.data.success) {
                    setHotelDetails(prev => ({
                        ...prev,
                        averageRating: Number(reviewsResponse.data.averageRating) || 0,
                        reviewCount: reviewsResponse.data.count || 0
                    }));
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error in fetchData:', error);
            toast.error('Failed to load dashboard data');
            setLoading(false);
        }
    };

    // Connect socket when hotel details are available
    useEffect(() => {
        try {
            if (hotelDetails?._id) {
                console.log('Setting up socket connection for hotel:', hotelDetails._id);
                const hToken = localStorage.getItem('hToken');
                
                const newSocket = io(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}`, {
                    withCredentials: true,
                    auth: {
                        hToken: hToken,
                        type: 'hotel'
                    }
                });

                newSocket.on('connect', () => {
                    console.log('Socket connected successfully');
                    // Identify as a hotel connection
                    newSocket.emit('identify', {
                        type: 'hotel',
                        id: hotelDetails._id
                    });
                    fetchNotifications();
                });

                newSocket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error);
                    toast.error('Failed to connect to notification service');
                });

                // Listen for new notifications
                newSocket.on('newNotification', (notification) => {
                    console.log('Received new notification:', notification);
                    // Verify this notification is for this hotel
                    if (notification.recipient === hotelDetails._id) {
                        setNotifications(prev => {
                            // Add new notification at the beginning
                            const updated = [notification, ...prev];
                            // Sort by date, newest first
                            return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        });
                        
                        // Show toast based on notification type
                        const toastMessage = `${notification.title}: ${notification.message}`;
                        switch (notification.type) {
                            case 'BOOKING':
                                toast.info(toastMessage);
                                break;
                            case 'PAYMENT':
                                toast.success(toastMessage);
                                break;
                            case 'SYSTEM':
                                toast.warning(toastMessage);
                                break;
                            default:
                                toast.info(toastMessage);
                        }
                    }
                });

                setSocket(newSocket);

                return () => {
                    if (newSocket) {
                        console.log('Disconnecting socket');
                        newSocket.disconnect();
                    }
                };
            }
        } catch (error) {
            console.error('Error in socket connection setup:', error);
            toast.error('Failed to setup notification service');
        }
    }, [hotelDetails]);

    const fetchNotifications = async () => {
        if (!hotelDetails?._id) {
            console.log('Cannot fetch notifications: Hotel ID not available');
            return;
        }

        try {
            console.log('Fetching notifications for hotel:', hotelDetails._id);
            
            const hToken = localStorage.getItem('hToken');
            if (!hToken) {
                console.error('No hotel token found');
                return;
            }

            // Remove any admin token from localStorage to prevent interference
            localStorage.removeItem('aToken');
            
            // Make sure we're only sending the hotel token
            delete axios.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['aToken'];
            delete axios.defaults.headers.common['token'];

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/notifications`, {
                headers: {
                    'hToken': hToken
                },
                params: {
                    recipient: hotelDetails._id
                }
            });
            
            if (response.data.success) {
                // Sort notifications by date, newest first
                const sortedNotifications = response.data.notifications.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                
                setNotifications(sortedNotifications);
                console.log(`Loaded ${sortedNotifications.length} notifications for hotel`);
            } else {
                console.error('Failed to fetch notifications:', response.data.message);
                toast.error('Failed to load notifications');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                toast.error(error.response.data.message || 'Failed to load notifications');
            } else if (error.request) {
                console.error('No response received:', error.request);
                toast.error('Could not connect to notification service');
            } else {
                console.error('Error setting up request:', error.message);
                toast.error('Failed to set up notification request');
            }
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const hToken = localStorage.getItem('hToken');
            console.log(`Marking notification ${notificationId} as read`);
            
            // Remove any admin token from localStorage to prevent interference
            localStorage.removeItem('aToken');
            
            // Make sure we're only sending the hotel token
            delete axios.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['aToken'];
            delete axios.defaults.headers.common['token'];
            
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        'hToken': hToken
                    }
                }
            );
            
            if (response.data.success) {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif._id === notificationId 
                            ? { ...notif, read: true } 
                            : notif
                    )
                );
                console.log(`Notification ${notificationId} marked as read`);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const hToken = localStorage.getItem('hToken');
            console.log('Marking all notifications as read');
            
            // Remove any admin token from localStorage to prevent interference
            localStorage.removeItem('aToken');
            
            // Make sure we're only sending the hotel token
            delete axios.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['aToken'];
            delete axios.defaults.headers.common['token'];
            
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/notifications/mark-all-read`,
                {},
                {
                    headers: {
                        'hToken': hToken
                    }
                }
            );
            
            if (response.data.success) {
                setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                );
                console.log('All notifications marked as read');
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast.error('Failed to mark all notifications as read');
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            const hToken = localStorage.getItem('hToken');
            console.log(`Deleting notification ${notificationId}`);
            
            // Remove any admin token from localStorage to prevent interference
            localStorage.removeItem('aToken');
            
            // Make sure we're only sending the hotel token
            delete axios.defaults.headers.common['Authorization'];
            delete axios.defaults.headers.common['aToken'];
            delete axios.defaults.headers.common['token'];
            
            const response = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/notifications/${notificationId}`,
                {
                    headers: {
                        'hToken': hToken
                    }
                }
            );
            
            if (response.data.success) {
                setNotifications(prev => 
                    prev.filter(notif => notif._id !== notificationId)
                );
                console.log(`Notification ${notificationId} deleted`);
                toast.success('Notification deleted');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const calculateStats = () => {
        console.log('Current bookings:', bookings);
        console.log('Current hotel details:', hotelDetails);

        // Include both active and completed bookings
        const validBookings = bookings.filter(
            booking => booking.paymentStatus !== 'Refunded' && 
                      booking.status !== 'Cancelled' &&
                      (booking.paymentStatus === 'Completed' || booking.status === 'Active')
        );
        
        console.log('Valid bookings for stats:', validBookings.length);

        const totalBookings = validBookings.length;
        const totalRevenue = validBookings.reduce((sum, booking) => sum + (parseFloat(booking.totalAmount) || 0), 0);
        const averageRating = hotelDetails?.averageRating || 0;
        const occupancyRate = calculateOccupancyRate(validBookings);

        console.log('Calculated stats:', {
            totalBookings,
            totalRevenue,
            averageRating,
            occupancyRate
        });

        return {
            totalBookings,
            totalRevenue,
            averageRating,
            occupancyRate
        };
    };

    const calculateOccupancyRate = (activeBookings = null) => {
        if (!hotelDetails) return 0;
        
        // Use the passed activeBookings array or filter the bookings if not provided
        const bookingsToCalculate = activeBookings || bookings.filter(
            booking => booking.status !== 'Cancelled' && booking.paymentStatus !== 'Refunded'
        );
        
        if (!bookingsToCalculate.length) return 0;
        
        const totalRooms = hotelDetails.totalRooms || 1;
        const totalBookedRooms = bookingsToCalculate.reduce((sum, booking) => sum + (parseInt(booking.roomQuantity) || 0), 0);
        
        const rate = Math.min(100, Math.round((totalBookedRooms / totalRooms) * 100));
        console.log('Occupancy rate calculation:', {
            totalRooms,
            totalBookedRooms,
            rate
        });
        
        return rate;
    };

    const getRevenueChartData = () => {
        const labels = [];
        const data = [];

        // Include both active and completed bookings, exclude only cancelled and refunded ones
        const validBookings = bookings.filter(
            booking => booking.paymentStatus !== 'Refunded' && 
                      booking.status !== 'Cancelled'
        );

        console.log('Valid bookings for revenue calculation:', validBookings.map(b => ({
            id: b._id,
            checkInDate: b.checkInDate,
            amount: b.totalAmount,
            status: b.status,
            paymentStatus: b.paymentStatus
        })));

        // Sort bookings by check-in date
        const sortedBookings = [...validBookings].sort((a, b) => 
            new Date(a.checkInDate) - new Date(b.checkInDate)
        );

        // Group bookings by date
        const bookingsByDate = {};
        sortedBookings.forEach(booking => {
            const date = new Date(booking.checkInDate);
            const dateKey = date.toISOString().split('T')[0];
            if (!bookingsByDate[dateKey]) {
                bookingsByDate[dateKey] = 0;
            }
            bookingsByDate[dateKey] += parseFloat(booking.totalAmount) || 0;
        });

        console.log('Bookings grouped by date:', bookingsByDate);

        // Generate labels and data based on the actual booking dates
        const dates = Object.keys(bookingsByDate).sort();
        if (dates.length > 0) {
            switch (selectedTimeRange) {
                case 'week':
                    // Show the last 7 days with bookings
                    const lastSevenDates = dates.slice(-7);
                    lastSevenDates.forEach(date => {
                        const d = new Date(date);
                        labels.push(d.toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric'
                        }));
                        data.push(bookingsByDate[date]);
                    });
                    break;

                case 'month':
                    // Show the last 30 days with bookings
                    const lastThirtyDates = dates.slice(-30);
                    lastThirtyDates.forEach(date => {
                        const d = new Date(date);
                        labels.push(d.toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric'
                        }));
                        data.push(bookingsByDate[date]);
                    });
                    break;

                case 'year':
                    // Group by months
                    const monthlyRevenue = {};
                    dates.forEach(date => {
                        const d = new Date(date);
                        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
                        if (!monthlyRevenue[monthKey]) {
                            monthlyRevenue[monthKey] = 0;
                        }
                        monthlyRevenue[monthKey] += bookingsByDate[date];
                    });

                    // Get last 12 months
                    const monthKeys = Object.keys(monthlyRevenue).sort().slice(-12);
                    monthKeys.forEach(monthKey => {
                        const [year, month] = monthKey.split('-');
                        const d = new Date(parseInt(year), parseInt(month));
                        labels.push(d.toLocaleDateString('en-US', { 
                            month: 'short',
                            year: 'numeric'
                        }));
                        data.push(monthlyRevenue[monthKey]);
                    });
                    break;

                default:
                    // Default to week view
                    const defaultDates = dates.slice(-7);
                    defaultDates.forEach(date => {
                        const d = new Date(date);
                        labels.push(d.toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric'
                        }));
                        data.push(bookingsByDate[date]);
                    });
            }
        }

        // Ensure we have valid data
        let hasData = data.some(value => value > 0);
        
        console.log('Final revenue data:', {
            labels,
            data,
            hasData
        });

        // If no data, show empty chart with appropriate labels
        if (!hasData || labels.length === 0) {
            console.log('No revenue data available for the selected period');
            // Generate default labels based on selected time range
            const defaultLabels = [];
            const now = new Date();
            const daysToShow = selectedTimeRange === 'month' ? 30 : 7;

            for (let i = daysToShow - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                defaultLabels.push(date.toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric'
                }));
            }

            return {
                labels: defaultLabels,
                datasets: [
                    {
                        label: selectedTimeRange === 'year' ? 'Monthly Revenue (₹)' : 'Daily Revenue (₹)',
                        data: Array(defaultLabels.length).fill(0),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        tension: 0.4,
                        fill: true,
                    }
                ]
            };
        }

        return {
            labels,
            datasets: [
                {
                    label: selectedTimeRange === 'year' ? 'Monthly Revenue (₹)' : 'Daily Revenue (₹)',
                    data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.4,
                    fill: true,
                }
            ]
        };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex space-x-4">
                    <select
                        value={selectedTimeRange}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Bookings</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalBookings}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FaCalendarAlt className="text-blue-500 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <FaMoneyBillWave className="text-green-500 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Occupancy Rate</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.occupancyRate}%</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <FaHotel className="text-purple-500 text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Average Rating</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.averageRating.toFixed(1)}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <FaStar className="text-yellow-500 text-xl" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 h-[400px]">
                    <h3 className="text-xl font-semibold mb-4">Revenue Trend</h3>
                    <div className="h-[300px]">
                        <Line
                            data={getRevenueChartData()}
                            options={chartOptions}
                            height={240}
                        />
                    </div>
                </div>

                <div className="col-span-1">
                    <NotificationCard
                        notifications={notifications}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onDelete={handleDeleteNotification}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                        Hotel ID: {hotelDetails?._id || 'Not loaded'} | 
                        Notifications: {notifications.length} | 
                        Socket Connected: {socket ? 'Yes' : 'No'}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Recent Bookings</h2>
                    <Link to="/bookings" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                        View All Bookings →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...bookings]
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .slice(0, 5)
                                .map((booking) => (
                                <tr key={booking._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover"
                                                    src={booking.userId?.image || "https://via.placeholder.com/40?text=Guest"}
                                                    alt={booking.userId?.name || 'Guest'}
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {booking.userId?.name || 'Guest'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {booking.userId?.email || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {booking.roomQuantity} × {booking.roomType}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            booking.status === 'Active' 
                                                ? 'bg-green-100 text-green-800'
                                                : booking.status === 'Cancelled'
                                                ? 'bg-red-100 text-red-800'
                                                : booking.status === 'Completed'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            booking.paymentStatus === 'Completed'
                                                ? 'bg-green-100 text-green-800'
                                                : booking.paymentStatus === 'Pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : booking.paymentStatus === 'Refunded'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {booking.paymentStatus}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {booking.paymentOption === 'pay_online' ? 'Online Payment' : 'Pay at Hotel'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-medium text-gray-900">₹{booking.totalAmount.toLocaleString()}</div>
                                        <div className="text-xs text-gray-500">
                                            {booking.paymentStatus === 'Completed' ? 'Paid' : 
                                             booking.paymentStatus === 'Refunded' ? 'Refunded' : 
                                             'Pending'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No bookings found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HotelDashboard;