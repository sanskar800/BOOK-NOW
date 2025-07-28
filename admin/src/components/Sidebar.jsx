import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar = () => {
    const { aToken } = useContext(AdminContext);

    return (
        <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg">
            {aToken && (
                <ul className="mt-8">
                    {[
                        { path: '/admin-dashboard', icon: assets.home_icon, label: 'Dashboard' },
                        { path: '/all-bookings', icon: assets.appointment_icon, label: 'Bookings' },
                        { path: '/add-hotel', icon: assets.add_icon, label: 'Add Hotel' },
                        { path: '/hotels-list', icon: assets.people_icon, label: 'Hotels List' },
                    ].map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 py-3 px-6 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : ''
                                    }`
                                }
                            >
                                <img src={item.icon} alt="" className="w-6 h-6" />
                                <span className="text-sm font-semibold">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Sidebar;