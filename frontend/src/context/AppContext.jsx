import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = 'Rs.';
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const [hotels, setHotels] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || false);
  const [userData, setUserData] = useState(false);

  const getHotelsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/hotel/list');
      if (data.success) {
        setHotels(data.hotels);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const loadUserProfileData = async () => {
    try {
      if (token && token !== 'false') {
        const decoded = jwtDecode(token);
        const userId = decoded.id;
        console.log("loadUserProfileData called with token:", token);
        console.log("Decoded userId:", userId);
        console.log("Making request to:", `${backendUrl}/api/user/get-profile?userId=${userId}`);

        const { data } = await axios.get(
          `${backendUrl}/api/user/get-profile?userId=${userId}`,
          { headers: { token } } // Send token as 'token' header
        );
        console.log("get-profile response:", data);
        if (data.success) {
          setUserData(data.userData);
        } else {
          toast.error(data.message);
          setToken(false);
          localStorage.removeItem('token');
          setUserData(false);
        }
      }
    } catch (error) {
      console.log("Error in loadUserProfileData:", error);
      toast.error(error.message);
      setToken(false);
      localStorage.removeItem('token');
      setUserData(false);
    }
  };

  const value = {
    hotels,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData,
  };

  useEffect(() => {
    getHotelsData();
  }, []);

  useEffect(() => {
    if (token && token !== 'false') {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;