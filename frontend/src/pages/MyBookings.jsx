import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { assets } from "../assets/assets.js";
import ReviewForm from "../components/ReviewForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const backendUrl = "http://localhost:4000";

// Simple debounce function to prevent multiple rapid clicks
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const PaymentForm = ({ clientSecret, onSuccess, onError, isLoading, setIsLoading, bookingId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const formRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      onError("Payment system not loaded. Please try again.");
      return;
    }

    setIsLoading(true);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError("Payment form not properly loaded. Please try again.");
      setIsLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      onError(error.message);
      setIsLoading(false);
    } else if (paymentIntent.status === "succeeded") {
      onSuccess();
      setIsLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        fontFamily: "Arial, sans-serif",
        "::placeholder": { color: "#aab7c4" },
        iconColor: "#666EE8",
        lineHeight: "40px",
      },
      invalid: {
        color: "#e53e3e",
        iconColor: "#e53e3e",
      },
    },
    hidePostalCode: true,
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Secure Payment</h3>
        <img src={assets.stripe_logo} alt="Stripe" className="h-8" />
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-4 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 shadow-sm">
            {stripe && elements ? (
              <CardElement options={cardElementOptions} className="py-4" />
            ) : (
              <div className="flex justify-center items-center h-10">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-gray-600 font-medium">Loading payment form...</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Your card details are securely processed by Stripe. We don't store your card information.
          </p>
        </div>
      </div>
      <button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className={`w-full mt-6 py-4 rounded-lg font-medium text-white flex items-center justify-center transition-all duration-300 shadow-md ${isLoading || !stripe || !elements
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
            Processing Payment...
          </>
        ) : (
          "Complete Secure Payment"
        )}
      </button>
      <div className="flex items-center justify-center text-gray-500 text-sm mt-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Payments are secure and encrypted
      </div>
    </form>
  );
};

const MyBookings = () => {
  const { token, setToken, loadUserProfileData, currencySymbol } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [paymentState, setPaymentState] = useState({});
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();
  const [showReviewForm, setShowReviewForm] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentButtonsDisabled, setPaymentButtonsDisabled] = useState({});

  // Initialize token and user profile
  useEffect(() => {
    const initializeToken = async () => {
      try {
        let currentToken = token || localStorage.getItem("token");
        if (!currentToken && loadUserProfileData) {
          await loadUserProfileData();
          currentToken = token || localStorage.getItem("token");
        }
        if (!currentToken) {
          try {
            const response = await axios.get(`${backendUrl}/api/user/get-profile`, {
              headers: { token: localStorage.getItem("token") || "" },
            });
            if (response.data.success) {
              currentToken = localStorage.getItem("token");
              if (currentToken && setToken) setToken(currentToken);
            } else {
              throw new Error("Failed to fetch profile");
            }
          } catch (error) {
            throw new Error("Failed to fetch profile");
          }
        }
        if (!currentToken) throw new Error("No token available");
        try {
          jwtDecode(currentToken);
        } catch (error) {
          localStorage.removeItem("token");
          if (setToken) setToken(null);
          throw new Error("Invalid session. Please log in again.");
        }
      } catch (error) {
        toast.error(error.message || "Failed to load user profile. Please log in again.");
        navigate("/login");
      } finally {
        setTokenLoading(false);
      }
    };
    initializeToken();
  }, [token, loadUserProfileData, setToken, navigate]);

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      const currentToken = token || localStorage.getItem("token");
      if (!currentToken) throw new Error("No token available");
      
      // Add status parameter to API request if filter is not "All" or "Completed"
      // For "Completed", we need all Active bookings to filter by date on the frontend
      const params = {};
      if (filter !== "All" && filter !== "Completed") {
        params.status = filter;
      }
      
      const response = await axios.get(`${backendUrl}/api/booking/my-bookings`, {
        headers: { token: currentToken },
        params
      });
      
      if (response.data.success) {
        setBookings(response.data.bookings || []);
      } else {
        toast.error(response.data.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      if (error.response?.data?.message === "Not Authorized") {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Error fetching bookings");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tokenLoading && (token || localStorage.getItem("token"))) {
      fetchBookings();
    } else if (!tokenLoading) {
      setLoading(false);
      toast.error("Please log in to view your bookings.");
      navigate("/login");
    }
  }, [tokenLoading, token, filter, navigate]);

  // Handle "Pay Online" click with debounce
  const handlePayOnline = useCallback(async (booking) => {
    try {
      // Disable this specific button
      setPaymentButtonsDisabled(prev => ({...prev, [booking._id]: true}));
      
      // Update UI immediately to show loading
      setPaymentState((prev) => ({
        ...prev,
        [booking._id]: { showForm: false, clientSecret: null, isLoading: true },
      }));

      console.log('Initiating pay-online for booking:', booking._id);

      // Call backend to update booking to pay_online
      const { data } = await axios.post(
        `${backendUrl}/api/booking/bookings/${booking._id}/pay-online`,
        {},
        { 
          headers: { token: token || localStorage.getItem("token") },
          // Add a timeout to prevent hanging requests
          timeout: 10000
        }
      );

      if (data.success && data.clientSecret) {
        console.log('Received clientSecret:', data.clientSecret);
        setPaymentState((prev) => ({
          ...prev,
          [booking._id]: {
            showForm: true,
            clientSecret: data.clientSecret,
            isLoading: false,
            bookingId: data.bookingId,
          },
        }));
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      console.log("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to initiate payment");
      setPaymentState((prev) => ({
        ...prev,
        [booking._id]: { showForm: false, clientSecret: null, isLoading: false },
      }));
    } finally {
      // Re-enable the button after 1.5 seconds to prevent accidental double-clicks
      setTimeout(() => {
        setPaymentButtonsDisabled(prev => ({...prev, [booking._id]: false}));
      }, 1500);
    }
  }, [token, backendUrl]);

  // Create a debounced version of handlePayOnline
  const debouncedHandlePayOnline = useCallback(
    debounce((booking) => handlePayOnline(booking), 300),
    [handlePayOnline]
  );

  // Handle payment success
  const handlePaymentSuccess = async (bookingId) => {
    try {
      // Check payment status
      const { data } = await axios.get(`${backendUrl}/api/booking/check-payment-status/${bookingId}`, {
        headers: { token: token || localStorage.getItem("token") },
      });

      if (data.success && data.paymentStatus === "Completed") {
        toast.success("Payment completed successfully!");
        fetchBookings();
        setPaymentState((prev) => ({
          ...prev,
          [bookingId]: { showForm: false, clientSecret: null, isLoading: false },
        }));
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      console.error("Payment success handling error:", error);
      toast.error(error.response?.data?.message || "Failed to verify payment");
      setPaymentState((prev) => ({
        ...prev,
        [bookingId]: { showForm: false, clientSecret: null, isLoading: false },
      }));
    }
  };

  // Handle payment error
  const handlePaymentError = async (bookingId, errorMessage) => {
    try {
      // Revert the booking to pay_later if payment fails
      const { data } = await axios.post(
        `${backendUrl}/api/booking/bookings/${bookingId}/revert-to-pay-later`,
        {},
        { headers: { token: token || localStorage.getItem("token") } }
      );
      if (data.success) {
        console.log(`Booking ${bookingId} reverted to pay_later`);
      } else {
        console.error(`Failed to revert booking ${bookingId} to pay_later:`, data.message);
      }
    } catch (revertError) {
      console.error("Error reverting booking to pay_later:", revertError);
      toast.error("Failed to revert booking to pay_later. Please try again.");
    }

    toast.error(`Payment failed: ${errorMessage}`);
    setPaymentState((prev) => ({
      ...prev,
      [bookingId]: { showForm: false, clientSecret: null, isLoading: false },
    }));
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
  };

  const handleConfirmCancellation = async () => {
    try {
      setCancelLoading(true);
      
      // Optimistic UI update - update locally first
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === selectedBookingId 
            ? { ...booking, status: 'Cancelled', cancelledAt: new Date(), cancelledBy: 'user' } 
            : booking
        )
      );
      
      const response = await axios.delete(
        `${backendUrl}/api/booking/bookings/${selectedBookingId}`,
        { 
          headers: { token: token || localStorage.getItem("token") },
          data: { cancellationReason }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setShowCancelModal(false);
        setCancellationReason("");
        setSelectedBookingId(null);
        // Only fetch bookings if the optimistic update somehow failed
        if (!response.data.booking) {
          fetchBookings();
        }
      } else {
        toast.error(response.data.message || "Failed to cancel booking");
        // Revert the optimistic update if server reports failure
        fetchBookings();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.message || "Error cancelling booking");
      // Revert the optimistic update on error
      fetchBookings();
    } finally {
      setCancelLoading(false);
    }
  };

  // Periodically check payment status for pending bookings
  useEffect(() => {
    const checkPendingPayments = async () => {
      const pendingBookings = bookings.filter(
        (booking) => booking.paymentStatus === "Pending" && booking.paymentOption === "pay_online"
      );
      for (const booking of pendingBookings) {
        try {
          const { data } = await axios.get(
            `${backendUrl}/api/booking/check-payment-status/${booking._id}`,
            { headers: { token: token || localStorage.getItem("token") } }
          );
          if (data.success && data.paymentStatus === "Completed") {
            fetchBookings();
          }
        } catch (error) {
          console.error(`Error checking payment status for booking ${booking._id}:`, error);
        }
      }
    };

    if (bookings.length > 0) {
      const interval = setInterval(checkPendingPayments, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [bookings, token]);

  // Add new function to categorize bookings
  const categorizeBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Categorizing bookings:', bookings);

    const categorized = bookings.reduce((acc, booking) => {
      // First handle cancelled bookings
      if (booking.status === 'Cancelled') {
        acc.cancelled.push(booking);
        return acc;
      }
      
      const checkOutDate = new Date(booking.checkOutDate);
      checkOutDate.setHours(0, 0, 0, 0);
      const checkInDate = new Date(booking.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);

      console.log(`Booking ${booking._id}: checkIn=${checkInDate.toISOString()}, checkOut=${checkOutDate.toISOString()}, today=${today.toISOString()}, completed=${checkOutDate < today}`);

      // Completed: Check-out date is in the past
      if (checkOutDate < today) {
        acc.completed.push(booking);
      } 
      // Active: Check-in date is today or in the past AND check-out date is today or in the future
      else if (checkInDate <= today && checkOutDate >= today) {
        acc.active.push(booking);
      } 
      // Upcoming: Check-in date is in the future
      else if (checkInDate > today) {
        acc.upcoming.push(booking);
      }
      
      return acc;
    }, { completed: [], upcoming: [], active: [], cancelled: [] });

    console.log('Categorized bookings:', categorized);
    return categorized;
  };

  const formatCancelledInfo = (booking) => {
    if (!booking.cancelledAt) return null;
    
    const cancelDate = new Date(booking.cancelledAt);
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(cancelDate);
    
    let cancelledBy = 'Unknown';
    switch(booking.cancelledBy) {
      case 'user':
        cancelledBy = 'You';
        break;
      case 'hotel':
        cancelledBy = 'Hotel';
        break;
      case 'admin':
        cancelledBy = 'Admin';
        break;
      default:
        cancelledBy = 'System';
    }
    
    return `Cancelled by ${cancelledBy} on ${formattedDate}`;
  };

  // Handle review submission
  const handleReviewSubmitted = (review) => {
    setShowReviewForm(null);
    toast.success("Thank you for your review!");
    fetchBookings(); // Refresh bookings to update UI
  };

  if (tokenLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
        
        <div className="flex items-center gap-3">
          <label htmlFor="booking-filter" className="text-gray-600 font-medium">
            Filter:
          </label>
          <select
            id="booking-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Bookings</option>
            <option value="Active">Active Bookings</option>
            <option value="Upcoming">Upcoming Bookings</option>
            <option value="Completed">Past Bookings</option>
            <option value="Cancelled">Cancelled Bookings</option>
          </select>
          
          <button
            onClick={fetchBookings}
            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
            title="Refresh bookings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-xl text-gray-600 mt-4">No bookings found.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Browse Hotels
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(categorizeBookings()).map(([category, categoryBookings]) => {
            console.log(`Rendering category ${category} with ${categoryBookings.length} bookings, current filter: ${filter}`);
            
            // Skip rendering if this category doesn't match the current filter
            if (filter === "Active" && category !== "active") {
              return null;
            }
            if (filter === "Upcoming" && category !== "upcoming") {
              return null;
            }
            if (filter === "Completed" && category !== "completed") {
              return null;
            }
            if (filter === "Cancelled" && category !== "cancelled") {
              return null;
            }
            
            // Only render if there are bookings in this category
            return categoryBookings.length > 0 && (
              <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800 capitalize">
                    {category === 'upcoming' && (
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upcoming Bookings
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">Bookings with check-in dates in the future</p>
                      </div>
                    )}
                    {category === 'active' && (
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Active Bookings
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">Bookings you are currently staying at or checking in today</p>
                      </div>
                    )}
                    {category === 'completed' && (
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Past Bookings
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">Bookings you've already completed</p>
                      </div>
                    )}
                    {category === 'cancelled' && (
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Cancelled Bookings
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">Bookings that were cancelled</p>
                      </div>
                    )}
                  </h2>
                </div>
                
                {categoryBookings.map((booking, index) => (
                  <div
                    key={booking._id || index}
                    className={`border-b border-gray-100 ${index === categoryBookings.length - 1 ? 'border-b-0' : ''} ${category === 'cancelled' ? 'relative' : ''}`}
                  >
                    {category === 'cancelled' && (
                      <div className="absolute -right-2 -top-2 z-10 rotate-12 transform">
                        <div className="bg-red-500 text-white px-6 py-1 text-sm font-bold shadow-md">
                          CANCELLED
                        </div>
                      </div>  
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-6 p-6 hover:bg-gray-50 transition-all">
                      <div className="flex justify-center md:justify-start">
                        <div className={`relative w-full max-w-xs overflow-hidden rounded-xl shadow-md ${category === 'cancelled' ? 'max-h-56' : ''}`}>
                          <img
                            className={`w-full ${category === 'cancelled' ? 'h-56 object-contain bg-gray-100' : 'h-48 object-cover'}`}
                            src={booking.hotelId?.image || "https://via.placeholder.com/400x240?text=Hotel+Image"}
                            alt={booking.hotelId?.name || "Unknown Hotel"}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/400x240?text=Hotel+Image";
                            }}
                          />
                          {category === 'cancelled' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-sm mb-1">
                                  {booking.hotelId?.name || "Unknown Hotel"}
                                </span>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 text-white opacity-80 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-white text-xs opacity-80">
                                    {new Date(booking.checkInDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })} - {new Date(booking.checkOutDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {category !== 'cancelled' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <span className="text-white font-medium text-sm">
                                {new Date(booking.checkInDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })} - {new Date(booking.checkOutDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`flex flex-col justify-between ${category === 'cancelled' ? 'opacity-80' : ''}`}>
                        <div>
                          <h2 className={`text-xl font-bold text-gray-800 mb-2 ${category === 'cancelled' ? 'line-through decoration-red-500 decoration-2' : ''}`}>
                            {booking.hotelId?.name || "Unknown Hotel"}
                          </h2>
                          <div className="flex items-center text-gray-600 mb-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="text-sm">{booking.hotelId?.location || "Unknown Location"}</span>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">Address</h3>
                            <p className="text-sm text-gray-600">
                              {booking.hotelId?.address?.line1 || "Not available"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                          <div>
                            <p className="text-xs text-gray-500">Room Quantity</p>
                            <p className="font-medium">
                              {booking.roomQuantity} Room{booking.roomQuantity > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Price</p>
                            <p className="font-medium text-blue-700">
                              {currencySymbol}
                              {booking.totalAmount || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Payment Status</p>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.paymentStatus === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.paymentStatus === "Failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {booking.paymentStatus}
                            </span>
                          </div>
                          {booking.status === 'Cancelled' && (
                            <div className="mt-3 col-span-3">
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelled
                                  </span>
                                </div>
                                {booking.cancelledAt && (
                                  <p className="text-xs text-gray-500">
                                    {formatCancelledInfo(booking)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 md:justify-center">
                        {booking.paymentOption === "pay_later" &&
                          !paymentState[booking._id]?.showForm && 
                          category !== "completed" && 
                          booking.status !== "Cancelled" && (
                            <button
                              onClick={() => debouncedHandlePayOnline(booking)}
                              className={`text-sm text-white bg-blue-600 hover:bg-blue-700 text-center py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
                                paymentState[booking._id]?.isLoading || paymentButtonsDisabled[booking._id] 
                                  ? "opacity-70 cursor-not-allowed" 
                                  : ""
                              }`}
                              disabled={paymentState[booking._id]?.isLoading || paymentButtonsDisabled[booking._id]}
                            >
                              {paymentState[booking._id]?.isLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                  Pay Online
                                </>
                              )}
                            </button>
                          )}

                        {category !== 'completed' && category !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="text-sm text-white bg-red-500 hover:bg-red-600 text-center py-3 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Cancel Booking
                          </button>
                        )}

                        {paymentState[booking._id]?.showForm && paymentState[booking._id]?.clientSecret && (
                          <div className="mt-4">
                            <Elements
                              stripe={stripePromise}
                              options={{ clientSecret: paymentState[booking._id]?.clientSecret }}
                            >
                              <PaymentForm
                                clientSecret={paymentState[booking._id]?.clientSecret}
                                onSuccess={() => handlePaymentSuccess(booking._id)}
                                onError={(message) => handlePaymentError(booking._id, message)}
                                isLoading={paymentState[booking._id]?.isLoading}
                                setIsLoading={(isLoading) => setPaymentState((prev) => ({
                                  ...prev,
                                  [booking._id]: { ...prev[booking._id], isLoading },
                                }))}
                                bookingId={booking._id}
                              />
                            </Elements>
                          </div>
                        )}

                        {/* Add "Leave Review" button for completed bookings */}
                        {category === "completed" && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => setShowReviewForm(booking._id)}
                              className="flex items-center justify-center w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              Leave a Review
                            </button>
                          </div>
                        )}

                        {/* Add the review form modal */}
                        {showReviewForm === booking._id && (
                          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                              {/* Background overlay */}
                              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowReviewForm(null)}></div>

                              {/* Modal panel */}
                              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                  <div className="absolute top-0 right-0 pt-4 pr-4">
                                    <button
                                      type="button"
                                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                      onClick={() => setShowReviewForm(null)}
                                    >
                                      <span className="sr-only">Close</span>
                                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                      Review your stay
                                    </h3>
                                    <div className="mt-4">
                                      <ReviewForm 
                                        bookingId={booking._id} 
                                        hotelName={booking.hotelId?.name || "Unknown Hotel"}
                                        onReviewSubmitted={handleReviewSubmitted} 
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for cancelling this booking:</p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter your reason for cancellation..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows="4"
              disabled={cancelLoading}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason("");
                  setSelectedBookingId(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={cancelLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center min-w-[160px]"
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;