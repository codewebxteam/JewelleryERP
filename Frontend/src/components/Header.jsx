import React from "react";
import { UserCircle, LogOut, Menu } from "lucide-react";
import logo from "../assets/logo.png";

const Header = () => {
  const handleLogout = () => {
    localStorage.removeItem("auth");
    window.location.href = "/login";
  };

  return (
    <header className="w-full bg-white border-b shadow-md px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">

        {/* LEFT SECTION — LOGO + TITLE */}
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo"
            className="h-10 w-10 object-contain rounded-md shadow-sm"
          />

          <h1
            className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 leading-tight"
          >
            Shree Laxmi Jewellers <span className="hidden sm:inline">& Sons</span>
          </h1>
        </div>

        {/* RIGHT SECTION — ADMIN + LOGOUT */}
        <div className="flex items-center gap-5">

          {/* Admin Profile */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-gray-700 font-medium">Admin</span>
            <UserCircle className="h-7 w-7 text-gray-600" />
          </div>

          {/* Mobile Profile Icon Only */}
          <div className="sm:hidden">
            <UserCircle className="h-7 w-7 text-gray-600" />
          </div>

        </div>
        
      </div>
    </header>
  );
};

export default Header;
