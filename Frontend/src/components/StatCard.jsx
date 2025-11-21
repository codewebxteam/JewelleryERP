import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

// --- UPDATED: Now accepts an 'icon' prop ---
const StatCard = ({ title, value, change, changeType, icon }) => {
  const isPositive = changeType === "positive";

  return (
    <div className="relative bg-white w-full min-h-40 p-5 rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition duration-300">

      {/* ICON FIXED TOP RIGHT */}
      <div className="absolute top-5 right-5 bg-gray-100 p-5 rounded-full">
        {icon}
      </div>

      {/* TITLE & VALUE */}
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
      </div>

      {/* CHANGE ROW */}
      <div className="flex items-center mt-4">
        <span
          className={`flex items-center text-sm font-medium ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <ArrowUp className="mr-1" size={16} />
          ) : (
            <ArrowDown className="mr-1" size={16} />
          )}
          {change}
        </span>
        <span className="text-xs text-gray-400 ml-2">vs. last period</span>
      </div>

    </div>
  );
};



export default StatCard;
