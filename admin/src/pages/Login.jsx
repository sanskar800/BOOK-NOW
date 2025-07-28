import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { HotelContext } from '../context/HotelContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';

const Login = () => {
    const [state, setState] = useState('Admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // States for forgot password
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    
    const { setAToken, backendUrl } = useContext(AdminContext);
    const { setHToken } = useContext(HotelContext);
    const navigate = useNavigate();

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            if (state === 'Admin') {
                const { data } = await axios.post(`${backendUrl}/api/admin/login`, { email, password });
                if (data.success) {
                    localStorage.setItem('aToken', data.token);
                    setAToken(data.token);
                    toast.success('Admin login successful');
                    navigate('/admin-dashboard');
                } else {
                    toast.error(data.message);
                }
            } else {
                const { data } = await axios.post(`${backendUrl}/api/hotel/login`, { email, password });
                if (data.success) {
                    localStorage.setItem('hToken', data.token);
                    setHToken(data.token);
                    toast.success('Hotel login successful');
                    navigate('/hotel-dashboard');
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle forgot password request
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const endpoint = state === 'Admin' 
                ? `${backendUrl}/api/admin/forgot-password` 
                : `${backendUrl}/api/hotel/forgot-password`;
            
            const { data } = await axios.post(endpoint, { email: forgotEmail });
            
            if (data.success) {
                toast.success(data.message);
                setOtpSent(true);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset with OTP
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const endpoint = state === 'Admin' 
                ? `${backendUrl}/api/admin/reset-password` 
                : `${backendUrl}/api/hotel/reset-password`;
            
            const { data } = await axios.post(endpoint, {
                email: forgotEmail,
                otp,
                newPassword
            });
            
            if (data.success) {
                toast.success(data.message);
                setShowForgotPassword(false);
                setOtpSent(false);
                setForgotEmail('');
                setOtp('');
                setNewPassword('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    // Render forgot password form
    if (showForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Reset <span className="text-blue-600">Password</span>
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {state} Portal
                        </p>
                    </div>

                    {!otpSent ? (
                        <form onSubmit={handleForgotPassword} className="mt-8 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        type="email"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-colors"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <div className="flex items-center">
                                            <span>Send OTP</span>
                                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                    onClick={() => setShowForgotPassword(false)}
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">One-Time Password (OTP)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter OTP"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        type="password"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="••••••••"
                                        minLength="8"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-colors"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <div className="flex items-center">
                                            <span>Reset Password</span>
                                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setShowForgotPassword(false);
                                    }}
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {state} <span className="text-blue-600">Portal</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">Enter your credentials to access the dashboard</p>
                </div>

                <form onSubmit={onSubmitHandler} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                    type="email"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400" />
                                </div>
                                <input
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    type="password"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-colors"
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <div className="flex items-center">
                                    <span>Sign in to {state} Portal</span>
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-3 text-center">
                            <button
                                type="button"
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                onClick={() => setState(state === 'Admin' ? 'Hotel' : 'Admin')}
                            >
                                {state === 'Admin' ? 'Switch to Hotel Owner Login' : 'Switch to Admin Login'}
                            </button>
                            
                            <button
                                type="button"
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                onClick={() => setShowForgotPassword(true)}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;