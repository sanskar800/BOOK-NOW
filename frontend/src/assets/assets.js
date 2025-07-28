import appointment_img from "../assets/appointment_img.png";
import header_img from "./header_img.png";
import group_profiles from "./group_profiles.png";
import profile_pic from "./profile_pic.png";
import contact_image from "./contact_img.png";
import about_image from "./about_image.jpg";
import logo from "./logo.png";
import dropdown_icon from "./dropdown_icon.svg";
import menu_icon from "./menu_icon.svg";
import cross_icon from "./cross_icon.png";
import chats_icon from "./chats_icon.svg";
import verified_icon from "./verified_icon.svg";
import arrow_icon from "./arrow_icon.svg";
import info_icon from "./info_icon.svg";
import upload_icon from "./upload_icon.png";
import stripe_logo from "./stripe_logo.png";
import razorpay_logo from "./razorpay_logo.png";
import hot1 from "./hotel1.jpg";
import hot2 from "./hotel2.jpg";
import hot3 from "./hotel3.jpeg";
import hot4 from "./hotel4.jpg";
import hot5 from "./hotel5.jpg";
import hot6 from "./hotel6.webp";
import hot7 from "./hotel7.jpg";
import hot8 from "./hotel8.jpeg";
import hot9 from "./hotel9.jpg";
import hot10 from "./hotel10.jpeg";
import hot11 from "./hotel11.jpg";
import hot12 from "./hotel12.jpeg";
import Biratnagar from "./Biratnagar.svg";
import Butwal from "./Butwal.svg";
import Chitwan from "./Chitwan.svg";
import Dhangadi from "./Dhangadi.svg";
import Jhapa from "./Jhapa.svg";
import Kathmandu from "./Kathmandu.svg";
import Nepalgunj from "./Nepalgunj.svg";
import Pokhara from "./Pokhara.svg";

export const assets = {
  appointment_img,
  header_img,
  group_profiles,
  logo,
  chats_icon,
  verified_icon,
  info_icon,
  profile_pic,
  arrow_icon,
  contact_image,
  about_image,
  menu_icon,
  cross_icon,
  dropdown_icon,
  upload_icon,
  stripe_logo,
  razorpay_logo,
};

export const locationData = [
  {
    location: "Biratnagar",
    image: Biratnagar,
  },
  {
    location: "Butwal",
    image: Butwal,
  },
  {
    location: "Chitwan",
    image: Chitwan,
  },
  {
    location: "Dhangadi",
    image: Dhangadi,
  },
  {
    location: "Jhapa",
    image: Jhapa,
  },
  {
    location: "Kathmandu",
    image: Kathmandu,
  },
  {
    location: "Nepalgunj",
    image: Nepalgunj,
  },
  {
    location: "Pokhara",
    image: Pokhara,
  },
];

export const hotels = [
  {
    _id: "hot1",
    name: "Hyatt Regency",
    image: hot1,
    location: "Kathmandu",
    amenities: ["Pool", "Spa", "Free Wi-Fi", "Gym", "Restaurant"],
    stars: 5,
    about:
      "Hyatt Regency Kathmandu is a luxury 5-star hotel offering elegant rooms, world-class amenities, and an unforgettable hospitality experience. Located near UNESCO World Heritage Sites, it's perfect for both leisure and business travelers.",
    pricePerNight: 5000,
    address: {
      line1: "Taragaon, Boudha",
      line2: "Kathmandu, Nepal",
    },
  },
  {
    _id: "hot2",
    name: "Chitwan Jungle Resort",
    image: hot2,
    location: "Chitwan",
    amenities: [
      "Pool",
      "Spa",
      "Free Wi-Fi",
      "Gym",
      "Restaurant",
      "Safari Tours",
    ],
    stars: 4,
    about:
      "Chitwan Jungle Resort offers a unique blend of luxury and adventure, providing comfortable accommodations along with access to thrilling safari tours in the nearby national park. Experience nature up close while enjoying world-class amenities.",
    pricePerNight: 4000,
    address: {
      line1: "Chitwan National Park Area",
      line2: "Chitwan, Nepal",
    },
  },
  {
    _id: "hot3",
    name: "Kathmandu Heritage Hotel",
    image: hot3,
    location: "Kathmandu",
    amenities: ["Pool", "Free Wi-Fi", "Gym", "Restaurant", "Cultural Tours"],
    stars: 5,
    about:
      "Kathmandu Heritage Hotel offers a luxurious stay with a deep connection to the rich cultural heritage of Nepal. Enjoy elegant rooms, world-class amenities, and easy access to the UNESCO World Heritage Sites in Kathmandu.",
    pricePerNight: 6000,
    address: {
      line1: "Thamel, Kathmandu",
      line2: "Kathmandu, Nepal",
    },
  },
  {
    _id: "hot4",
    name: "Lake View Resort",
    image: hot4,
    location: "Pokhara",
    amenities: [
      "Pool",
      "Free Wi-Fi",
      "Gym",
      "Restaurant",
      "Lake Views",
      "Boating",
    ],
    stars: 4,
    about:
      "Lake View Resort offers a peaceful retreat by the serene Phewa Lake, providing guests with stunning views, luxurious amenities, and a tranquil atmosphere. Perfect for relaxation and exploration in the scenic city of Pokhara.",
    pricePerNight: 4500,
    address: {
      line1: "Lakeside, Pokhara",
      line2: "Pokhara, Nepal",
    },
  },
  {
    _id: "hot5",
    name: "Nepalgunj Grand Hotel",
    image: hot5,
    location: "Nepalgunj",
    amenities: ["Pool", "Free Wi-Fi", "Gym", "Restaurant", "Conference Hall"],
    stars: 3,
    about:
      "Nepalgunj Grand Hotel offers modern accommodations in the heart of Nepalgunj, providing guests with comfortable rooms, excellent service, and essential amenities. Ideal for business and leisure travelers seeking convenience and comfort.",
    pricePerNight: 3500,
    address: {
      line1: "Ghorahi Road, Nepalgunj",
      line2: "Nepalgunj, Nepal",
    },
  },
  {
    _id: "hot6",
    name: "Butwal Garden Hotel",
    image: hot6,
    location: "Butwal",
    amenities: ["Free Wi-Fi", "Gym", "Restaurant", "Garden", "Conference Room"],
    stars: 4,
    about:
      "Butwal Garden Hotel offers a blend of comfort and nature with spacious rooms, a lush garden, and top-notch amenities. It's perfect for both relaxation and business travelers looking for a peaceful yet convenient stay in Butwal.",
    pricePerNight: 4000,
    address: {
      line1: "Lumbini Road, Butwal",
      line2: "Butwal, Nepal",
    },
  },
  {
    _id: "hot7",
    name: "Jhapa International Hotel",
    image: hot7,
    location: "Jhapa",
    amenities: ["Free Wi-Fi", "Restaurant", "Gym", "Banquet Hall", "Spa"],
    stars: 3,
    about:
      "Jhapa International Hotel provides a relaxing stay with comfortable accommodations and excellent services. Located in the heart of Jhapa, it offers easy access to local attractions, making it a great choice for both tourists and business travelers.",
    pricePerNight: 3200,
    address: {
      line1: "Mechinagar, Jhapa",
      line2: "Jhapa, Nepal",
    },
  },
  {
    _id: "hot8",
    name: "Kathmandu Mariott Hotel",
    image: hot8,
    location: "Kathmandu",
    amenities: ["Pool", "Free Wi-Fi", "Restaurant", "Bar", "Business Center"],
    stars: 4,
    about:
      "Kathmandu Mariott Hotel offers an ideal combination of modern comfort and traditional Nepali hospitality. Located in the heart of Kathmandu, it provides luxurious accommodations, a variety of dining options, and business services for both leisure and corporate travelers.",
    pricePerNight: 5500,
    address: {
      line1: "Naxal, Kathmandu",
      line2: "Kathmandu, Nepal",
    },
  },
  {
    _id: "hot9",
    name: "Pokhara Lakeside Resort",
    image: hot9,
    location: "Pokhara",
    amenities: ["Pool", "Free Wi-Fi", "Restaurant", "Bar", "Spa", "Lake Views"],
    stars: 5,
    about:
      "Pokhara Lakeside Resort offers a luxurious experience with stunning views of Phewa Lake and the Annapurna Range. With spacious rooms, world-class amenities, and unparalleled service, it's an ideal choice for those seeking relaxation and adventure in Pokhara.",
    pricePerNight: 7000,
    address: {
      line1: "Lakeside, Pokhara",
      line2: "Pokhara, Nepal",
    },
  },
  {
    _id: "hot10",
    name: "Dhangadi Royal Hotel",
    image: hot10,
    location: "Dhangadi",
    amenities: ["Free Wi-Fi", "Restaurant", "Gym", "Banquet Hall", "Bar"],
    stars: 3,
    about:
      "Dhangadi Royal Hotel provides comfortable and affordable accommodations with modern amenities. Located in the center of Dhangadi, it’s an ideal spot for both business and leisure travelers, offering a convenient stay with excellent service.",
    pricePerNight: 3000,
    address: {
      line1: "Gauriganga Road, Dhangadi",
      line2: "Dhangadi, Nepal",
    },
  },
  {
    _id: "hot11",
    name: "Biratnagar Regency Hotel",
    image: hot11,
    location: "Biratnagar",
    amenities: ["Free Wi-Fi", "Restaurant", "Gym", "Conference Room", "Bar"],
    stars: 4,
    about:
      "Biratnagar Regency Hotel offers a blend of comfort and luxury, providing a relaxing atmosphere with modern amenities. Whether you're here for business or leisure, this hotel offers a variety of services to meet your needs, with excellent access to the city's attractions.",
    pricePerNight: 4000,
    address: {
      line1: "Koshi Road, Biratnagar",
      line2: "Biratnagar, Nepal",
    },
  },
  {
    _id: "hot12",
    name: "Chitwan Safari Lodge",
    image: hot12,
    location: "Chitwan",
    amenities: ["Free Wi-Fi", "Restaurant", "Spa", "Safari Tours", "Bar"],
    stars: 4,
    about:
      "Chitwan Safari Lodge offers a unique experience with its proximity to Chitwan National Park, providing guests with thrilling safari tours, luxurious accommodations, and exceptional service. It’s the perfect choice for nature lovers and adventure seekers.",
    pricePerNight: 5000,
    address: {
      line1: "Sauraha, Chitwan",
      line2: "Chitwan, Nepal",
    },
  },
];
