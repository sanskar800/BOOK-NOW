import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const StarRating = ({ rating, setRating, editable = true }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className={`${
            editable ? "cursor-pointer focus:outline-none transform transition duration-150 hover:scale-110" : "cursor-default"
          } ${
            star <= (hover || rating)
              ? "text-yellow-400"
              : "text-gray-300"
          } text-2xl mx-1`}
          onClick={() => editable && setRating(star)}
          onMouseEnter={() => editable && setHover(star)}
          onMouseLeave={() => editable && setHover(0)}
          disabled={!editable}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ReviewForm = ({ bookingId, hotelName, onReviewSubmitted, existingReview = null }) => {
  const { backendUrl, token } = useContext(AppContext);
  const [rating, setRating] = useState(existingReview ? existingReview.rating : 0);
  const [comment, setComment] = useState(existingReview ? existingReview.comment : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [canReviewMessage, setCanReviewMessage] = useState("");
  const isEditing = !!existingReview;

  useEffect(() => {
    const checkCanReview = async () => {
      try {
        // Skip this check if we're editing an existing review
        if (isEditing) {
          setCanReview(true);
          return;
        }

        const { data } = await axios.get(
          `${backendUrl}/api/reviews/can-review/${bookingId}`,
          { headers: { token } }
        );

        if (data.success) {
          setCanReview(data.canReview);
          if (!data.canReview) {
            setCanReviewMessage(data.message);
            if (data.hasReviewed && data.existingReview) {
              // If user already has a review, populate the form with it
              setRating(data.existingReview.rating);
              setComment(data.existingReview.comment);
            }
          }
        }
      } catch (error) {
        console.error("Error checking review eligibility:", error);
        setCanReview(false);
        setCanReviewMessage("Unable to check if you can review this booking");
      }
    };

    checkCanReview();
  }, [backendUrl, token, bookingId, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    if (comment.trim() === "") {
      toast.error("Please enter a comment");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (isEditing) {
        // Update existing review
        response = await axios.patch(
          `${backendUrl}/api/reviews/${existingReview._id}`,
          { rating, comment },
          { headers: { token } }
        );
      } else {
        // Create new review
        response = await axios.post(
          `${backendUrl}/api/reviews/create`,
          { bookingId, rating, comment },
          { headers: { token } }
        );
      }
      
      if (response.data.success) {
        toast.success(isEditing ? "Review updated successfully" : "Review submitted successfully");
        
        // Reset form if it's a new review
        if (!isEditing) {
          setRating(0);
          setComment("");
        }
        
        // Notify parent component
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.review);
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canReview && !isEditing) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{canReviewMessage || "You cannot review this booking at this time."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
      <h3 className="text-xl font-semibold mb-4">{isEditing ? "Edit Your Review" : `Review Your Stay at ${hotelName}`}</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Rating</label>
          <div className="flex items-center">
            <StarRating rating={rating} setRating={setRating} />
            {rating > 0 && (
              <span className="ml-2 text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
            Your Review
          </label>
          <textarea
            id="comment"
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Share your experience at this hotel..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg bg-blue-600 text-white font-medium transition-colors duration-300 ${
              isSubmitting ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>{isEditing ? "Updating..." : "Submitting..."}</span>
              </div>
            ) : (
              <>{isEditing ? "Update Review" : "Submit Review"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm; 