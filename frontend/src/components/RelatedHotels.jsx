import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const RelatedHotels = ({ location, hotId }) => {
  const { hotels } = useContext(AppContext);
  const navigate = useNavigate();
  const [relHotels, setRelHotels] = useState([]);

  useEffect(() => {
    if (hotels.length > 0 && location) {
      const hotelData = hotels.filter((hot) => hot.location === location && hot._id !== hotId);
      setRelHotels(hotelData);

    }

  }, [hotels, location, hotId])
  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Related Hotels</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through our extensive list of trusted hotels
      </p>
      <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">
        {relHotels.slice(0, 5).map((item, index) => (
          <div
            onClick={() => { navigate(`/booking/${item._id}`); scrollTo(0, 0); }}
            className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
            key={index}
          >
            <img className="bg-blue-50 w-full h-48 object-cover " src={item.image} alt="" />
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm text-center text-green-500">
                <p className="w-2 h-2 bg-green-500 rounded-full"></p>
                <p>Available</p>
              </div>
              <p className="text-gray-900 text-lg font-medium">{item.name}</p>
              <p className="text-gray-600 text-sm">{item.location}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          navigate("/hotels");
          scrollTo(0, 0);
        }}
        className="bg-blue-100 text-gray-600 px-12 py-3 rounded-full mt-10"
      >
        More
      </button>
    </div>
  )
}

export default RelatedHotels
