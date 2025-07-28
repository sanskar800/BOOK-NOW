import React, { useContext } from 'react';
import logo from '../assets/logo.png';
import { AdminContext } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { aToken, setAToken } = useContext(AdminContext);
    const navigate = useNavigate();

    const logout = () => {
        navigate('/');
        aToken && setAToken('');
        aToken && localStorage.removeItem('aToken');
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-white shadow-md">
            <div className="flex items-center gap-3">
                <img className="w-32 sm:w-36 transition-transform duration-300 hover:scale-105" src={logo} alt="Logo" />
                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                    {aToken ? 'Admin' : 'Hotel'}
                </span>
            </div>
            <button
                onClick={logout}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
                Log Out
            </button>
        </div>
    );
};

export default Navbar;