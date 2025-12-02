import React, { useState, useEffect } from "react";
import {
  LineChart as LineChartIcon,
  Package,
  Database,
  PieChartIcon,
  Filter,
  Download,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const COLORS = ["#FFB200", "#16A34A", "#3B82F6", "#EF4444", "#8B5CF6", "#E11D48"];

// ================== Helpers ==================

const getSalesChartData = (list) => {
  const grouped = {};
  list.forEach((inv) => {
    const month = inv.date?.slice(0, 7); // yyyy-mm
    if (!month) return;
    grouped[month] = (grouped[month] || 0) + (inv.grandTotal || 0);
  });

  return Object.keys(grouped).map((m) => ({
    name: m,
    value: grouped[m],
  }));
};

const getStockChartData = (list) =>
  list.map((s, i) => ({
    name: s.name,
    value: s.totalWeight || 0,
    fill: COLORS[i % COLORS.length],
  }));

const getGirwiChartData = (list) => {
  const active = list.filter((g) => g.status === "Active").length;
  const closed = list.filter((g) => g.status === "Closed").length;
  return [
    { name: "Active", value: active, fill: "#22C55E" },
    { name: "Closed", value: closed, fill: "#EF4444" },
  ];
};

// Generic date getter per type
const getItemDateString = (item, type) => {
  if (type === "sales") return item.date || null;
  if (type === "girwi") return item.startDate || null;

  // For stock, try date/createdAt if present
  if (item.date) return item.date;
  if (item.createdAt?.seconds) {
    return new Date(item.createdAt.seconds * 1000).toISOString().slice(0, 10);
  }
  return null;
};

// Apply filters based on search + month + date range
const applyFilters = (data, type, filters) => {
  let filtered = [...data];

  // 🔎 Search (on full JSON)
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(q)
    );
  }

  // 🗓 Month (yyyy-mm)
  if (filters.month) {
    filtered = filtered.filter((item) => {
      const d = getItemDateString(item, type);
      if (!d) return false;
      return d.startsWith(filters.month);
    });
  }

  // 🗓 Date From/To
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    filtered = filtered.filter((item) => {
      const dStr = getItemDateString(item, type);
      if (!dStr) return false;
      return new Date(dStr) >= from;
    });
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    filtered = filtered.filter((item) => {
      const dStr = getItemDateString(item, type);
      if (!dStr) return false;
      return new Date(dStr) <= to;
    });
  }

  return filtered;
};

// Export mapping (simple columns, per report type)
const mapExportData = (data, type) => {
  if (type === "sales") {
    return data.map((i) => ({
      InvoiceNo: i.invoiceNo || "",
      Customer: i.customer?.name || "",
      Date: i.date || "",
      GrandTotal: i.grandTotal || 0,
      Received: i.receivedAmount || 0,
      BalanceDue: i.balanceDue || 0,
      PaymentMode: i.paymentMode || "",
    }));
  }

  if (type === "stock") {
    return data.map((i) => ({
      SKU: i.sku || "",
      Name: i.name || "",
      HSN: i.hsnCode || "",
      HUID: i.huid || "",
      TotalWeight: i.totalWeight || 0,
    }));
  }

  // girwi
  return data.map((i) => ({
    GirviNumber: i.girviNumber || "",
    Customer: i.customerName || i.customer?.name || "",
    Weight: i.weight || 0,
    StartDate: i.startDate || "",
    Status: i.status || "",
  }));
};

// ================== Component ==================

const Reports = () => {
  const [reportType, setReportType] = useState("sales");
  const [sales, setSales] = useState([]);
  const [stock, setStock] = useState([]);
  const [girwi, setGirwi] = useState([]);

  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [reportData, setReportData] = useState([]);

  const [filters, setFilters] = useState({
    month: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  const [showFilters, setShowFilters] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🔥 LIVE Firebase Sync
  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, "invoices"), (snap) => {
      setSales(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStock = onSnapshot(collection(db, "jewellery_stock"), (snap) => {
      setStock(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubGirwi = onSnapshot(collection(db, "girvi_records"), (snap) => {
      setGirwi(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubInvoices();
      unsubStock();
      unsubGirwi();
    };
  }, []);

  // 🧠 Auto Refresh Data Based on Tab + Filters
  useEffect(() => {
    let base = [];
    if (reportType === "sales") base = sales;
    if (reportType === "stock") base = stock;
    if (reportType === "girwi") base = girwi;

    const filtered = applyFilters(base, reportType, filters);

    setReportData(filtered);
    setCurrentPage(1); // reset page when filters/type change

    if (reportType === "sales") {
      setSummary({
        count: filtered.length,
        total: filtered.reduce((t, i) => t + (i.grandTotal || 0), 0),
      });
      setChartData(getSalesChartData(filtered));
    }

    if (reportType === "stock") {
      setSummary({
        count: filtered.length,
        total: filtered.reduce((t, s) => t + (s.totalWeight || 0), 0),
      });
      setChartData(getStockChartData(filtered));
    }

    if (reportType === "girwi") {
      setSummary({
        count: filtered.length,
        active: filtered.filter((g) => g.status === "Active").length,
      });
      setChartData(getGirwiChartData(filtered));
    }
  }, [reportType, sales, stock, girwi, filters]);

  // Pagination derived data
  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const paginatedData = reportData.slice(firstIndex, lastIndex);
  const totalPages = Math.max(1, Math.ceil(reportData.length / itemsPerPage));

  // Excel Export
  const exportExcel = () => {
    if (!reportData.length) {
      alert("No data to export!");
      return;
    }

    const exportRows = mapExportData(reportData, reportType);
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${reportType.toUpperCase()} REPORT`);

    const filename = `${reportType}_report_${new Date()
      .toISOString()
      .split("T")[0]}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(blob, filename);
  };

  const handleTabChange = (type) => {
    setReportType(type);
    setCurrentPage(1);
    // filters keep same — good for cross comparison
  };

  return (
    <div className="space-y-6 p-4 sm:px-4 md:px-6 lg:px-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Reports & Analytics</h2>
          <p className="text-gray-500 text-sm">
            Track sales, stock and girwi performance with filters & exports.
          </p>
        </div>

        <button
          onClick={() => setShowFilters((p) => !p)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
        >
          <Filter size={16} />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-scroll flex gap-4 sm:gap-6 w-full whitespace-nowrap">
        {[
          { id: "sales", label: "Sales", icon: LineChartIcon },
          { id: "stock", label: "Stock", icon: Package },
          { id: "girwi", label: "Girwi", icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
              reportType === tab.id
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-lg shadow border w-full">
          {/* Search */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-semibold mb-1">
              Search
            </span>
            <input
              type="text"
              placeholder="Search anything..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="border px-2 py-1 rounded-md text-sm"
            />
          </div>

          {/* Month Filter */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-semibold mb-1">
              Month
            </span>
            <input
              type="month"
              value={filters.month}
              onChange={(e) =>
                setFilters((f) => ({ ...f, month: e.target.value }))
              }
              className="border px-2 py-1 rounded-md text-sm"
            />
          </div>

          {/* Date From */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-semibold mb-1">
              Date From
            </span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
              className="border px-2 py-1 rounded-md text-sm"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-semibold mb-1">
              Date To
            </span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
              className="border px-2 py-1 rounded-md text-sm"
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  month: "",
                  dateFrom: "",
                  dateTo: "",
                  search: "",
                })
              }
              className="px-3 py-2 bg-red-500 text-white rounded-md text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid grid grid-cols-3 gap-4 w-full">
        <div className="p-4 bg-white rounded-lg shadow border">
          <p className="text-gray-600 text-sm">Total Count</p>
          <h3 className="text-2xl font-bold">
            {summary.count ?? 0}
          </h3>
        </div>

        {reportType === "sales" && (
          <div className="p-4 bg-white rounded-lg shadow border">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <h3 className="text-2xl font-bold text-green-600">
              ₹{(summary.total || 0).toLocaleString("en-IN")}
            </h3>
          </div>
        )}

        {reportType === "stock" && (
          <div className="p-4 bg-white rounded-lg shadow border">
            <p className="text-gray-600 text-sm">Total Weight</p>
            <h3 className="text-2xl font-bold text-blue-600">
              {summary.total || 0} g
            </h3>
          </div>
        )}

        {reportType === "girwi" && (
          <div className="p-4 bg-white rounded-lg shadow border">
            <p className="text-gray-600 text-sm">Active Policies</p>
            <h3 className="text-2xl font-bold text-red-600">
              {summary.active || 0}
            </h3>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="chart-box bg-white p-4 rounded-lg shadow border flex flex-col items-center h-[340px] sm:h-[400px]">
        <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
          <PieChartIcon size={18} /> Insights
        </h4>

        {reportType === "sales" ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#D97706" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="value"
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={110}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.fill || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table + Export */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex justify-between items-center px-3 pt-3">
          <p className="text-sm text-gray-500">
            Showing {paginatedData.length} of {reportData.length} records
          </p>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm mb-1"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
              <tr>
                {reportType === "sales" && (
                  <>
                    <th className="th">Invoice</th>
                    <th className="th">Customer</th>
                    <th className="th">Date</th>
                    <th className="th">Total</th>
                  </>
                )}
                {reportType === "stock" && (
                  <>
                    <th className="th">SKU</th>
                    <th className="th">Name</th>
                    <th className="th">HSN</th>
                    <th className="th">HUID</th>
                    <th className="th">Weight</th>
                  </>
                )}
                {reportType === "girwi" && (
                  <>
                    <th className="th">Girvi No.</th>
                    <th className="th">Weight</th>
                    <th className="th">Date</th>
                    <th className="th">Status</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((i, index) => (
                <tr
                  key={index}
                  className="border-b text-center hover:bg-gray-50"
                >
                  {reportType === "sales" && (
                    <>
                      <td>{i.invoiceNo}</td>
                      <td>{i.customer?.name}</td>
                      <td>{i.date}</td>
                      <td className="font-bold text-green-700">
                        ₹{(i.grandTotal || 0).toLocaleString("en-IN")}
                      </td>
                    </>
                  )}

                  {reportType === "stock" && (
                    <>
                      <td>{i.sku}</td>
                      <td>{i.name}</td>
                      <td>{i.hsnCode}</td>
                      <td>{i.huid}</td>
                      <td className="font-bold">
                        {(i.totalWeight || 0) + " g"}
                      </td>
                    </>
                  )}

                  {reportType === "girwi" && (
                    <>
                      <td>{i.girviNumber}</td>
                      <td>{(i.weight || 0) + " g"}</td>
                      <td>{i.startDate}</td>
                      <td
                        className={
                          i.status === "Active"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {i.status}
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-gray-400 py-6 text-sm"
                  >
                    No records found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-3 text-sm">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .th { 
          padding: 10px; 
          font-weight: 600; 
          white-space: nowrap;
        }

        /* 📱 Mobile First Responsive */
        .summary-grid {
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        .chart-box {
          width: 100%;
          height: auto;
          min-height: 240px;
        }

        table th, table td {
          padding: 6px !important;
          font-size: 13px;
          white-space: nowrap;
        }

        .tab-scroll {
          overflow-x: auto;
          display: flex;
          gap: 10px;
          scrollbar-width: thin;
        }

        /* Tablet Screens */
        @media (min-width: 600px) {
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .chart-box {
            min-height: 300px;
          }
        }

        /* Laptop Size */
        @media (min-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .chart-box {
            min-height: 360px;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
