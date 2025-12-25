import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Store,
  Edit3,
  Save,
  X,
  Camera,
  ArrowLeft,
} from "lucide-react";
import logo from "../assets/logo.webp";

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initial Data (LocalStorage se uthayega agar saved hai, nahi to default)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("shopProfile");
    return saved
      ? JSON.parse(saved)
      : {
          shopName: "Shree Laxmi Jewellers and Sons",
          ownerName: "",
          email: "", // Ye change nahi hoga
          phone: "+91 ",
          address: "",
        };
  });

  const [tempProfile, setTempProfile] = useState(profile);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempProfile({ ...tempProfile, [name]: value });
  };

  // Save Function
  const handleSave = () => {
    setLoading(true);
    // Yahan baad mein Firebase Update ka code lag sakta hai
    setTimeout(() => {
      setProfile(tempProfile);
      localStorage.setItem("shopProfile", JSON.stringify(tempProfile));
      setIsEditing(false);
      setLoading(false);
      alert("Profile Updated Successfully! 🎉");
    }, 800);
  };

  // Cancel Edit
  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-8 pb-20 px-4">
      {/* Back Button */}
      <div className="w-full max-w-3xl mb-4 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-yellow-700 transition font-medium"
        >
          <ArrowLeft size={20} className="mr-1" /> Back
        </button>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-yellow-100">
        {/* --- Header / Cover Section --- */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 h-32 md:h-40 relative">
          <div className="absolute -bottom-12 left-8 md:left-10">
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
                <img
                  src={logo}
                  alt="Shop Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              {/* Camera Icon (Visual only) */}
              <div className="absolute bottom-0 right-0 bg-gray-800 text-white p-1.5 rounded-full border-2 border-white cursor-pointer hover:bg-black transition">
                <Camera size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* --- Actions Bar --- */}
        <div className="flex justify-end pt-4 pr-6 pb-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              <Edit3 size={18} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition"
              >
                <X size={18} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition shadow-md"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={18} /> Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* --- Form Content --- */}
        <div className="mt-6 px-8 pb-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Shop Name */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Store size={14} /> Shop Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="shopName"
                  value={tempProfile.shopName}
                  onChange={handleChange}
                  className="w-full text-xl font-bold text-gray-800 border-b-2 border-yellow-200 focus:border-yellow-600 outline-none py-1 bg-transparent placeholder-gray-300"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">
                  {profile.shopName}
                </h2>
              )}
            </div>

            {/* Owner Name */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <User size={14} /> Owner Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="ownerName"
                  value={tempProfile.ownerName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition"
                />
              ) : (
                <p className="text-lg font-medium text-gray-700 py-1">
                  {profile.ownerName}
                </p>
              )}
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Mail size={14} /> Email Address{" "}
                <span className="text-red-400 text-[10px] ml-auto font-normal">
                  (Not Editable)
                </span>
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Phone size={14} /> Phone Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={tempProfile.phone}
                  onChange={handleChange}
                  placeholder="+91..."
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition"
                />
              ) : (
                <p className="text-lg font-medium text-gray-700 py-1">
                  {profile.phone}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <MapPin size={14} /> Shop Address
              </label>
              {isEditing ? (
                <textarea
                  name="address"
                  rows="3"
                  value={tempProfile.address}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition resize-none"
                />
              ) : (
                <p className="text-lg text-gray-700 py-1 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {profile.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <p className="mt-6 text-gray-400 text-sm text-center">
        Jewellery ERP System • Version 1.0
      </p>
    </div>
  );
};

export default Profile;
