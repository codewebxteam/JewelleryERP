import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Package,
  Filter,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const Stock = () => {
  const [stockList, setStockList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All"); // All, White, Black
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Control custom name input
  const [isCustomName, setIsCustomName] = useState(false);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    customName: "",
    hsnCode: "",
    huid: "",
    totalWeight: "",
    stockType: "",
  });

  const productNames = [
    "Gold Ring",
    "Silver Ring",
    "Gold Chain",
    "Gold Bangles",
    "Pendant",
    "Earrings",
    "Nose Pin",
    "Bracelet",
    "Coin",
    "Other",
  ];

  // Firestore Listener
  useEffect(() => {
    const ref = collection(db, "jewellery_stock");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setStockList(data);
    });
    return () => unsubscribe();
  }, []);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const totalItems = stockList.length;
    const totalWeight = stockList.reduce(
      (acc, item) => acc + (Number(item.totalWeight) || 0),
      0
    );
    const whiteStock = stockList.filter((i) => i.stockType === "white").length;
    const blackStock = stockList.filter((i) => i.stockType === "black").length;
    return { totalItems, totalWeight, whiteStock, blackStock };
  }, [stockList]);

  // --- FILTERING ---
  const filteredStock = stockList.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "All" ||
      (filterType === "White" && item.stockType === "white") ||
      (filterType === "Black" && item.stockType === "black");

    return matchesSearch && matchesType;
  });

  // Modal Handlers
  const openModal = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    setIsCustomName(false);
    setCurrentItem(null);
    setFormData({
      sku: "",
      name: "",
      customName: "",
      hsnCode: "",
      huid: "",
      totalWeight: "",
      stockType: "",
    });
  };

  const openEditModal = (item) => {
    setIsModalOpen(true);
    setIsEditMode(true);
    const isCustom = !productNames.includes(item.name);
    setIsCustomName(isCustom);
    setCurrentItem(item);
    setFormData({
      sku: item.sku || "",
      name: isCustom ? "Other" : item.name,
      customName: isCustom ? item.name : "",
      hsnCode: item.hsnCode || "",
      huid: item.huid || "",
      totalWeight: item.totalWeight || "",
      stockType: item.stockType || "",
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsCustomName(false);
    setCurrentItem(null);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "name") {
      setIsCustomName(e.target.value === "Other");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sku.trim()) {
      alert("SKU is required!");
      return;
    }

    const finalName = isCustomName ? formData.customName.trim() : formData.name;
    if (!finalName) {
      alert("Product name required!");
      return;
    }

    const weightNum = Number(formData.totalWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert("Weight must be a number greater than 0.");
      return;
    }

    const finalWeight = Number(weightNum.toFixed(2));
    const payload = {
      sku: formData.sku,
      name: finalName,
      hsnCode: formData.hsnCode,
      huid: formData.huid,
      totalWeight: finalWeight,
      stockType: formData.stockType,
    };

    try {
      if (isEditMode && currentItem) {
        await updateDoc(doc(db, "jewellery_stock", currentItem.id), payload);
      } else {
        await addDoc(collection(db, "jewellery_stock"), {
          ...payload,
          createdAt: new Date(),
        });
      }
      closeModal();
    } catch (error) {
      console.error("Error saving stock:", error);
      alert("Failed to save stock.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteDoc(doc(db, "jewellery_stock", id));
    }
  };

  return (
    <div className="space-y-6 p-4 sm:px-6 lg:px-8 pb-24 max-w-[1600px] mx-auto">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Inventory Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your gold, silver, and other assets efficiently.
          </p>
        </div>
        <button
          onClick={openModal}
          className="group flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus
            size={20}
            className="group-hover:rotate-90 transition-transform"
          />
          Add New Stock
        </button>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Weight */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total Net Weight
            </p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-1">
              {stats.totalWeight.toFixed(2)}{" "}
              <span className="text-lg text-gray-400">g</span>
            </h3>
          </div>
          <div className="p-3 bg-yellow-50 rounded-full text-yellow-600 relative z-10">
            <Package size={28} />
          </div>
          {/* Decorative Circle */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
        </div>

        {/* Stock Distribution */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Stock Distribution
            </p>
            <div className="flex gap-4 mt-2">
              <div>
                <span className="text-2xl font-bold text-green-600">
                  {stats.whiteStock}
                </span>
                <p className="text-[10px] text-gray-400 font-semibold">
                  WHITE (GST)
                </p>
              </div>
              <div className="w-px bg-gray-200 h-8"></div>
              <div>
                <span className="text-2xl font-bold text-gray-700">
                  {stats.blackStock}
                </span>
                <p className="text-[10px] text-gray-400 font-semibold">
                  BLACK (NO-GST)
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* Total Items */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total Items
            </p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-1">
              {stats.totalItems}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <AlertCircle size={28} />
          </div>
        </div>
      </div>

      {/* --- FILTERS & SEARCH --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by SKU or Product Name..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-yellow-400 rounded-xl transition-all outline-none text-sm font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-sm font-bold text-gray-500 flex items-center gap-1 mr-2">
            <Filter size={16} /> Filters:
          </span>
          {["All", "White", "Black"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filterType === type
                  ? "bg-gray-800 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Product Info
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  HSN / HUID
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Weight
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredStock.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-yellow-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">
                      {item.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{item.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>HSN: {item.hsnCode || "-"}</span>
                      <span className="text-xs text-gray-400">
                        HUID: {item.huid || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.stockType === "white" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        White
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                        Black
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`text-sm font-bold ${
                        Number(item.totalWeight) < 5
                          ? "text-red-600"
                          : "text-gray-800"
                      }`}
                    >
                      {item.totalWeight} g
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="Edit Item"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Package size={48} className="mb-3 opacity-20" />
                      <p className="text-lg font-medium">No stock found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {isEditMode ? "Edit Item Details" : "Add New Stock"}
                </h3>
                <p className="text-xs text-gray-500">
                  Enter product information below
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-red-500 transition-colors bg-white p-1 rounded-full shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="label">
                    SKU ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    className="input-field font-mono"
                    placeholder="e.g. RNG-001"
                    value={formData.sku}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-span-1">
                  <label className="label">
                    Stock Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="stockType"
                    required
                    className="input-field"
                    value={formData.stockType}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Type</option>
                    <option value="white">White (GST)</option>
                    <option value="black">Black (No GST)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="name"
                  required
                  className="input-field mb-2"
                  value={formData.name}
                  onChange={handleFormChange}
                >
                  <option value="">Select Category</option>
                  {productNames.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
                {isCustomName && (
                  <input
                    type="text"
                    placeholder="Enter Custom Name"
                    name="customName"
                    className="input-field bg-yellow-50 border-yellow-200 focus:border-yellow-400"
                    value={formData.customName}
                    onChange={handleFormChange}
                    autoFocus
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">HSN Code</label>
                  <input
                    type="text"
                    name="hsnCode"
                    className="input-field"
                    value={formData.hsnCode}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label className="label">HUID</label>
                  <input
                    type="text"
                    name="huid"
                    className="input-field"
                    value={formData.huid}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Net Weight (g) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="totalWeight"
                    required
                    step="0.01"
                    className="input-field pr-8 text-lg font-bold text-gray-700"
                    value={formData.totalWeight}
                    onChange={handleFormChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                    g
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold hover:bg-yellow-700 shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  <Package size={20} />
                  {isEditMode ? "Update Stock" : "Save to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STYLES --- */}
      <style>{`
        .input-field {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s;
          background: #fff;
          font-size: 0.95rem;
          color: #374151;
        }
        .input-field:focus {
          border-color: #ca8a04;
          box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1);
        }
        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 6px;
          letter-spacing: 0.025em;
        }
      `}</style>
    </div>
  );
};

export default Stock;
