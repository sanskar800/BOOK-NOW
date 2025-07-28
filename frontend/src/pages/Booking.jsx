import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedHotels from "../components/RelatedHotels";
import { toast } from "react-toastify";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReviewsModal from "../components/ReviewsModal";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Add debounce utility function
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

const PaymentForm = ({ clientSecret, onSuccess, onError, isLoading, setIsLoading }) => {
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
        fontSize: '16px',
        color: '#3B4252',
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#3B82F6',
        lineHeight: '40px',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-6 bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-semibold text-gray-800">Secure Payment</h3>
        <img src={assets.stripe_logo} alt="Stripe" className="h-8" />
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="h-auto min-h-[150px] p-4 bg-white border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 shadow-sm transition-all duration-300 hover:border-blue-400">
            {stripe && elements ? (
              <CardElement
                options={cardElementOptions}
                className="py-4"
              />
            ) : (
              <div className="flex justify-center items-center h-full">
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
        className={`w-full mt-6 py-4 rounded-lg font-medium text-white flex items-center justify-center transition-all duration-300 ${isLoading || !stripe || !elements
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Payments are secure and encrypted
      </div>
    </form>
  );
};

const Booking = () => {
  const { hotId } = useParams();
  const { hotels, currencySymbol, backendUrl, token } = useContext(AppContext);
  const [hotInfo, setHotInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [roomQuantity, setRoomQuantity] = useState(1);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentOption, setPaymentOption] = useState("pay_later");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const discountPercentage = Math.floor(Math.random() * 3) + 8;
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [hotelRating, setHotelRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [buttonText, setButtonText] = useState("Proceed to Payment");

  useEffect(() => {
    setHotInfo(hotels.find((hot) => hot._id === hotId));
  }, [hotels, hotId]);

  useEffect(() => {
    if (paymentComplete) {
      toast.success("Hotel booked successfully!");
      setSelectedDate(null);
      setRoomQuantity(1);
      setPaymentOption("pay_later");
      setShowPaymentForm(false);
      setClientSecret(null);
      setBookingId(null);
      setPaymentComplete(false);
    }
  }, [paymentComplete]);

  useEffect(() => {
    const fetchHotelRating = async () => {
      if (hotId) {
        try {
          const response = await axios.get(`${backendUrl}/api/reviews/hotel/${hotId}`);
          if (response.data.success) {
            setHotelRating(response.data.averageRating || 0);
            setReviewCount(response.data.count || 0);
          }
        } catch (error) {
          console.error("Failed to fetch hotel rating:", error);
        }
      }
    };

    fetchHotelRating();
  }, [hotId, backendUrl]);

  const calculateTotalPrice = () => {
    if (!checkInDate || !checkOutDate || !selectedRoomType || !roomQuantity) return 0;
    
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const roomTypeInfo = hotInfo.roomTypes.find(rt => rt.name === selectedRoomType);
    if (!roomTypeInfo) return 0;
    
    const basePrice = roomTypeInfo.price * roomQuantity * nights;
    return paymentOption === "pay_online" ? basePrice * (1 - discountPercentage / 100) : basePrice;
  };

  // Handle booking with optimizations for better responsiveness
  const handleBooking = useCallback(async () => {
    if (!checkInDate || !checkOutDate || !selectedRoomType || !roomQuantity || !paymentOption) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    if (startDate >= endDate) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    if (paymentOption === "pay_online" && !stripePromise) {
      toast.error("Payment configuration missing.");
      return;
    }

    // Update button state immediately for visual feedback
    setIsLoading(true);
    setIsButtonDisabled(true);
    setButtonText(paymentOption === "pay_online" ? "Setting up payment..." : "Processing booking...");
    
    try {
      const formattedCheckInDate = checkInDate.split("T")[0];
      const formattedCheckOutDate = checkOutDate.split("T")[0];
      
      // Prepare booking data
      const bookingData = {
        hotelId: hotId,
        checkInDate: formattedCheckInDate,
        checkOutDate: formattedCheckOutDate,
        roomQuantity: Number(roomQuantity),
        roomType: selectedRoomType,
        paymentOption,
        totalAmount: calculateTotalPrice(),
        discountApplied: paymentOption === "pay_online" ? discountPercentage : 0,
      };
      
      // Add timeout to prevent hanging requests
      const { data } = await axios.post(
        `${backendUrl}/api/booking/book`,
        bookingData,
        { 
          headers: { token },
          timeout: 15000 // 15 second timeout
        }
      );

      if (data.success) {
        if (paymentOption === "pay_online" && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setBookingId(data.bookingId);
          setShowPaymentForm(true);
        } else {
          toast.success("Hotel booked successfully!");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Booking error:", error);
      if (error.code === 'ECONNABORTED') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(error.response?.data?.message || "Booking failed.");
      }
    } finally {
      setIsLoading(false);
      // Re-enable button with a delay to prevent accidental double clicks
      setTimeout(() => {
        setIsButtonDisabled(false);
        setButtonText(paymentOption === "pay_online" ? "Proceed to Payment" : "Complete Booking");
      }, 1000);
    }
  }, [hotId, checkInDate, checkOutDate, roomQuantity, selectedRoomType, paymentOption, backendUrl, token, calculateTotalPrice, discountPercentage]);

  // Create a debounced version to prevent multiple rapid clicks
  const debouncedHandleBooking = useCallback(
    debounce(() => handleBooking(), 300),
    [handleBooking]
  );

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
  };

  const handlePaymentError = (errorMessage) => {
    toast.error(`Payment failed: ${errorMessage}`);
    setShowPaymentForm(false);
    if (bookingId) {
      axios.delete(`${backendUrl}/api/booking/bookings/${bookingId}`, { headers: { token } });
    }
  };

  // Slider settings for react-slick
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: true,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
    customPaging: (i) => (
      <div className="w-3 h-3 bg-gray-300 rounded-full mx-1 transition-all duration-300 hover:bg-blue-500">
        {i === currentSlide && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
      </div>
    ),
    dotsClass: "slick-dots !flex !justify-center !mt-4",
  };

  if (!hotInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Combine main image and gallery images for the carousel
  const images = [hotInfo.image, ...(hotInfo.galleryImages || [])];

  const totalRoomsAvailable = hotInfo.roomTypes?.reduce((sum, roomType) => 
    sum + (parseInt(roomType.quantity) || 0), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto bg-gray-50">
      {/* Add CSS to style the default arrows */}
      <style>
        {`
.slick-prev, .slick-next {
  z-index: 10 !important; /* Ensure arrows are above the gradient overlay */
  width: 36px !important; /* Slightly larger for better aesthetics */
  height: 36px !important;
  background: rgba(255, 255, 255, 0.9) !important; /* White background with slight transparency */
  border-radius: 50% !important; /* Circular shape */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important; /* Shadow for depth */
  transition: all 0.3s ease !important;
  display: flex !important; /* Use flexbox to center content */
  align-items: center !important; /* Center vertically */
  justify-content: center !important; /* Center horizontally */
}

.slick-prev:hover, .slick-next:hover {
  background: rgba(255, 255, 255, 1) !important; /* Fully opaque on hover */
}

.slick-prev {
  left: 10px !important; /* Adjust position for better spacing */
}

.slick-next {
  right: 10px !important; /* Adjust position for better spacing */
}

.slick-prev:before, .slick-next:before {
  font-size: 22px !important; /* Slightly smaller for better proportion */
  color: #3B82F6 !important; /* Blue color for the chevron */
  opacity: 1 !important;
}

.slick-prev:before {
  content: '❮' !important; /* Unicode for left chevron */
}

.slick-next:before {
  content: '❯' !important; /* Unicode for right chevron */
}
        `}
      </style>

      {/* Hotel Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-100 transform transition-all duration-300 hover:shadow-xl">
        <div className="relative h-72 sm:h-96">
          {/* Removed overflow-hidden to prevent clipping of arrows */}
          <Slider {...sliderSettings} ref={sliderRef}>
            {images.map((img, index) => (
              <div key={index} className="focus:outline-none">
                <img
                  className="w-full h-72 sm:h-96 object-cover transform hover:scale-105 transition duration-700"
                  src={img}
                  alt={`${hotInfo.name} ${index}`}
                />
              </div>
            ))}
          </Slider>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-0"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <div className="flex items-center mb-2">
              <span className="bg-blue-600 text-xs px-2 py-1 rounded-md font-medium mr-2 shadow-md">FEATURED</span>
              <div 
                className="flex items-center cursor-pointer group"
                onClick={() => setShowReviewsModal(true)}
                role="button"
                aria-label="Show reviews"
              >
                <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm font-medium">{hotelRating > 0 ? hotelRating : "New"}</span>
                <span className="ml-1 text-xs text-gray-300 group-hover:text-blue-400 transition-colors">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
                <svg className="h-3 w-3 ml-1 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2 text-white">
              {hotInfo.name}
              <img className="w-6 h-6" src={assets.verified_icon} alt="Verified" />
            </h1>
            <p className="flex items-center text-gray-200 mt-2">
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {hotInfo.location}
            </p>
          </div>
          <div className="absolute top-6 right-6 bg-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-xl font-bold text-blue-600">
              {currencySymbol}{hotInfo.pricePerNight}
              <span className="text-xs text-gray-500 font-normal">/night</span>
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About This Property
              </h2>
              <p className="text-gray-600 leading-relaxed">{hotInfo.about}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Amenities
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {hotInfo.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{amenity}</span>
                  </div>
                )) || <p className="text-gray-500">No amenities listed</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {!showPaymentForm && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 mb-8 transition-all duration-300 hover:shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Select Your Stay Dates
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-gray-700 font-medium mb-3">Check-in Date:</p>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 font-medium mb-3">Check-out Date:</p>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>
              <div className="mb-8 mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Room Selection
                </h2>
                <div className="mb-6">
                  <p className="text-gray-700 font-medium mb-3">Room Type:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotInfo?.roomTypes?.map((roomType) => (
                      <label
                        key={roomType.name}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedRoomType === roomType.name
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="roomType"
                          value={roomType.name}
                          checked={selectedRoomType === roomType.name}
                          onChange={() => setSelectedRoomType(roomType.name)}
                          className="hidden"
                        />
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-lg text-gray-800">{roomType.name}</h3>
                            <p className="text-blue-600 font-medium">
                              {currencySymbol}
                              {roomType.price}
                              <span className="text-xs text-gray-500">/night</span>
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{roomType.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {roomType.amenities.map((amenity, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-gray-700 font-medium mb-3">Number of Rooms:</p>
                  <div className="flex items-center max-w-xs">
                    <button
                      type="button"
                      onClick={() => setRoomQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={roomQuantity <= 1}
                      className={`w-12 h-12 rounded-l-lg transition-all duration-200 ${roomQuantity <= 1 ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                    >
                      <svg className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={roomQuantity}
                      onChange={(e) => setRoomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-12 border-x-0 text-center text-lg font-semibold focus:ring-0 focus:outline-none"
                      aria-label="Number of rooms"
                    />
                    <button
                      type="button"
                      onClick={() => setRoomQuantity((prev) => prev + 1)}
                      className="w-12 h-12 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-r-lg transition-all duration-200"
                      aria-label="Increase number of rooms"
                    >
                      <svg className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Options
                </h2>
                <div className="space-y-4">
                  <label
                    className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${paymentOption === "pay_later" ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-200"}`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="pay_later"
                      checked={paymentOption === "pay_later"}
                      onChange={() => setPaymentOption("pay_later")}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                      aria-label="Pay later option"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-lg text-gray-800">Book Now, Pay Later</p>
                        <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">FLEXIBLE</div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Secure your room now without immediate payment</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${paymentOption === "pay_online" ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-200"}`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="pay_online"
                      checked={paymentOption === "pay_online"}
                      onChange={() => setPaymentOption("pay_online")}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                      aria-label="Pay online option"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-lg text-gray-800">Pay Online Now</p>
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                          SAVE {discountPercentage}%
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span>Secure payment via</span>
                        <img src={assets.stripe_logo} alt="Stripe" className="h-4 ml-1" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {showPaymentForm && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#3B82F6',
                    colorBackground: '#FFFFFF',
                    colorText: '#1F2937',
                    colorDanger: '#EF4444',
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </Elements>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-8">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 0 012-2h2a2 0 012 2" />
                </svg>
                Booking Summary
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Room Rate:</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {selectedRoomType 
                      ? hotInfo.roomTypes.find(rt => rt.name === selectedRoomType)?.price 
                      : hotInfo.pricePerNight} x {roomQuantity} room(s)
                  </span>
                </div>
                {paymentOption === "pay_online" && (
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>Discount:</span>
                    <span className="text-green-600 font-medium">
                      -{discountPercentage}% (
                      {currencySymbol}
                      {((selectedRoomType 
                        ? hotInfo.roomTypes.find(rt => rt.name === selectedRoomType)?.price * roomQuantity 
                        : hotInfo.pricePerNight * roomQuantity) * discountPercentage / 100).toFixed(2)})
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Date:</span>
                  <span className="font-medium">
                    {checkInDate && checkOutDate 
                      ? `${new Date(checkInDate).toLocaleDateString()} - ${new Date(checkOutDate).toLocaleDateString()}`
                      : "Not selected"}
                  </span>
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-700">
                      {currencySymbol}
                      {calculateTotalPrice().toFixed(2)}
                    </span>
                  </div>
                  {paymentOption === "pay_online" && (
                    <p className="text-green-600 text-xs font-medium mt-1 text-right">
                      You save {currencySymbol}
                      {((selectedRoomType 
                        ? hotInfo.roomTypes.find(rt => rt.name === selectedRoomType)?.price * roomQuantity 
                        : hotInfo.pricePerNight * roomQuantity) * discountPercentage / 100).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {!showPaymentForm && (
                <>
                  <button
                    type="button"
                    onClick={debouncedHandleBooking}
                    disabled={isLoading || isButtonDisabled || !checkInDate || !checkOutDate}
                    className={`w-full py-4 rounded-xl font-medium text-white flex items-center justify-center transition-all duration-300 shadow-md ${
                      !checkInDate || !checkOutDate || isButtonDisabled
                        ? "bg-gray-300 cursor-not-allowed"
                        : isLoading
                          ? "bg-blue-500"
                          : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    aria-label={paymentOption === "pay_online" ? "Proceed to payment" : "Complete booking"}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        {buttonText}
                      </>
                    ) : (
                      buttonText
                    )}
                  </button>

                  <div className="mt-6 flex items-center justify-center text-gray-500 text-sm">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Free cancellation up to 48 hours before check-in
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <RelatedHotels hotId={hotId} location={hotInfo.location} />

      {/* Reviews Modal */}
      <ReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        hotelId={hotId}
        hotelName={hotInfo?.name}
      />
    </div>
  );
};

export default Booking;