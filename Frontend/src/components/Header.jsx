import React, { useState, useRef, useEffect } from "react";
import { UserCircle, LogOut, KeyRound, User } from "lucide-react";
import logo from "../assets/logo.webp";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMenu = () => setOpen(!open);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("auth");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm w-full">

      {/* LEFT SECTION */}
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="h-10 w-10 mr-3" />

        {/* Desktop full name (Only on 1024px and above) */}
        <h1 className="hidden lg:block text-2xl font-semibold text-gray-800">
          Shree Laxmi Jewellers and Sons
        </h1>

        {/* Mobile + Tablet + Small Laptops */}
        <h1 className="lg:hidden text-xl font-semibold text-gray-800">
          Shree Laxmi Jewellers
        </h1>
      </div>

      {/* RIGHT SECTION */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center cursor-pointer hover:opacity-80"
          onClick={toggleMenu}
        >
          {/* Show admin only on Desktop */}
          <span className="hidden lg:block mr-2 text-gray-700">Admin</span>
          <UserCircle className="h-7 w-7 text-gray-600" />
        </div>

        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-md py-2 z-50">
            <button
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => navigate("/profile")}
            >
              <User className="h-5 w-5" />
              Profile
            </button>

            <button
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => navigate("/reset-password")}
            >
              <KeyRound className="h-5 w-5" />
              Reset Password
            </button>

            <button
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
