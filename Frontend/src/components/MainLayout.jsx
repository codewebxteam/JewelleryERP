import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const MainLayout = () => {
  const navigate = useNavigate();

  // ✅ Logout Function: Ye session clear karega
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Logout ke baad Login page par bhejo
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="flex w-full overflow-hidden relative">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col flex-shrink-0 bg-white border-r h-screen">
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>

        {/* ✅ Logout Button (Sidebar ke niche) */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 transition shadow"
          >
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 min-h-screen bg-gray-100 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 relative">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-between items-center px-4 py-2 shadow-lg">
        <Sidebar />
        {/* Mobile Logout Icon/Button */}
        <button
          onClick={handleLogout}
          className="text-xs text-white bg-red-500 px-3 py-1 rounded font-bold ml-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default MainLayout;
