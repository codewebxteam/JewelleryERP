import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Package,
  Database,
  LineChart,
  LogOut,
} from "lucide-react";

// Reusable Nav Item
const NavItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center md:px-4 px-2 py-3 rounded-lg transition 
        ${
          isActive
            ? "bg-brand-gold bg-opacity-20 text-brand-gold font-bold"
            : "text-gray-700 hover:bg-gray-200"
        }`
      }
    >
      {icon}
      <span className="ml-2 hidden md:inline">{label}</span>
    </NavLink>
  );
};

const Sidebar = () => {
  return (
    <>
      {/* ----- DESKTOP & TABLET SIDEBAR ----- */}
      <div className="hidden md:flex flex-col w-56 lg:w-64 bg-white border-r shadow-lg h-screen fixed">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 px-3 space-y-2">

            <NavItem
              to="/"
              icon={<LayoutDashboard size={22} />}
              label="Dashboard"
            />

            <NavItem
              to="/billing"
              icon={<FileText size={22} />}
              label="Billing"
            />

            <NavItem
              to="/girwi"
              icon={<Database size={22} />}
              label="Girwi"
            />

            <NavItem
              to="/stock"
              icon={<Package size={22} />}
              label="Stock"
            />

            <NavItem
              to="/reports"
              icon={<LineChart size={22} />}
              label="Reports"
            />
          </nav>
        </div>

        {/* Logout bottom */}
        <div className="p-4 border-t ">
          <NavItem to="/login" icon={<LogOut size={25} />} label="Logout" />
        </div>
      </div>
      

      {/* ----- MOBILE BOTTOM NAVIGATION BAR ----- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex justify-between px-4 py-3 z-10 ">

        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
              isActive ? "text-brand-gold font-bold" : "text-gray-600"
            }`
          }
        >
          <LayoutDashboard size={22} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/billing"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
              isActive ? "text-brand-gold font-bold" : "text-gray-600"
            }`
          }
        >
          <FileText size={22} />
          <span>Billing</span>
        </NavLink>

        <NavLink
          to="/girwi"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
              isActive ? "text-brand-gold font-bold" : "text-gray-600"
            }`
          }
        >
          <Database size={22} />
          <span>Girwi</span>
        </NavLink>

        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
              isActive ? "text-brand-gold font-bold" : "text-gray-600"
            }`
          }
        >
          <Package size={22} />
          <span>Stock</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
              isActive ? "text-brand-gold font-bold" : "text-gray-600"
            }`
          }
        >
          <LineChart size={22} />
          <span>Reports</span>
        </NavLink>

      </div>
    </>
  );
};

export default Sidebar;
