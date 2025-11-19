import React from "react";
import StatCard from "../components/StatCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  statsCardsData,
  salesDataLineChart,
  topSellingProducts,
  recentTransactions, // --- ADDED ---
} from "../data/dummyData.jsx";
import {
  LineChart as ChartIcon, // --- ADDED: Aliased icon ---
  Gem,
  List, // --- ADDED ---
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* --- ADDED: Welcome Header --- */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome, Admin!</h2>
          <p className="text-gray-500 mt-1">
            Here's a summary of your shop's activity.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCardsData.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon} // --- ADDED: Passing icon prop ---
          />
        ))}
      </div>

      {/* Charts and Top Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Line Chart (Takes 2/3 width on large screens) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          {/* --- UPDATED: Added icon to title --- */}
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <ChartIcon size={22} className="mr-2 text-brand-gold" />
            Weekly Sales Report
          </h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={salesDataLineChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip wrapperClassName="shadow-lg rounded-md border border-gray-200" />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#D4AF37" // Brand Gold color
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products (Takes 1/3 width) */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          {/* --- UPDATED: Added icon to title --- */}
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <Gem size={22} className="mr-2 text-brand-gold" />
            Top Selling Products
          </h3>
          {/* --- UPDATED: List design --- */}
          <ul className="space-y-3">
            {topSellingProducts.map((product) => (
              <li
                key={product.id}
                className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0"
              >
                <div className="flex items-center">
                  <div className="bg-gray-100 rounded-full p-2 mr-3">
                    {product.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-semibold text-brand-gold">
                  {product.sold}{" "}
                  <span className="text-sm text-gray-500">sold</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- ADDED: New Recent Transactions Table --- */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <List size={22} className="mr-2 text-brand-gold" />
          Recent Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tx.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {tx.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
