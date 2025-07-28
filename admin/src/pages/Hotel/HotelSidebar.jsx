import React, { useContext } from 'react';
import { HotelContext } from '../../context/HotelContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, User, Star } from 'lucide-react';

const HotelSidebar = () => {
    const { hToken } = useContext(HotelContext);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { label: 'Dashboard', icon: <Home size={20} />, path: '/hotel-dashboard' },
        { label: 'Bookings', icon: <Calendar size={20} />, path: '/hotel-bookings' },
        { label: 'Reviews', icon: <Star size={20} />, path: '/hotel-reviews' },
        { label: 'Profile', icon: <User size={20} />, path: '/hotel-profile' },
    ];

    return (
        <div className="w-64 bg-white h-screen border-r shadow-sm flex flex-col p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-10">🏨 Hotel Panel</h2>
            {hToken && (
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.label}>
                            <button
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === item.path
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default HotelSidebar;