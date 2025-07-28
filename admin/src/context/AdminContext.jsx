import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
    const [aToken, setAToken] = useState(localStorage.getItem('aToken') || null);
    const [hotels, setHotels] = useState([]);
    const backendUrl = 'http://localhost:4000';
    const navigate = useNavigate();

    useEffect(() => {
        console.log('AdminContext - Setting axios default header, aToken:', aToken);
        if (aToken) {
            axios.defaults.headers.common['atoken'] = aToken;
        } else {
            delete axios.defaults.headers.common['atoken'];
        }
    }, [aToken]);

    const getAllHotels = async () => {
        try {
            console.log('AdminContext - Fetching hotels with aToken:', aToken);
            const { data } = await axios.get(`${backendUrl}/api/admin/all-hotels`, {
                headers: { atoken: aToken }, // Changed to lowercase
            });
            console.log('AdminContext - getAllHotels response:', data);
            if (data.success) {
                setHotels(data.hotels);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('AdminContext - getAllHotels error:', error.response?.data);
            if (error.response?.status === 401) {
                setAToken('');
                localStorage.removeItem('aToken');
                toast.error('Session expired, please log in again');
                navigate('/login');
            } else {
                toast.error(error.response?.data?.message || 'Failed to fetch hotels');
            }
        }
    };

    const changeAvailability = async (hotId) => {
        try {
            console.log('AdminContext - Changing availability with aToken:', aToken);
            const { data } = await axios.post(`${backendUrl}/api/admin/change-availability`, { hotId }, {
                headers: { atoken: aToken }, // Changed to lowercase
            });
            console.log('AdminContext - changeAvailability response:', data);
            if (data.success) {
                toast.success(data.message);
                await getAllHotels();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('AdminContext - changeAvailability error:', error.response?.data);
            if (error.response?.status === 401) {
                setAToken('');
                localStorage.removeItem('aToken');
                toast.error('Session expired, please log in again');
                navigate('/login');
            } else {
                toast.error(error.response?.data?.message || 'Failed to change availability');
                throw error;
            }
        }
    };

    const value = {
        aToken,
        setAToken,
        hotels,
        setHotels,
        backendUrl,
        getAllHotels,
        changeAvailability
    };

    return <AdminContext.Provider value={value}>{props.children}</AdminContext.Provider>;
};

export default AdminContextProvider;