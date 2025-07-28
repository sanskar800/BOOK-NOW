import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(null);
  const [imageKey, setImageKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  // Update imageKey whenever userData.image changes to force image reload
  useEffect(() => {
    if (userData?.image) {
      setImageKey(Date.now());
      console.log("Updated userData.image:", userData.image);
    }
  }, [userData?.image]);

  // Function to reload profile data
  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
        headers: { token },
      });
      if (data.success) {
        setUserData(data.userData);
        console.log("Reloaded userData:", data.userData);
      } else {
        toast.error(data.message || "Failed to reload profile");
      }
    } catch (error) {
      console.error("Error reloading profile:", error);
      toast.error(error.response?.data?.message || "Failed to reload profile");
    }
  };

  const updateUserProfileData = async () => {
    setIsLoading(true);
    try {
      if (!userData?._id) {
        throw new Error("User ID is missing");
      }

      const formData = new FormData();
      formData.append('userId', userData._id);
      formData.append('name', userData.name);
      formData.append('phone', userData.phone);
      formData.append('address', JSON.stringify(userData.address));
      formData.append('gender', userData.gender || "");
      formData.append('dob', userData.dob || "");

      if (image) {
        console.log("Image to upload:", image);
        formData.append('image', image);
      } else {
        console.log("No image selected for upload");
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-profile`,
        formData,
        {
          headers: {
            token,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        if (data.userData) {
          console.log("Received updated userData:", data.userData);
          setUserData(data.userData);
          // Reload profile to ensure the latest data is fetched
          await loadUserProfileData();
        }
        setIsEdit(false);
        setImage(null);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Add cache-busting query parameter to the image URL
  const getImageUrl = (url) => {
    if (!url) return assets.default_user_image;
    return `${url}?v=${imageKey}`;
  };

  return (
    userData && (
      <div className="max-w-lg flex flex-col gap-2 text-sm">
        {isEdit ? (
          <label htmlFor="image">
            <div className="inline-block relative cursor-pointer">
              <img
                className="w-36 rounded opacity-75"
                src={image ? URL.createObjectURL(image) : getImageUrl(userData.image)}
                alt="Profile"
                onError={(e) => (e.target.src = assets.default_user_image)}
              />
              <img
                className="w-10 absolute bottom-12 right-12"
                src={assets.upload_icon}
                alt="Upload"
              />
            </div>
            <input
              onChange={(e) => setImage(e.target.files[0] || null)}
              type="file"
              id="image"
              accept="image/*"
              hidden
            />
          </label>
        ) : (
          <img
            className="w-36 rounded"
            src={getImageUrl(userData.image)}
            alt="Profile"
            onError={(e) => (e.target.src = assets.default_user_image)}
          />
        )}

        {isEdit ? (
          <input
            className="bg-gray-100 text-3xl font-medium max-w-60 mt-4"
            type="text"
            value={userData.name || ""}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        ) : (
          <p className="font-medium text-3xl text-neutral-800 mt-4">
            {userData.name || "No Name"}
          </p>
        )}

        <hr className="bg-zinc-400 h-[1px] border-none" />
        <div>
          <p className="text-neutral-500 underline mt-3">CONTACT INFORMATION</p>
          <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
            <p className="font-medium">Email Id:</p>
            <p className="text-blue-500">{userData.email || "No Email"}</p>
            <p className="font-medium">Phone:</p>
            {isEdit ? (
              <input
                className="bg-gray-100 max-w-52"
                type="text"
                value={userData.phone || ""}
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            ) : (
              <p className="text-blue-400">{userData.phone || "No Phone"}</p>
            )}
            <p className="font-medium">Address:</p>
            {isEdit ? (
              <p>
                <input
                  className="bg-gray-50"
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value },
                    }))
                  }
                  value={userData.address?.line1 || ""}
                  type="text"
                />
                <br />
                <input
                  className="bg-gray-50"
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      address: { ...prev.address, line2: e.target.value },
                    }))
                  }
                  value={userData.address?.line2 || ""}
                  type="text"
                />
              </p>
            ) : (
              <p className="text-gray-500">
                {userData.address?.line1 || "No Address"}
                <br />
                {userData.address?.line2 || ""}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-neutral-500 underline mt-3">BASIC INFORMATION</p>
          <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
            <p className="font-medium">Gender:</p>
            {isEdit ? (
              <select
                className="max-w-20 bg-gray-100"
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, gender: e.target.value }))
                }
                value={userData.gender || ""}
              >
                <option value="" disabled>
                  Select Gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Not Selected">Not Selected</option>
              </select>
            ) : (
              <p className="text-gray-400">{userData.gender || "Not Selected"}</p>
            )}
            <p className="font-medium">Birthday:</p>
            {isEdit ? (
              <input
                className="max-w-28 bg-gray-100"
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, dob: e.target.value }))
                }
                type="date"
                value={userData.dob || ""}
              />
            ) : (
              <p className="text-gray-400">{userData.dob || "Not Selected"}</p>
            )}
          </div>
        </div>

        <div className="mt-10">
          {isEdit ? (
            <button
              className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all duration-400"
              onClick={updateUserProfileData}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Information"}
            </button>
          ) : (
            <button
              className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all duration-400"
              onClick={() => setIsEdit(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    )
  );
};

export default MyProfile;