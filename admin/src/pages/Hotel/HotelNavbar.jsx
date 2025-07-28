import React, { useContext } from 'react';
import { HotelContext } from '../../context/HotelContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

const HotelNavbar = () => {
    const { hToken, setHToken } = useContext(HotelContext);
    const navigate = useNavigate();

    const logout = () => {
        setHToken(null);
        localStorage.removeItem('hToken');
        navigate('/login');
    };

    return (
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white shadow-sm">
            <div className="flex items-center gap-3">
                <img
                    className="w-32 cursor-pointer"
                    src={logo}
                    alt="Logo"
                    onClick={() => navigate('/hotel-dashboard')}
                />
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    Hotel Owner
                </span>
            </div>
            <button
                onClick={logout}
                className="btn-primary"
            >
                Log Out
            </button>
        </div>
    );
};

export default HotelNavbar;