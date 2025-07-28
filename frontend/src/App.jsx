import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Hotels from "./pages/Hotels";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyBookings from "./pages/MyBookings";
import Booking from "./pages/Booking";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppContextProvider from "./context/AppContext";
import { NotificationProvider } from "./context/NotificationContext";

const App = () => {
  return (
    <AppContextProvider>
      <NotificationProvider>
        <div className="mx-4 sm:mx-[10%]">
          <ToastContainer />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/hotels/:location" element={<Hotels />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/booking/:hotId" element={<Booking />} />
          </Routes>
          <Footer />
        </div>
      </NotificationProvider>
    </AppContextProvider>
  );
};

export default App;
