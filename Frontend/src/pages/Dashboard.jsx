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
  recentTransactions,
} from "../data/dummyData.jsx";
import {
  LineChart as ChartIcon,
  Gem,
  List,
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6 px-3 sm:px-4 md:px-6 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome, Admin!
          </h2>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Here's a summary of your shop's activity.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCardsData.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Charts and Top Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sales Line Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 transition-shadow duration-300">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <ChartIcon size={22} className="mr-2 text-brand-gold" />
            Weekly Sales Report
          </h3>
          <div className="w-full h-64 sm:h-80">
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
                  stroke="#D4AF37"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 transition-shadow duration-300">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <Gem size={22} className="mr-2 text-brand-gold" />
            Top Selling Products
          </h3>

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

      {/* Recent Transactions */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 transition-shadow duration-300">
        <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <List size={22} className="mr-2 text-brand-gold" />
          Recent Transactions
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Invoice ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-900">
                    {tx.id}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                    {tx.customerName}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
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
