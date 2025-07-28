import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";

const StarRating = ({ rating, size = "sm" }) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };
  
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${star <= rating ? "text-yellow-400" : "text-gray-300"} ${sizeClasses[size]} mx-0.5`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewsModal = ({ isOpen, onClose, hotelId, hotelName }) => {
  const { backendUrl } = useContext(AppContext);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && hotelId) {
      fetchReviews();
    }
  }, [isOpen, hotelId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/reviews/hotel/${hotelId}`);
      
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl leading-6 font-bold text-gray-900" id="modal-title">
                    Guest Reviews for {hotelName}
                  </h3>
                  <button
                    onClick={onClose}
                    type="button"
                    className="bg-white rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-4 text-gray-600 text-lg">No reviews yet for this hotel.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-50 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-3">
                          {averageRating}
                        </div>
                        <div>
                          <StarRating rating={Math.round(averageRating)} size="md" />
                          <p className="text-gray-600 mt-1">Based on {reviews.length} reviews</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                      {reviews.map((review) => (
                        <div key={review._id} className="border-b border-gray-200 pb-6 last:border-0">
                          <div className="flex items-start justify-between">
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
                                {review.userId?.name || "Anonymous"} • {formatDate(review.reviewDate || review.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-gray-700 whitespace-pre-line">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal; 