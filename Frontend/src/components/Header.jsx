import React from "react";
import { UserCircle } from "lucide-react"; // Changed import
// Make sure to add your logo.png to the src/assets/ folder
import logo from "../assets/logo.png";

const Header = () => {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="h-10 w-10 mr-3" />
        <h1 className="text-2xl font-semibold text-gray-800">
          Shree Laxmi Jewellers and Sons
        </h1>
      </div>
      <div className="flex items-center">
        <span className="mr-4 text-gray-700">Admin</span>
        {/* Changed component */}
        <UserCircle className="h-8 w-8 text-gray-600" />
      </div>
    </header>
  );
};

export default Header;
