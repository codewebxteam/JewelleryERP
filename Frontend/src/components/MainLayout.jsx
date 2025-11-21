import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  return (
    <div className="flex w-full overflow-hidden">

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 min-h-screen bg-gray-100 flex flex-col overflow-hidden">

        {/* HEADER */}
        <Header />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
          <Outlet />
        </main>

      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <Sidebar />
      </div>
    </div>
  );
};

export default MainLayout;
