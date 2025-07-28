import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Search, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react";

const Hotels = () => {
  const { location } = useParams();
  const [filterHot, setFilterHot] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const navigate = useNavigate();
  const { hotels } = useContext(AppContext);

  const applyFilter = () => {
    let filteredHotels = hotels.filter(hotel => hotel.available);

    if (location) {
      filteredHotels = filteredHotels.filter((hotel) => hotel.location === location);
    }

    if (searchTerm) {
      filteredHotels = filteredHotels.filter((hotel) =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort the hotels based on the selected option
    switch (sortOption) {
      case "name-asc":
        filteredHotels.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filteredHotels.sort((a, b) => b.name.localeCompare(b.name));
        break;
      case "location-asc":
        filteredHotels.sort((a, b) => a.location.localeCompare(b.name));
        break;
      case "price-asc":
        filteredHotels.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "price-desc":
        filteredHotels.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      default:
        // Default sorting remains as-is
        break;
    }

    setFilterHot(filteredHotels);
  };

  useEffect(() => {
    applyFilter();
  }, [hotels, location, searchTerm, sortOption]);

  const locations = [
    "Biratnagar", "Butwal", "Chitwan", "Dhangadi",
    "Jhapa", "Kathmandu", "Nepalgunj", "Pokhara"
  ];

  return (
    <div className="max-w-7xl mx-auto ">
      {/* <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Hotels</h1>
        <p className="text-gray-600">Browse and book hotels across Nepal</p>
      </div> */}

      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search hotels by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 flex items-center gap-2 w-full md:w-auto"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <SlidersHorizontal size={18} />
              <span>Sort by</span>
              <ChevronDown size={16} className={`transition-transform ${showSortOptions ? 'rotate-180' : ''}`} />
            </button>

            {showSortOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <ul className="py-2">
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === 'default' ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    onClick={() => { setSortOption('default'); setShowSortOptions(false); }}
                  >
                    Default
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === 'name-asc' ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    onClick={() => { setSortOption('name-asc'); setShowSortOptions(false); }}
                  >
                    Name: A to Z
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === 'name-desc' ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    onClick={() => { setSortOption('name-desc'); setShowSortOptions(false); }}
                  >
                    Name: Z to A
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === 'location-asc' ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    onClick={() => { setSortOption('location-asc'); setShowSortOptions(false); }}
                  >
                    Location
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === 'price-asc' ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    onClick={() => { setSortOption('price-asc'); setShowSortOptions(false); }}
                  >
                    Price: Low to High
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${sortOption === 'price-desc' ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    onClick={() => { setSortOption('price-desc'); setShowSortOptions(false); }}
                  >
                    Price: High to Low
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Location Filter Sidebar */}
        <div className="w-full lg:w-64">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white font-medium flex justify-between items-center">
              <h2 className="flex items-center gap-2">
                <MapPin size={18} />
                <span>Locations</span>
              </h2>
              <button
                className="lg:hidden"
                onClick={() => setShowFilter(!showFilter)}
              >
                <ChevronDown size={20} className={`transition-transform ${showFilter ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className={`p-4 ${showFilter || window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'}`}>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => navigate("/hotels")}
                    className={`w-full text-left px-4 py-2 rounded-md transition-all ${!location ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:bg-gray-100"}`}
                  >
                    All Locations
                  </button>
                </li>
                {locations.map((loc) => (
                  <li key={loc}>
                    <button
                      onClick={() => location === loc ? navigate("/hotels") : navigate(`/hotels/${loc}`)}
                      className={`w-full text-left px-4 py-2 rounded-md transition-all ${location === loc ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:bg-gray-100"}`}
                    >
                      {loc}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Hotel Cards */}
        <div className="flex-1">
          {filterHot.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg">No hotels found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterHot.map((hotel, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/booking/${hotel._id}`)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
                >
                  <div className="relative">
                    <img
                      className="w-full h-52 object-cover"
                      src={hotel.image}
                      alt={hotel.name}
                    />
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      Available
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{hotel.name}</h3>
                    <div className="flex items-center gap-1 text-gray-500 mb-3">
                      <MapPin size={16} />
                      <span>{hotel.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-900 font-medium">
                        NPR {hotel.pricePerNight.toLocaleString()} / night
                      </div>
                      <button className="text-indigo-600 text-sm font-medium hover:underline">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hotels;