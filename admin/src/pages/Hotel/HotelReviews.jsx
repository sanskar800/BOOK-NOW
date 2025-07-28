import React, { useState, useEffect, useContext } from 'react';
import { HotelContext } from '../../context/HotelContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-gray-300" />);
    }
  }

  return <div className="flex">{stars}</div>;
};

const HotelReviews = () => {
  const { getHotelDetails } = useContext(HotelContext);
  const [hotelDetails, setHotelDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get hotel details
      const hotelResponse = await getHotelDetails();
      if (!hotelResponse.success || !hotelResponse.hotel) {
        toast.error('Failed to load hotel details');
        setLoading(false);
        return;
      }

      setHotelDetails(hotelResponse.hotel);

      // Fetch reviews
      await fetchReviews(hotelResponse.hotel._id);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load review data');
      setLoading(false);
    }
  };

  const fetchReviews = async (hotelId) => {
    try {
      if (!hotelId) {
        console.error('No hotel ID available');
        return;
      }

      const response = await axios.get(`http://localhost:4000/api/reviews/hotel/${hotelId}`);
      
      if (response.data.success) {
        setReviews(response.data.reviews || []);
        setAverageRating(Number(response.data.averageRating) || 0);
        
        // Calculate rating distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        response.data.reviews.forEach(review => {
          distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        });
        setRatingDistribution(distribution);
      } else {
        toast.error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateDistributionPercentage = (rating) => {
    const totalReviews = reviews.length;
    if (totalReviews === 0) return 0;
    return (ratingDistribution[rating] / totalReviews) * 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Guest Reviews & Feedback</h1>
      
      {reviews.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <FaStar className="text-gray-300 text-5xl" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Reviews Yet</h2>
          <p className="text-gray-600">
            Your hotel hasn't received any reviews yet. Reviews will appear here once guests rate their stay.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Rating Overview */}
              <div className="col-span-1 flex flex-col items-center justify-center border-r border-gray-200">
                <h2 className="text-xl font-semibold mb-2">Overall Rating</h2>
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="mb-2">
                  <StarRating rating={averageRating} />
                </div>
                <p className="text-gray-600">Based on {reviews.length} reviews</p>
              </div>
              
              {/* Rating Distribution */}
              <div className="col-span-2">
                <h2 className="text-xl font-semibold mb-4">Rating Distribution</h2>
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="flex items-center mb-2">
                    <div className="w-16 text-sm">
                      {rating} {rating === 1 ? 'star' : 'stars'}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 h-2 rounded-full">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${calculateDistributionPercentage(rating)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {ratingDistribution[rating]} ({calculateDistributionPercentage(rating).toFixed(0)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Reviews List */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Recent Reviews</h2>
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review._id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <StarRating rating={review.rating} />
                        <span className="ml-2 text-gray-800 font-medium">
                          {review.rating === 5 && "Excellent"}
                          {review.rating === 4 && "Very Good"}
                          {review.rating === 3 && "Good"}
                          {review.rating === 2 && "Fair"}
                          {review.rating === 1 && "Poor"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        {review.userId?.name || "Anonymous Guest"} • {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HotelReviews; 