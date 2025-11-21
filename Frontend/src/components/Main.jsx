import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <div className="flex">

      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Area */}
      <div className="flex-1 md:ml-64 min-h-screen bg-gray-50">
        <Header />

        <main className="p-3 sm:p-5">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <Sidebar />
      </div>
      
    </div>
  );
};

export default Layout;
