import React from "react";
import { locationData } from "../assets/assets";
import { Link } from "react-router-dom";

const LocationMenu = () => {
  return (
    <div className="flex flex-col items-center gap-4 py-16" id="location">
      <h1 className="text-3xl font-medium">Find By Location</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through extensive list of trusted hotels, book your room
        hassle-free.
      </p>
      <div className="flex sm:justify-center gap-8 pt-5 w-full overflow-scroll">
        {locationData.map((item, index) => (
          <Link
            onClick={() => scrollTo(0, 0)}
            className="flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500"
            key={index}
            to={`/hotels/${item.location}`}
          >
            <img className="w-16 sm:w-24 mb-2" src={item.image} alt="" />
            <p>{item.location}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LocationMenu;
