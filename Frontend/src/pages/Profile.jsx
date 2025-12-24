import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.webp";

const Profile = () => {
  const navigate = useNavigate();

  const admin = {
    name: "Admin User",
    email: "admin@example.com",
    shop: "Shree Laxmi Jewellers and Sons",
  };

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border border-yellow-200">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="h-20 mb-3" />
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Profile
          </h1>
        </div>

        <div className="space-y-4 text-gray-700">
          <div>
            <label className="block font-medium">Name</label>
            <p className="border rounded p-2 bg-gray-100">{admin.name}</p>
          </div>
          <div>
            <label className="block font-medium">Email</label>
            <p className="border rounded p-2 bg-gray-100">{admin.email}</p>
          </div>
          <div>
            <label className="block font-medium">Shop Name</label>
            <p className="border rounded p-2 bg-gray-100">{admin.shop}</p>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-6 w-full py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default Profile;