import React from "react";
import { assets } from "../assets/assets";

const Contact = () => {
  return (
    <div>
      <div className="text-center text-2xl pt-10 text-gray-500">
        <p>CONTACT <span className="text-gray-700 font-semibold">US</span></p>
      </div>
      <div className="my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm">
        <img className="w-full md:max-w-[550px]" src={assets.contact_image} alt="Contact" />
        <div className="flex flex-col justify-center items-start gap-6">
          <p className="font-semibold text-lg text-gray-600">OUR OFFICE</p>
          <p className="text-gray-500">M8VM+9W2, Nava Srijana Marg <br /> Kathmandu 44600, Nepal</p>
          <p className="text-gray-500">Tel: 01-5970099 <br /> Email: booknow321@gmail.com</p>
          <p className="font-semibold text-lg text-gray-600">Careers at BookNow</p>
          <p className="text-gray-500">Learn more about our team and job openings.</p>
          <button className="border border-black px-6 py-3 text-sm hover:bg-black hover:text-white transition-all duration-500">
            Explore Jobs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;
