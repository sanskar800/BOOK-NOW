import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminContext } from './context/AdminContext';
import { HotelContext } from './context/HotelContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import AdminNavbar from './components/Navbar';
import AdminSidebar from './components/Sidebar';
import HotelNavbar from './pages/Hotel/HotelNavbar';
import HotelSidebar from './pages/Hotel/HotelSidebar';
import AdminDashboard from './pages/Admin/Dashboard'; // Corrected import
import AllBookings from './pages/Admin/AllBookings';
import AddHotel from './pages/Admin/AddHotel';
import HotelsList from './pages/Admin/HotelsList';
import HotelDashboard from './pages/Hotel/HotelDashboard';
import HotelBookings from './pages/Hotel/HotelBookings';
import HotelProfile from './pages/Hotel/HotelProfile';
import HotelReviews from './pages/Hotel/HotelReviews';

const ProtectedRoute = ({ children, token, redirectTo = '/' }) => {
  return token ? children : <Navigate to={redirectTo} replace />;
};

const App = () => {
  const { aToken } = useContext(AdminContext);
  const { hToken } = useContext(HotelContext);

  return (
    <NotificationProvider>
      <div className="bg-[#F8F9FD]">
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute token={aToken}>
                <div>
                  <AdminNavbar />
                  <div className="flex items-start">
                    <AdminSidebar />
                    <AdminDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-bookings"
            element={
              <ProtectedRoute token={aToken}>
                <div>
                  <AdminNavbar />
                  <div className="flex items-start">
                    <AdminSidebar />
                    <AllBookings />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-hotel"
            element={
              <ProtectedRoute token={aToken}>
                <div>
                  <AdminNavbar />
                  <div className="flex items-start">
                    <AdminSidebar />
                    <AddHotel />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotels-list"
            element={
              <ProtectedRoute token={aToken}>
                <div>
                  <AdminNavbar />
                  <div className="flex items-start">
                    <AdminSidebar />
                    <HotelsList />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotel-dashboard"
            element={
              <ProtectedRoute token={hToken}>
                <div>
                  <HotelNavbar />
                  <div className="flex items-start">
                    <HotelSidebar />
                    <HotelDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotel-bookings"
            element={
              <ProtectedRoute token={hToken}>
                <div>
                  <HotelNavbar />
                  <div className="flex items-start">
                    <HotelSidebar />
                    <HotelBookings />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotel-profile"
            element={
              <ProtectedRoute token={hToken}>
                <div>
                  <HotelNavbar />
                  <div className="flex items-start">
                    <HotelSidebar />
                    <HotelProfile />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hotel-reviews"
            element={
              <ProtectedRoute token={hToken}>
                <div>
                  <HotelNavbar />
                  <div className="flex items-start">
                    <HotelSidebar />
                    <HotelReviews />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </NotificationProvider>
  );
};

export default App;