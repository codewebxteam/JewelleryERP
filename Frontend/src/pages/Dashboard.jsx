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
  LineChart as ChartIcon,
  Gem,
  List as ListIcon,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  CalendarClock,
  TrendingUp,
  X as CloseIcon,
  Filter,
} from "lucide-react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

// Time Ago Helper
const timeAgo = (dateValue) => {
  if (!dateValue) return "-";
  const now = new Date();

  const invoiceDate =
    dateValue && dateValue.seconds
      ? new Date(dateValue.seconds * 1000)
      : new Date(dateValue);

  const diff = (now - invoiceDate) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + " mins ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hours ago";
  if (diff < 172800) return "Yesterday";
  return Math.floor(diff / 86400) + " days ago";
};

const ITEMS_PER_PAGE = 5;

const Dashboard = () => {
  const [invoices, setInvoices] = React.useState([]);
  const [modalType, setModalType] = React.useState(null); // which popup is open
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter State
  const [dateFilter, setDateFilter] = React.useState("All Time");
  const [showFilterBar, setShowFilterBar] = React.useState(false);
  const [customRange, setCustomRange] = React.useState({
    start: "",
    end: "",
  });

  React.useEffect(() => {
    const ref = query(collection(db, "invoices"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvoices(data);
    });

    return () => unsubscribe();
  }, []);

  // Helpers
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const getValidDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  // Prefer createdAt if available, else fall back to date string
  const getInvoiceDate = (inv) => {
    if (inv?.createdAt?.seconds) {
      return new Date(inv.createdAt.seconds * 1000);
    }
    if (inv?.date) {
      const dt = new Date(inv.date);
      return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  };

  // ====== FILTERING LOGIC ======
  const filteredInvoices = React.useMemo(() => {
    if (dateFilter === "All Time") return invoices;

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    return invoices.filter((inv) => {
      const d = getInvoiceDate(inv);
      if (!d) return false;
      const dTime = d.getTime();

      switch (dateFilter) {
        case "Today":
          return dTime >= startOfDay.getTime();
        case "This Month":
          return (
            d.getMonth() === new Date().getMonth() &&
            d.getFullYear() === new Date().getFullYear()
          );
        case "This Quarter": {
          const currentMonth = new Date().getMonth();
          const qStartMonth =
            Math.floor(currentMonth / 3) * 3; // 0, 3, 6, 9
          const qStart = new Date(new Date().getFullYear(), qStartMonth, 1);
          const qEnd = new Date(
            new Date().getFullYear(),
            qStartMonth + 3,
            0
          );
          return dTime >= qStart.getTime() && dTime <= qEnd.getTime();
        }
        case "This Year":
          return d.getFullYear() === new Date().getFullYear();
        case "Custom":
          if (!customRange.start || !customRange.end) return true;
          const s = new Date(customRange.start);
          const e = new Date(customRange.end);
          e.setHours(23, 59, 59, 999); // End of day
          return dTime >= s.getTime() && dTime <= e.getTime();
        default:
          return true;
      }
    });
  }, [invoices, dateFilter, customRange]);

  // ====== CORE STATS FROM INVOICES ======

  // Total Sales (Filtered)
  const totalSales = React.useMemo(
    () =>
      filteredInvoices.reduce(
        (sum, inv) => sum + Number(inv.grandTotal || 0),
        0
      ),
    [filteredInvoices]
  );

  // Pending invoices (balanceDue > 0) - Filtered
  const pendingInvoices = React.useMemo(
    () => filteredInvoices.filter((inv) => Number(inv.balanceDue || 0) > 0),
    [filteredInvoices]
  );
  const totalPendingAmount = React.useMemo(
    () =>
      pendingInvoices.reduce(
        (sum, inv) => sum + Number(inv.balanceDue || 0),
        0
      ),
    [pendingInvoices]
  );

  // Total Orders (Filtered)
  const totalOrders = filteredInvoices.length;

  // Today invoices -> based on createdAt (fallback to date)
  const todayInvoices = React.useMemo(
    () =>
      invoices.filter((inv) => {
        const d = getInvoiceDate(inv);
        if (!d) return false;
        const dStr = d.toISOString().split("T")[0];
        return dStr === todayStr;
      }),
    [invoices, todayStr]
  );

  const todaySales = React.useMemo(
    () =>
      todayInvoices.reduce(
        (sum, inv) => sum + Number(inv.grandTotal || 0),
        0
      ),
    [todayInvoices]
  );

  // Current Month Revenue (still uses date string for compatibility)
  const currentMonthRevenue = React.useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const d = getValidDate(inv.date);
      if (!d) return sum;
      if (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth()
      ) {
        return sum + Number(inv.grandTotal || 0);
      }
      return sum;
    }, 0);
  }, [invoices, today]);

  // ====== MONTHLY SALES CHART DATA ======

  const monthlyChartData = React.useMemo(() => {
    const map = {};

    filteredInvoices.forEach((inv) => {
      const d = getValidDate(inv.date);
      if (!d) return;
      const ymKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const label = d.toLocaleString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      if (!map[ymKey]) {
        map[ymKey] = { monthKey: ymKey, month: label, sales: 0 };
      }
      map[ymKey].sales += Number(inv.grandTotal || 0);
    });

    return Object.values(map)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6); // last 6 months
  }, [filteredInvoices]);

  // ====== TOP SELLING PRODUCTS (TOTAL GRAMS) ======

  const topProducts = React.useMemo(() => {
    const productMap = {};

    filteredInvoices.forEach((inv) => {
      const items = inv.newItems || inv.items || [];
      items.forEach((item) => {
        if (!item.name) return;
        const wt = Number(item.weight || 0);
        if (!wt) return;

        if (!productMap[item.name]) {
          productMap[item.name] = {
            name: item.name,
            totalWeight: 0,
            timesSold: 0,
          };
        }
        productMap[item.name].totalWeight += wt;
        productMap[item.name].timesSold += 1;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.totalWeight - a.totalWeight)
      .slice(0, 5);
  }, [filteredInvoices]);

  // ====== MODAL DATA HELPERS ======

  const monthlyInvoices = React.useMemo(
    () =>
      invoices.filter((inv) => {
        const d = getValidDate(inv.date);
        if (!d) return false;
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth()
        );
      }),
    [invoices, today]
  );

  const allInvoicesSorted = React.useMemo(
    () =>
      [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [invoices]
  );

  const openModal = (type) => {
    setModalType(type);
    setCurrentPage(1); // reset page every time modal opens
  };

  const closeModal = () => setModalType(null);

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN")}`;

  const renderModalTitle = () => {
    switch (modalType) {
      case "totalSales":
        return "All Sales (All Time)";
      case "pending":
        return "Pending Payments";
      case "orders":
        return "All Orders / Invoices";
      case "today":
        return "Today’s Sales";
      case "monthly":
        return "This Month’s Revenue";
      case "topProducts":
        return "Top Selling Products (Total Grams)";
      default:
        return "";
    }
  };

  // Pagination helper for invoice tables inside modals
  const renderInvoiceTable = (list) => {
    const totalPages = Math.max(
      1,
      Math.ceil((list?.length || 0) / ITEMS_PER_PAGE)
    );
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageData = list.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
      <div>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Invoice
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Customer
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Date
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Total
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Received
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pageData.map((inv) => (
                <tr key={inv.invoiceNo} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{inv.invoiceNo}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {inv.customer?.name || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {inv.customer?.contact || ""}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {inv.date || "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="px-3 py-2 text-right text-green-700">
                    {formatCurrency(inv.receivedAmount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(inv.balanceDue || 0) > 0 ? (
                      <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                        <AlertCircle size={12} className="mr-1" />
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        <CheckCircle size={12} className="mr-1" />
                        Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-gray-400 text-sm"
                  >
                    No records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {list.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between mt-3 text-sm">
            <button
              className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "totalSales":
        return renderInvoiceTable(allInvoicesSorted);
      case "pending":
        return renderInvoiceTable(pendingInvoices);
      case "orders":
        return renderInvoiceTable(allInvoicesSorted);
      case "today":
        return renderInvoiceTable(todayInvoices);
      case "monthly":
        return renderInvoiceTable(monthlyInvoices);
      case "topProducts":
        return (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Product
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Total Sold (gm)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Times Sold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {topProducts.map((p) => (
                  <tr key={p.name}>
                    <td className="px-3 py-2 font-medium">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {p.totalWeight.toFixed(2)} gm
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {p.timesSold}
                    </td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-gray-400 text-sm"
                    >
                      No sales data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:px-4 md:px-6 lg:px-4 pb-24">
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

        <button
          onClick={() => setShowFilterBar(!showFilterBar)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm transition-all duration-300 font-bold text-sm ${showFilterBar
              ? "bg-slate-800 text-white border-slate-800 shadow-md"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-brand-gold"
            }`}
        >
          <Filter size={18} />
          {showFilterBar ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Date Filter Controls */}
      {showFilterBar && (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Filter size={16} /> Filter by:
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-bold rounded-lg focus:ring-brand-gold focus:border-brand-gold block p-2 outline-none cursor-pointer hover:bg-gray-100 transition"
            >
              {[
                "All Time",
                "Today",
                "This Month",
                "This Quarter",
                "This Year",
                "Custom",
              ].map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </div>

          {dateFilter === "Custom" && (
            <div className="flex items-center gap-2 ml-2 bg-gray-50 p-1.5 px-3 rounded-lg border border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase">From:</label>
              <input
                type="date"
                value={customRange.start}
                onChange={(e) =>
                  setCustomRange({ ...customRange, start: e.target.value })
                }
                className="text-xs bg-transparent outline-none text-gray-700 font-medium"
              />
              <span className="text-gray-400">|</span>
              <label className="text-[10px] font-bold text-gray-500 uppercase">To:</label>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) =>
                  setCustomRange({ ...customRange, end: e.target.value })
                }
                className="text-xs bg-transparent outline-none text-gray-700 font-medium"
              />
            </div>
          )}
        </div>
      )}

      {/* Stats Cards (Option A) */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Total Sales */}
        <div
          className="cursor-pointer"
          onClick={() => openModal("totalSales")}
        >
          <StatCard
            title="Total Sales"
            value={formatCurrency(totalSales)}
            change=""
            changeType="positive"
            icon={<ChartIcon size={22} />}
          />
        </div>

        {/* Pending Payments */}
        <div
          className="cursor-pointer"
          onClick={() => openModal("pending")}
        >
          <StatCard
            title="Pending Payments"
            value={formatCurrency(totalPendingAmount)}
            change={
              pendingInvoices.length ? `${pendingInvoices.length} invoices` : ""
            }
            changeType="negative"
            icon={<AlertCircle size={22} />}
          />
        </div>

        {/* Total Orders */}
        <div
          className="cursor-pointer"
          onClick={() => openModal("orders")}
        >
          <StatCard
            title="Total Orders"
            value={totalOrders}
            change=""
            changeType="positive"
            icon={<ShoppingBag size={22} />}
          />
        </div>

        {/* Today Sales */}
        <div
          className="cursor-pointer"
          onClick={() => openModal("today")}
        >
          <StatCard
            title="Today Sales"
            value={formatCurrency(todaySales)}
            change={
              todayInvoices.length ? `${todayInvoices.length} invoices` : ""
            }
            changeType="positive"
            icon={<CalendarClock size={22} />}
          />
        </div>

        {/* Monthly Revenue */}
        <div
          className="cursor-pointer"
          onClick={() => openModal("monthly")}
        >
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(currentMonthRevenue)}
            change=""
            changeType="positive"
            icon={<TrendingUp size={22} />}
          />
        </div>

        {/* Top Products (summary only) */}
        <div
          className="cursor-pointer"
          onClick={() => openModal("topProducts")}
        >
          <StatCard
            title="Top Selling Products"
            value={
              topProducts.length
                ? `${topProducts[0].totalWeight.toFixed(2)} gm`
                : "No data"
            }
            change={topProducts.length ? topProducts[0].name : ""}
            changeType="positive"
            icon={<Gem size={22} />}
          />
        </div>
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
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
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

        {/* Top Selling Products (summary list) */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <Gem size={22} className="mr-2 text-brand-gold" />
            Top Selling Products
          </h3>

          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">
              No sales data available yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((product) => (
                <li
                  key={product.name}
                  className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-100 rounded-full p-2 mr-3">
                      <Gem className="text-brand-gold" size={18} />
                    </div>

                    <div>
                      <p className="font-medium text-gray-800">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total Sold: {product.totalWeight.toFixed(2)} gm
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Transactions (already invoices-based, no pagination as per option B) */}
      <div className="bg-white p-4 sm:p-6 mb-50 rounded-lg shadow-lg border border-gray-200">
        <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <ListIcon size={22} className="mr-2 text-brand-gold" />
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
              {filteredInvoices.slice(0, 6).map((tx) => (
                <tr
                  key={tx.invoiceNo || tx.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium">
                    {tx.invoiceNo || tx.id}
                  </td>

                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">
                      {tx.customer?.name || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeAgo(tx.createdAt || tx.date)}
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                    {formatCurrency(tx.grandTotal)}
                  </td>

                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {Number(tx.balanceDue || 0) === 0 ? (
                      <span className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-semibold w-max">
                        <CheckCircle size={14} className="mr-1" />
                        Paid
                      </span>
                    ) : (
                      <span className="flex items-center text-red-700 bg-red-100 px-3 py-1 rounded-full text-xs font-semibold w-max">
                        <AlertCircle size={14} className="mr-1" />
                        Due: {formatCurrency(tx.balanceDue)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-400 text-sm"
                  >
                    No invoices created yet. Create first invoice
                    from Billing page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Modal for all dashboards clicks */}
      {modalType && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {renderModalTitle()}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-red-500"
              >
                <CloseIcon size={22} />
              </button>
            </div>
            <div className="p-4 overflow-hidden">{renderModalContent()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
