import React, { useState, useEffect } from "react";
import { recentTransactions, stockData, girwiData } from "../data/dummyData.jsx"; // Import all data sources
import { LineChart, Package, Database, FileX, Loader2 } from "lucide-react"; // Import icons

// Helper to format date to "YYYY-MM-DD"
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Helper to get first and last day of the current month
const getThisMonthRange = () => {
  const now = new Date();
  const firstDay = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastDay = formatDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
  );
  return { firstDay, lastDay };
};

const Reports = () => {
  const [reportType, setReportType] = useState("sales"); // 'sales', 'stock', 'girwi'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- On component load, set dates to this month and run report ---
  useEffect(() => {
    const { firstDay, lastDay } = getThisMonthRange();
    setStartDate(firstDay);
    setEndDate(lastDay);
    handleGenerateReport(firstDay, lastDay, "sales"); // Load default report
  }, []);

  // --- Main function to fetch and set report data ---
  const handleGenerateReport = async (start, end, type) => {
    setIsLoading(true);
    setReportData([]); // Clear old data
    setReportSummary(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real app, you'd query Firebase/API with (start, end, type)
    // For this demo, we'll just load the dummy data based on type

    let data = [];
    let summary = {};

    if (type === "sales") {
      data = recentTransactions;
      const totalSales = data.reduce((acc, tx) => acc + tx.amount, 0);
      summary = {
        title: "Sales Summary",
        totalSales: totalSales,
        totalOrders: data.length,
      };
    } else if (type === "stock") {
      data = stockData;
      const totalStock = data.reduce((acc, item) => acc + item.stock, 0);
      summary = {
        title: "Stock Summary",
        totalItems: data.length,
        totalStock: totalStock,
      };
    } else if (type === "girwi") {
      data = girwiData;
      const activeGirwi = data.filter((g) => g.status === "Active").length;
      summary = {
        title: "Girwi Summary",
        totalGirwi: data.length,
        activeGirwi: activeGirwi,
      };
    }

    setReportData(data);
    setReportSummary(summary);
    setIsLoading(false);
  };

  const onReportButtonClick = () => {
    setReportType(reportType); // Re-set the type to trigger report generation
    handleGenerateReport(startDate, endDate, reportType);
  };

  const onTabClick = (type) => {
    setReportType(type);
    handleGenerateReport(startDate, endDate, type);
  };

  // --- Helper to render the correct table headers ---
  const renderTableHead = () => {
    switch (reportType) {
      case "sales":
        return (
          <tr>
            <th className="th">Invoice ID</th>
            <th className="th">Customer</th>
            <th className="th">Amount</th>
            <th className="th">Status</th>
          </tr>
        );
      case "stock":
        return (
          <tr>
            <th className="th">SKU</th>
            <th className="th">Product Name</th>
            <th className="th">Category</th>
            <th className="th">Stock Qty</th>
            <th className="th">Price</th>
          </tr>
        );
      case "girwi":
        return (
          <tr>
            <th className="th">Girwi ID</th>
            <th className="th">Customer</th>
            <th className="th">Item</th>
            <th className="th">Amount</th>
            <th className="th">Date</th>
            <th className="th">Status</th>
          </tr>
        );
      default:
        return null;
    }
  };

  // --- Helper to render the correct table body ---
  const renderTableBody = () => {
    return reportData.map((item) => {
      switch (reportType) {
        case "sales":
          return (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="td font-medium">{item.id}</td>
              <td className="td">{item.customerName}</td>
              <td className="td">₹{item.amount.toLocaleString()}</td>
              <td className="td">
                <span
                  className={`status ${
                    item.status === "Paid" ? "status-green" : "status-yellow"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          );
        case "stock":
          return (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="td font-medium">{item.id}</td>
              <td className="td">{item.name}</td>
              <td className="td">{item.category}</td>
              <td className="td">{item.stock}</td>
              <td className="td">₹{item.price.toLocaleString()}</td>
            </tr>
          );
        case "girwi":
          return (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="td font-medium">{item.id}</td>
              <td className="td">{item.name}</td>
              <td className="td">
                {item.item} ({item.weight}g)
              </td>
              <td className="td">₹{item.amount.toLocaleString()}</td>
              <td className="td">{item.date}</td>
              <td className="td">
                <span
                  className={`status ${
                    item.status === "Active" ? "status-green" : "status-red"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Reports</h2>

      {/* --- Filter & Controls Card --- */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Generate Report</h3>

        {/* --- Report Type Tabs --- */}
        <div className="flex border-b mb-4">
          <TabButton
            icon={<LineChart size={18} />}
            isActive={reportType === "sales"}
            onClick={() => onTabClick("sales")}
          >
            Sales Report
          </TabButton>
          <TabButton
            icon={<Package size={18} />}
            isActive={reportType === "stock"}
            onClick={() => onTabClick("stock")}
          >
            Stock Report
          </TabButton>
          <TabButton
            icon={<Database size={18} />}
            isActive={reportType === "girwi"}
            onClick={() => onTabClick("girwi")}
          >
            Girwi Report
          </TabButton>
        </div>

        {/* --- Date Filters --- */}
        <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="flex-grow"></div>
          <button
            onClick={onReportButtonClick}
            disabled={isLoading}
            className="flex items-center justify-center self-end w-full md:w-auto px-6 py-2 bg-brand-gold text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 disabled:bg-opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </div>

      {/* --- Report Data Card --- */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin h-10 w-10 text-brand-gold" />
          </div>
        ) : reportData.length > 0 ? (
          <>
            {/* --- Summary Section --- */}
            {reportSummary && <ReportSummary summary={reportSummary} />}

            {/* --- Data Table --- */}
            <div className="overflow-x-auto mt-4">
              <style>{`
                .th { padding: 12px 16px; text-align: left; font-size: 12px; font-medium; color: #6B7280; text-transform: uppercase; }
                .td { padding: 12px 16px; white-space: nowrap; font-size: 14px; color: #374151; }
                .status { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-semibold; line-height: 1.25; }
                .status-green { background-color: #D1FAE5; color: #065F46; }
                .status-red { background-color: #FEE2E2; color: #991B1B; }
                .status-yellow { background-color: #FEF3C7; color: #92400E; }
              `}</style>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">{renderTableHead()}</thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderTableBody()}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center h-40 text-gray-500">
            <FileX size={48} />
            <p className="mt-4 text-lg font-medium">No data found</p>
            <p className="text-sm">Try adjusting your filters or date range.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper TabButton Component ---
const TabButton = ({ icon, isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2
      ${
        isActive
          ? "border-brand-gold text-brand-gold"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }
    `}
  >
    {icon}
    <span>{children}</span>
  </button>
);

// --- Helper ReportSummary Component ---
const ReportSummary = ({ summary }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
    <h4 className="text-lg font-semibold text-gray-800 mb-2">
      {summary.title}
    </h4>
    <div className="flex space-x-8">
      {summary.totalSales !== undefined && (
        <div>
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-brand-gold">
            ₹{summary.totalSales.toLocaleString()}
          </p>
        </div>
      )}
      {summary.totalOrders !== undefined && (
        <div>
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-800">
            {summary.totalOrders}
          </p>
        </div>
      )}
      {summary.totalItems !== undefined && (
        <div>
          <p className="text-sm text-gray-500">Total Unique Items</p>
          <p className="text-2xl font-bold text-gray-800">
            {summary.totalItems}
          </p>
        </div>
      )}
      {summary.totalStock !== undefined && (
        <div>
          <p className="text-sm text-gray-500">Total Stock Quantity</p>
          <p className="text-2xl font-bold text-gray-800">
            {summary.totalStock.toLocaleString()}
          </p>
        </div>
      )}
      {summary.totalGirwi !== undefined && (
        <div>
          <p className="text-sm text-gray-500">Total Girwi Deals</p>
          <p className="text-2xl font-bold text-gray-800">
            {summary.totalGirwi}
          </p>
        </div>
      )}
      {summary.activeGirwi !== undefined && (
        <div>
          <p className="text-sm text-gray-500">Active Deals</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.activeGirwi}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default Reports;
