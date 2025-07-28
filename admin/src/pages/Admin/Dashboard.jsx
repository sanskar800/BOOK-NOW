import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Card, Row, Col, Table, Container } from 'react-bootstrap';
import { FaHotel, FaCheckCircle, FaBookmark, FaRupeeSign } from 'react-icons/fa';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
    const { backendUrl, aToken } = useContext(AdminContext);
    const [stats, setStats] = useState({
        totalHotels: 0,
        activeHotels: 0,
        totalBookings: 0,
        totalRevenue: 0,
        bookingTrends: [],
        recentBookings: [],
        topHotels: [],
        categoryRevenue: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!aToken) {
                setError('Authentication token not found');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data } = await axios.get(`${backendUrl}/api/admin/dashboard-stats`, {
                    headers: {
                        'atoken': aToken
                    }
                });
                console.log('Dashboard stats response:', data);
                
                if (data.success) {
                    // Process the dates for booking trends
                    const processedStats = {
                        ...data.stats,
                        bookingTrends: data.stats.bookingTrends.map(trend => ({
                            ...trend,
                            date: new Date(trend._id).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })
                        })).sort((a, b) => new Date(a._id) - new Date(b._id))
                    };
                    setStats(processedStats);
                } else {
                    setError(data.message || 'Failed to fetch stats');
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setError(error.response?.data?.message || 'Failed to fetch dashboard stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [aToken, backendUrl]);

    // Function to get payment method label
    const getPaymentMethodLabel = (method) => {
        const methodLabels = {
            'upi': 'UPI',
            'card': 'Card Payment',
            'net_banking': 'Net Banking',
            'wallet': 'Wallet',
            'cash': 'Cash',
            'other': 'Other'
        };
        return methodLabels[method?.toLowerCase()] || 'Other';
    };

    // Payment method colors
    const paymentMethodColors = {
        'Pay Online': 'rgba(75, 192, 192, 0.8)', // Teal for online payment
        'Pay Later (Cash)': 'rgba(255, 206, 86, 0.8)' // Yellow for cash payment
    };

    // Chart configurations
    const bookingTrendsConfig = {
        labels: stats.bookingTrends.map(trend => trend.date),
        datasets: [
            {
                label: 'Daily Bookings',
                data: stats.bookingTrends.map(trend => trend.count),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'bookings'
            },
            {
                label: 'Daily Revenue (₹)',
                data: stats.bookingTrends.map(trend => trend.revenue),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'revenue'
            }
        ]
    };

    const categoryRevenueConfig = {
        labels: stats.categoryRevenue?.map(cat => `${cat._id} (${cat.bookingCount})`),
        datasets: [{
            data: stats.categoryRevenue?.map(cat => cat.totalRevenue),
            backgroundColor: stats.categoryRevenue?.map(cat => paymentMethodColors[cat._id]),
            borderWidth: 0
        }]
    };

    const topHotelsConfig = {
        labels: stats.topHotels.map(hotel => hotel.name),
        datasets: [{
            label: 'Revenue (₹)',
            data: stats.topHotels.map(hotel => hotel.totalRevenue),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderRadius: 8
        }]
    };

    if (loading) {
        return (
            <div className="ml-64 pt-20 px-8 min-h-screen bg-gray-50 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ml-64 pt-20 px-8 min-h-screen bg-gray-50">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="ml-64 pt-16 px-6 pb-8 min-h-screen bg-gray-50">
            <h2 className="text-2xl font-semibold mb-8"></h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="rounded-full p-3 bg-primary bg-opacity-10">
                            <FaHotel className="text-primary" size={24} />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-500 mb-0">Total Hotels</p>
                            <h3 className="text-xl font-semibold mb-0">{stats.totalHotels}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="rounded-full p-3 bg-success bg-opacity-10">
                            <FaCheckCircle className="text-success" size={24} />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-500 mb-0">Active Hotels</p>
                            <h3 className="text-xl font-semibold mb-0">{stats.activeHotels}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="rounded-full p-3 bg-warning bg-opacity-10">
                            <FaBookmark className="text-warning" size={24} />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-500 mb-0">Total Bookings</p>
                            <h3 className="text-xl font-semibold mb-0">{stats.totalBookings}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="rounded-full p-3 bg-danger bg-opacity-10">
                            <FaRupeeSign className="text-danger" size={24} />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-500 mb-0">Total Revenue</p>
                            <h3 className="text-xl font-semibold mb-0">₹{stats.totalRevenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h5 className="text-lg font-semibold mb-4">Booking Trends (Last 30 Days)</h5>
                        <div className="h-[350px]">
                            <Line
                                data={bookingTrendsConfig}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        bookings: {
                                            type: 'linear',
                                            position: 'left',
                                            beginAtZero: true,
                                            grid: {
                                                drawBorder: false,
                                                color: 'rgba(0, 0, 0, 0.05)'
                                            },
                                            ticks: {
                                                stepSize: 1
                                            }
                                        },
                                        revenue: {
                                            type: 'linear',
                                            position: 'right',
                                            beginAtZero: true,
                                            grid: {
                                                drawOnChartArea: false
                                            }
                                        },
                                        x: {
                                            grid: {
                                                display: false
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            align: 'end'
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    let label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += context.dataset.yAxisID === 'revenue' 
                                                            ? '₹' + context.parsed.y.toLocaleString()
                                                            : context.parsed.y;
                                                    }
                                                    return label;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm p-4 h-full">
                        <h5 className="text-lg font-semibold mb-4">Revenue by Payment Method</h5>
                        <div className="h-[300px] flex items-center justify-center">
                            <Doughnut
                                data={categoryRevenueConfig}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                usePointStyle: true,
                                                padding: 20
                                            }
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    const value = context.raw;
                                                    return `₹${value.toLocaleString()} (${((value / stats.totalRevenue) * 100).toFixed(1)}%)`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h5 className="text-lg font-semibold mb-4">Top Performing Hotels</h5>
                    <div className="h-[350px]">
                        <Bar
                            data={topHotelsConfig}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            drawBorder: false,
                                            color: 'rgba(0, 0, 0, 0.05)'
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h5 className="text-lg font-semibold mb-4">Recent Bookings</h5>
                    <div className="overflow-x-auto" style={{ height: '350px' }}>
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Hotel</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Guest</th>
                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Check-in</th>
                                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.recentBookings.map(booking => (
                                    <tr key={booking._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">{booking.hotelName}</td>
                                        <td className="px-4 py-2">{booking.userName}</td>
                                        <td className="px-4 py-2">{new Date(booking.checkInDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-right">₹{booking.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;