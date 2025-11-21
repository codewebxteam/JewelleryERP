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
  monthlySalesData,
  topSellingProducts,
  recentTransactions,
} from "../data/dummyData.jsx";

import { LineChart as ChartIcon, Gem, List } from "lucide-react";
import {  Eye, Download, CheckCircle, AlertCircle } from "lucide-react";

// Time Ago Helper
const timeAgo = (dateString) => {
  const now = new Date();
  const invoiceDate = new Date(dateString);
  const diff = (now - invoiceDate) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + " mins ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hours ago";
  if (diff < 172800) return "Yesterday";
  return Math.floor(diff / 86400) + " days ago";
};

const Dashboard = () => {
  // 🔥 Load invoices from localStorage
  const [invoices, setInvoices] = React.useState([]);

  React.useEffect(() => {
    const stored = localStorage.getItem("invoices");
    if (stored) {
      setInvoices(JSON.parse(stored));
    }
  }, []);
  return (
    <div className="space-y-6 px-3 sm:px-4 md:px-6 lg:px-0 pb-24">
      
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

      {/* Stats Cards */}
      <div
  className="
    grid 
    grid-cols-1 
    sm:grid-cols-2 
    lg:grid-cols-2 
    gap-5
  "
>
  {/* FIRST 2 CARDS (TOP ROW) */}
  {statsCardsData.slice(0, 2).map((item, index) => (
    <StatCard
      key={index}
      title={item.title}
      value={item.value}
      change={item.change}
      changeType={item.changeType}
      icon={item.icon}
    />
  ))}

  {/* NEXT 2 CARDS (BOTTOM ROW) */}
  {statsCardsData.slice(2, 4).map((item, index) => (
    <StatCard
      key={index}
      title={item.title}
      value={item.value}
      change={item.change}
      changeType={item.changeType}
      icon={item.icon}
    />
  ))}
</div>


      {/* Charts + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Monthly Sales Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <ChartIcon size={22} className="mr-2 text-brand-gold" />
            Monthly Sales Report
          </h3>

          <div className="w-full h-64 sm:h-80">
            <ResponsiveContainer>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
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
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
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

                    {/* Stock displayed in grams */}
                    <p className="text-sm text-gray-500">
                      Stock: {product.grams} gm
                    </p>
                  </div>
                </div>

                {/* SOLD displayed in grams */}
                <span className="text-lg font-semibold text-brand-gold">
                  {product.sold} gm{" "}
                  <span className="text-sm text-gray-500">sold</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>


{/* Recent Transactions */}
<div className="bg-white p-4 sm:p-6 mb-50 rounded-lg shadow-lg border border-gray-200">
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
        {invoices.slice(0, 6).map((tx) => (
          <tr key={tx.id} className="hover:bg-gray-50 transition">
            
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium">
              {tx.id}
            </td>

            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
              <div className="font-medium">{tx.customer.name}</div>
              <div className="text-xs text-gray-500">{timeAgo(tx.date)}</div>
            </td>

            <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900">
              ₹{tx.grandTotal.toLocaleString()}
            </td>

            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
              {tx.balanceDue === 0 ? (
                <span className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-semibold w-max">
                  <CheckCircle size={14} className="mr-1" />
                  Paid
                </span>
              ) : (
                <span className="flex items-center text-red-700 bg-red-100 px-3 py-1 rounded-full text-xs font-semibold w-max">
                  <AlertCircle size={14} className="mr-1" />
                  Due: ₹{tx.balanceDue.toLocaleString()}
                </span>
              )}
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
