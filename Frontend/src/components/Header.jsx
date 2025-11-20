import React from "react";
import { UserCircle, LogOut } from "lucide-react";
import logo from "../assets/logo.png";

const Header = () => {
  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.href = "/login";
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="h-10 w-10 mr-3" />
        <h1 className="text-2xl font-semibold text-gray-800">
          Shree Laxmi Jewellers and Sons
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <span className="mr-2 text-gray-700">Admin</span>
          <UserCircle className="h-7 w-7 text-gray-600" />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
