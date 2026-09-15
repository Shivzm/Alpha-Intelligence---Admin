import React, { useState, useRef } from "react";
import { useAdmin } from "../../context/AdminContext";

export default function ProfileSettings() {
  const { adminProfile, setAdminProfile } = useAdmin();

  // State to hold the temporary preview of the uploaded image
  const [previewUrl, setPreviewUrl] = useState(adminProfile.avatar);

  // This allows us to click the hidden HTML file input programmatically
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a temporary local URL so the browser can preview the uploaded file
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUpdate = () => {
    // Only update if they actually selected a new image
    if (previewUrl !== adminProfile.avatar) {
      setAdminProfile((prev) => ({ ...prev, avatar: previewUrl }));
      alert("Profile picture updated successfully!");
    } else {
      alert("No new image selected.");
    }
  };

  return (
    <div className="h-full w-full p-8 overflow-y-auto">
      <div className="flex items-center gap-4 mb-2">
        <i className="ri-settings-3-line text-4xl text-gray-400"></i>
        <h1 className="text-3xl font-semibold">Profile Settings</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Manage your administrator profile details and preferences.
      </p>

      <div className="border border-gray-800/80 rounded-xl p-8 bg-[#0c0d12] max-w-2xl">
        {/* Interactive Avatar Upload Area */}
        <div className="flex items-center gap-6 mb-8">
          {/* Image Preview with Hover Overlay */}
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            <img
              src={previewUrl}
              alt="Current Avatar"
              className="w-24 h-24 rounded-full border-2 border-[#00e676] object-cover"
            />

            {/* Dark overlay with camera icon that appears on hover */}
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <i className="ri-camera-fill text-white text-xl"></i>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-1">
              Avatar Image
            </h3>
            <button
              onClick={() => fileInputRef.current.click()}
              className="text-sm text-[#00e676] hover:text-[#00c868] transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              Upload from device
            </button>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG or GIF (Max. 800x400px)
            </p>

            {/* The actual HTML file input (Hidden from view) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
              className="hidden"
            />
          </div>
        </div>

        <button
          onClick={handleUpdate}
          className="bg-[#00e676] hover:bg-[#00c868] text-black font-semibold px-6 py-2 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(0,230,118,0.2)]"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
