import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const HotelContext = createContext();

const HotelContextProvider = (props) => {
    const [hToken, setHToken] = useState(localStorage.getItem('hToken') || null);
    const [hotelData, setHotelData] = useState(null);
    const backendUrl = 'http://localhost:4000';
    const navigate = useNavigate();

    // Set up axios defaults whenever token changes
    useEffect(() => {
        if (hToken) {
            // Set token in axios defaults for all requests
            axios.defaults.headers.common['hToken'] = hToken;
            axios.defaults.headers.common['Authorization'] = `Bearer ${hToken}`;
            
            // Also configure axios to send these headers with all requests
            axios.interceptors.request.use(config => {
                config.headers = config.headers || {};
                config.headers['hToken'] = hToken;
                config.headers['Authorization'] = `Bearer ${hToken}`;
                return config;
            });
            
            console.log('Set default axios headers with hotel token');
            
            // Immediately try to get hotel data
            getHotelDetails().then(response => {
                if (response.success) {
                    console.log('Loaded hotel data on context initialization');
                }
            });
        } else {
            delete axios.defaults.headers.common['hToken'];
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [hToken]);

    const getHotelDetails = async () => {
        try {
            console.log('Fetching hotel details with token:', hToken);
            
            const { data } = await axios.get(`${backendUrl}/api/hotel/details`, {
                headers: { 
                    'hToken': hToken,
                    'Authorization': `Bearer ${hToken}`
                }
            });
            
            console.log('Hotel details response:', data);
            
            if (data.success) {
                console.log('Setting hotel data:', data.hotel);
                setHotelData(data.hotel);
                return {
                    success: true,
                    hotel: data.hotel
                };
            } else {
                toast.error(data.message);
                if (data.message.includes('Not Authorized')) {
                    localStorage.removeItem('hToken');
                    setHToken(null);
                    navigate('/login');
                }
                return {
                    success: false
                };
            }
        } catch (error) {
            console.error('Error fetching hotel details:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch hotel details');
            if (error.response?.status === 401) {
                localStorage.removeItem('hToken');
                setHToken(null);
                navigate('/login');
            }
            return {
                success: false
            };
        }
    };

    const getHotelBookings = async () => {
        try {
            console.log('Fetching hotel bookings with token:', hToken);
            
            const { data } = await axios.get(`${backendUrl}/api/hotel/bookings`, {
                headers: { 
                    'hToken': hToken,
                    'Authorization': `Bearer ${hToken}`
                }
            });
            
            console.log('Hotel bookings response:', data);
            
            if (data.success) {
                return { success: true, bookings: data.bookings };
            } else {
                toast.error(data.message);
                return { success: false, bookings: [] };
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch bookings');
            return { success: false, bookings: [] };
        }
    };

    const cancelBooking = async (bookingId) => {
        try {
            const { data } = await axios.delete(`${backendUrl}/api/hotel/bookings/${bookingId}`, {
                headers: { 
                    'hToken': hToken,
                    'Authorization': `Bearer ${hToken}`
                }
            });
            
            if (data.success) {
                toast.success('Booking cancelled successfully. A notification has been sent to the guest.');
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
            return false;
        }
    };

    const value = {
        hToken,
        setHToken,
        hotelData,
        setHotelData,
        backendUrl,
        getHotelDetails,
        getHotelBookings,
        cancelBooking,
    };

    return <HotelContext.Provider value={value}>{props.children}</HotelContext.Provider>;
};

export default HotelContextProvider;