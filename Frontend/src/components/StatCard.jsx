import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

// --- UPDATED: Now accepts an 'icon' prop ---
const StatCard = ({ title, value, change, changeType, icon }) => {
  const isPositive = changeType === "positive";

  return (
    // --- UPDATED: Added hover effect and new internal layout ---
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
        </div>
        {/* Renders the icon in a styled circle */}
        <div className="bg-gray-100 rounded-full p-3">{icon}</div>
      </div>
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
