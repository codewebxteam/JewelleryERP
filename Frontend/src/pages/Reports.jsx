import React, { useState, useMemo, useEffect } from "react";
import { LineChart, Package, Database, Calendar, PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

// Colors
const COLORS = ["#FFB200", "#16A34A", "#3B82F6", "#EF4444", "#8B5CF6", "#E11D48"];

// Load Data from LocalStorage
const loadLocal = (key) => JSON.parse(localStorage.getItem(key) || "[]");

// Charts Data Builders
const getSalesChartData = (list) => {
  const grouped = {};
  list.forEach(inv => {
    const month = inv.date?.slice(0, 7);
    if (!month) return;
    grouped[month] = (grouped[month] || 0) + inv.grandTotal;
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
    { name: "Closed", value: closed, fill: "#EF4444" }
  ];
};

const Reports = () => {
  const [reportType, setReportType] = useState("sales");
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});

  const loadReport = () => {
    let sales = loadLocal("invoices");
    let stock = loadLocal("jewellery_stock");
    let girwi = JSON.parse(localStorage.getItem("girvi_records") || "[]");

    if (reportType === "sales") {
      setReportData(sales);
      setSummary({
        title: "Sales Analytics",
        total: sales.reduce((t, i) => t + (i.grandTotal || 0), 0),
        count: sales.length,
      });
    } else if (reportType === "stock") {
      setReportData(stock);
      setSummary({
        title: "Stock Analytics",
        total: stock.reduce((t, s) => t + (s.totalWeight || 0), 0),
        count: stock.length,
      });
    } else {
      setReportData(girwi);
      setSummary({
        title: "Girwi Analytics",
        total: girwi.length,
        active: girwi.filter((g) => g.status === "Active").length,
      });
    }
  };

  useEffect(() => loadReport(), [reportType]);

  const chartData =
    reportType === "sales"
      ? getSalesChartData(reportData)
      : reportType === "stock"
        ? getStockChartData(reportData)
        : getGirwiChartData(reportData);

  return (
    <div className="space-y-6 p-4 sm:px-4 md:px-6 lg:px-4 pb-24">
      {/* Header */}
      <h2 className="text-3xl font-bold">Business Dashboard</h2>

      {/* Tabs */}
      <div className="tab-scroll flex gap-4 sm:gap-6 w-full whitespace-nowrap">
        {[
          { id: "sales", label: "Sales", icon: LineChart },
          { id: "stock", label: "Stock", icon: Package },
          { id: "girwi", label: "Girwi", icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${reportType === tab.id ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="summary-grid grid grid-cols-3 gap-4 w-full">
        <div className="p-4 bg-white rounded-lg shadow border">
          <p className="text-gray-600 text-sm">Total Count</p>
          <h3 className="text-2xl font-bold">{summary.count || summary.total || 0}</h3>
        </div>

        {reportType === "sales" && (
          <div className="p-4 bg-white rounded-lg shadow border">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <h3 className="text-2xl font-bold text-green-600">
              ₹{summary.total?.toLocaleString("en-IN")}
            </h3>
          </div>
        )}

        {reportType === "stock" && (
          <div className="p-4 bg-white rounded-lg shadow border">
            <p className="text-gray-600 text-sm">Total Weight</p>
            <h3 className="text-2xl font-bold text-blue-600">{summary.total} g</h3>
          </div>
        )}

        {reportType === "girwi" && (
          <div className="p-4 bg-white rounded-lg shadow border">
            <p className="text-gray-600 text-sm">Active Policies</p>
            <h3 className="text-2xl font-bold text-red-600">{summary.active}</h3>
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
              <Pie dataKey="value" data={chartData} cx="50%" cy="50%" outerRadius={110}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg ">
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
                  <th className="th">#</th>
                  <th className="th">Customer</th>
                  <th className="th">Item</th>
                  <th className="th">Weight</th>
                  <th className="th">Date</th>
                  <th className="th">Status</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {reportData.map((i, index) => (
              <tr key={index} className="border-b text-center hover:bg-gray-50">
                {reportType === "sales" && (
                  <>
                    <td>{i.id}</td>
                    <td>{i.customer?.name}</td>
                    <td>{i.date}</td>
                    <td className="font-bold text-green-700">
                      ₹{i.grandTotal?.toLocaleString()}
                    </td>
                  </>
                )}

                {reportType === "stock" && (
                  <>
                    <td>{i.id}</td>
                    <td>{i.name}</td>
                    <td>{i.hsnCode}</td>
                    <td>{i.huid}</td>
                    <td className="font-bold">{i.totalWeight} g</td>
                  </>
                )}

                {reportType === "girwi" && (
                  <>
                    <td>{i.girviNumber}</td>
                    <td>{i.customerName}</td>
                    <td>{i.itemName}</td>
                    <td>{i.weight} g</td>
                    <td>{i.startDate}</td>
                    <td className={i.status === "Active" ? "text-green-600" : "text-red-600"}>
                      {i.status}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
