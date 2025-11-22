import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie,Cell,Tooltip,Legend,ResponsiveContainer,} from "recharts";
import { LineChart, Package, Database, FileX, Loader2, PieChart as PieChartIcon } from "lucide-react";

const recentTransactions = [
  { id: 'INV001', customerName: 'Ravi Sharma', amount: 15000, status: 'Paid', date: '2025-11-15' },
  { id: 'INV002', customerName: 'Priya Verma', amount: 4500, status: 'Paid', date: '2025-11-16' },
  { id: 'INV003', customerName: 'Amit Singh', amount: 8000, status: 'Pending', date: '2025-11-17' },
  { id: 'INV004', customerName: 'Neha Gupta', amount: 2200, status: 'Paid', date: '2025-11-18' },
  { id: 'INV005', customerName: 'Rajesh Patil', amount: 9500, status: 'Pending', date: '2025-11-19' },
  { id: 'INV006', customerName: 'Kirti Rao', amount: 35000, status: 'Paid', date: '2025-11-20' },
  { id: 'INV007', customerName: 'Gaurav Jain', amount: 1200, status: 'Paid', date: '2025-11-21' },
];

const stockData = [
  { id: 'SKU1001', name: 'Gold Necklace 22k', category: 'Necklace', stock: 15, price: 95000 },
  { id: 'SKU1002', name: 'Diamond Ring 18k', category: 'Ring', stock: 8, price: 45000 },
  { id: 'SKU1003', name: 'Silver Anklet', category: 'Anklet', stock: 55, price: 2500 },
  { id: 'SKU1004', name: 'Platinum Bracelet', category: 'Bracelet', stock: 3, price: 120000 },
  { id: 'SKU1005', name: 'Gold Earrings 14k', category: 'Earrings', stock: 22, price: 18000 },
];

const girwiData = [
  { id: 'GIR001', name: 'Sunita Devi', item: 'Gold Chain', weight: 12.5, amount: 40000, date: '2025-10-01', status: 'Active' },
  { id: 'GIR002', name: 'Ajay Kumar', item: 'Silver Coins', weight: 500, amount: 8000, date: '2025-09-10', status: 'Active' },
  { id: 'GIR003', name: 'Deepika M', item: 'Diamond Pendant', weight: 5.2, amount: 150000, date: '2025-11-05', status: 'Closed' },
  { id: 'GIR004', name: 'Vikas Rathi', item: 'Gold Bangles', weight: 25.0, amount: 85000, date: '2025-11-10', status: 'Active' },
];

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];

const formatDate = (date) => date.toISOString().split("T")[0];

const getThisMonthRange = () => {
  const now = new Date();
  const firstDay = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastDay = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { firstDay, lastDay };
};

const getChartData = (type, data) => {
  const aggregation = {};

  if (type === "sales") {
    data.forEach(item => {
      const status = item.status;
      aggregation[status] = (aggregation[status] || 0) + 1;
    });
    return Object.keys(aggregation).map((key, index) => ({
      name: `${key} Orders`,
      value: aggregation[key],
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  } else if (type === "stock") {
    data.forEach(item => {
      const category = item.category;
      aggregation[category] = (aggregation[category] || 0) + item.stock;
    });
    return Object.keys(aggregation).map((key, index) => ({
      name: `${key} Stock`,
      value: aggregation[key],
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  } else if (type === "girwi") {
    data.forEach(item => {
      const status = item.status;
      aggregation[status] = (aggregation[status] || 0) + 1;
    });
    return Object.keys(aggregation).map((key, index) => ({
      name: `${key} Girwi Deals`,
      value: aggregation[key],
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }

  return [];
};

const ReportPieChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px] text-gray-500 border border-dashed rounded-lg p-4">
        No measurable data to display.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-2 bg-white border border-gray-300 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-gray-800">{item.name}</p>
          <p className="text-gray-600">Value: <span className="font-bold">{item.value.toLocaleString()}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full min-h-[350px] flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
      <h4 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <PieChartIcon className="h-5 w-5 mr-2 text-brand-gold" />
        {title} Breakdown
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ marginTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const TabButton = ({ icon, isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm transition duration-150 ease-in-out border-b-2 ${isActive ? "border-brand-gold text-brand-gold"  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"  }`}>
    {icon}
    <span>{children}</span>
  </button>
);

const SummaryItem = ({ label, value, color }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
  </div>
);

const ReportSummary = ({ summary }) => (
  <div className="bg-white p-6 rounded-xl shadow-xl border-l-4 border-brand-gold h-full">
    <h4 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{summary.title}</h4>
    <div className="space-y-4">
      {summary.totalSales !== undefined && <SummaryItem label="Total Sales Value" value={`₹${summary.totalSales.toLocaleString()}`} color="text-brand-gold" />}
      {summary.totalOrders !== undefined && <SummaryItem label="Total Orders Count" value={summary.totalOrders} color="text-indigo-600" />}
      {summary.totalItems !== undefined && <SummaryItem label="Total Unique Items" value={summary.totalItems} color="text-blue-600" />}
      {summary.totalStock !== undefined && <SummaryItem label="Total Stock Quantity" value={summary.totalStock.toLocaleString()} color="text-blue-600" />}
      {summary.totalGirwi !== undefined && <SummaryItem label="Total Girwi Deals" value={summary.totalGirwi} color="text-purple-600" />}
      {summary.activeGirwi !== undefined && <SummaryItem label="Active Girwi Deals" value={summary.activeGirwi} color="text-green-600" />}
    </div>
  </div>
);

// --- Main App ---
const App = () => {
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const chartData = useMemo(() => getChartData(reportType, reportData), [reportType, reportData]);

  const handleGenerateReport = useCallback(async (start, end, type) => {
    setIsLoading(true);
    setReportData([]);
    setReportSummary(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    let data = [];
    let summary = {};

    if (type === "sales") {
      data = recentTransactions;
      const totalSales = data.reduce((acc, tx) => acc + tx.amount, 0);
      summary = {
        title: "Sales Summary",
        totalSales,
        totalOrders: data.length,
      };
    } else if (type === "stock") {
      data = stockData;
      const totalStock = data.reduce((acc, item) => acc + item.stock, 0);
      summary = {
        title: "Stock Summary",
        totalItems: data.length,
        totalStock,
      };
    } else if (type === "girwi") {
      data = girwiData;
      const activeGirwi = data.filter((g) => g.status === "Active").length;
      summary = {
        title: "Girwi Summary",
        totalGirwi: data.length,
        activeGirwi,
      };
    }

    setReportData(data);
    setReportSummary(summary);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const { firstDay, lastDay } = getThisMonthRange();
    setStartDate(firstDay);
    setEndDate(lastDay);
    handleGenerateReport(firstDay, lastDay, "sales");
  }, [handleGenerateReport]);

  const onReportButtonClick = () => handleGenerateReport(startDate, endDate, reportType);
  const onTabClick = (type) => { setReportType(type); handleGenerateReport(startDate, endDate, type); };

  const renderTableHead = () => {
    switch (reportType) {
      case "sales": return <tr><th className="th">Invoice ID</th><th className="th">Customer</th><th className="th">Amount</th><th className="th">Status</th></tr>;
      case "stock": return <tr><th className="th">SKU</th><th className="th">Product Name</th><th className="th">Category</th><th className="th">Stock Qty</th><th className="th">Price</th></tr>;
      case "girwi": return <tr><th className="th">Girwi ID</th><th className="th">Customer</th><th className="th">Item</th><th className="th">Amount</th><th className="th">Date</th><th className="th">Status</th></tr>;
      default: return null;
    }
  };

  const renderTableBody = () => reportData.map(item => {
    switch (reportType) {
      case "sales":
        return (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="td font-medium">{item.id}</td>
            <td className="td">{item.customerName}</td>
            <td className="td">₹{item.amount.toLocaleString()}</td>
            <td className="td"><span className={`status ${item.status === "Paid" ? "status-green" : "status-yellow"}`}>{item.status}</span></td>
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
            <td className="td">{item.item} ({item.weight}g)</td>
            <td className="td">₹{item.amount.toLocaleString()}</td>
            <td className="td">{item.date}</td>
            <td className="td"><span className={`status ${item.status === "Active" ? "status-green" : "status-red"}`}>{item.status}</span></td>
          </tr>
        );
      default: return null;
    }
  });

  return (
    <div className="space-y-6 p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <style jsx global>{`
        .font-sans { font-family: 'Inter', sans-serif; }
        .th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #4B5563; text-transform: uppercase; border-bottom: 2px solid #E5E7EB; }
        .td { padding: 8px 16px; white-space: nowrap; font-size: 14px; color: #374151; }
        .status { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; line-height: 1.25; display: inline-block; }
        .status-green { background-color: #D1FAE5; color: #065F46; }
        .status-red { background-color: #FEE2E2; color: #991B1B; }
        .status-yellow { background-color: #FEF3C7; color: #92400E; }
      `}</style>

      <h2 className="text-3xl font-extrabold text-gray-900">Business Reports Dashboard</h2>

      <div className="bg-white p-6 rounded-xl shadow-xl">
        <h3 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800">Report Settings</h3>


        <div className=" text-brand-gold{color:#EAB308} flex overflow-x-auto whitespace-nowrap border-b mb-4" >
          <TabButton icon={<LineChart size={18} />} isActive={reportType === "sales"} onClick={() => onTabClick("sales")}>Sales Report</TabButton>
          <TabButton icon={<Package size={18} />} isActive={reportType === "stock"} onClick={() => onTabClick("stock")}>Stock Report</TabButton>
          <TabButton icon={<Database size={18} />} isActive={reportType === "girwi"} onClick={() => onTabClick("girwi")}>Girwi Report</TabButton>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-gold"/>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-gold"/>
          </div>
          <button onClick={onReportButtonClick} className="px-6 py-3 bg-brand-gold text-white-600 font-bold rounded-lg shadow-md hover:bg-yellow-600 transition mt-2 md:mt-0">Generate Report</button>
        </div>
      </div>

      {reportSummary && <ReportSummary summary={reportSummary} />}

      <ReportPieChart data={chartData} title={reportSummary?.title || ""} />

      <div className="overflow-x-auto bg-white rounded-xl shadow-xl border mt-6">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-gray-50">
            {renderTableHead()}
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" className="text-center py-10 text-gray-400">Loading data...</td></tr>
            ) : (
              renderTableBody()
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
