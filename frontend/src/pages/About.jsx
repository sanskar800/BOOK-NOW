import React from "react";
import { assets } from "../assets/assets";

const About = () => {
  return <div>
    <div className="text-center text-2xl pt-10 text-gray-500">
      <p>ABOUT <span className="text-gray-700 font-medium">US</span></p>
    </div>
    <div className="my-10 flex flex-col md:flex-row gap-12">
      <img className="w-full md:max-w-[450px]" src={assets.about_image} alt="" />
      <div className="flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600">
        <p>Welcome to BookNow, your trusted platform for seamless hotel reservations. We understand the challenges travelers face when searching for the perfect stay, whether for leisure or business. That’s why we’ve built an intuitive and efficient booking experience tailored just for you.</p>
        <p>At BookNow, we are committed to excellence in hospitality technology. Our platform integrates the latest advancements to enhance user experience, offering a wide selection of hotels, real-time availability, and personalized recommendations. Whether you're planning a luxury getaway, a business trip, or a budget-friendly stay, we make booking effortless.</p>
        <b className="text-gray-800">Our Vision</b>
        <p>Our vision is to revolutionize the way travelers find and book accommodations. We strive to bridge the gap between hotels and guests by making high-quality stays more accessible, convenient, and enjoyable. With our easy-to-use platform, you can book with confidence, knowing you’ll get the best options at the best prices.</p>
      </div>
    </div>
    <div className="text-xl my-4">
      <p>WHY <span className="text-gray-700 font-semibold">CHOOSE US</span></p>
    </div>
    <div className="flex flex-col md:flex-row mb-20">
      <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
        <b>EASE OF USE</b>
        <p>A seamless booking experience with an intuitive and user-friendly interface.</p>
      </div>
      <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
        <b>VARIETY</b>
        <p>Access to a diverse range of hotels, from budget-friendly stays to luxury resorts.</p>
      </div>
      <div className="border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
        <b>PERSONALIZATION</b>
        <p>Smart recommendations and exclusive deals tailored to your preferences.</p>
      </div>
    </div>
  </div>;
};

export default About;
