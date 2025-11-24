import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Package } from "lucide-react";

const Stock = () => {
  // ---- Load / Save from localStorage ----
  const loadInitialStock = () => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("jewellery_stock");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [stockList, setStockList] = useState(loadInitialStock);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    hsnCode: "",
    huid: "",
    totalWeight: "",
  });

  // Save to localStorage whenever stockList changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("jewellery_stock", JSON.stringify(stockList));
  }, [stockList]);

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

  const filteredStock = stockList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    setCurrentItem(null);
    setFormData({
      name: "",
      hsnCode: "",
      huid: "",
      totalWeight: "",
    });
  };

  const openEditModal = (item) => {
    setIsModalOpen(true);
    setIsEditMode(true);
    setCurrentItem(item);
    setFormData({
      name: item.name || "",
      hsnCode: item.hsnCode || "",
      huid: item.huid || "",
      totalWeight: item.totalWeight || "",
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentItem(null);
  };

  const handleFormChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const weightNum = parseFloat(formData.totalWeight);
    if (isNaN(weightNum)) {
      alert("Total weight grams sahi number me daalo.");
      return;
    }

    const finalWeight = Number(weightNum.toFixed(2));

    if (isEditMode && currentItem) {
      setStockList((prev) =>
        prev.map((item) =>
          item.id === currentItem.id
            ? {
                ...item,
                name: formData.name,
                hsnCode: formData.hsnCode,
                huid: formData.huid,
                totalWeight: finalWeight,
              }
            : item
        )
      );
    } else {
      const newItem = {
        id: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
        name: formData.name,
        hsnCode: formData.hsnCode,
        huid: formData.huid,
        totalWeight: finalWeight,
      };
      setStockList((prev) => [newItem, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Ye stock item delete karna hai?")) {
      setStockList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const lowStockClass = (total) => {
    if (total <= 0) return "text-red-700 font-extrabold";
    if (total < 5) return "text-red-600 font-bold";
    if (total < 10) return "text-orange-600 font-bold";
    return "text-green-700 font-bold";
  };

  return (
    <div className="space-y-6 p-4 sm:px-4 md:px-6 lg:px-4 pb-24">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Stock Inventory
      </h2>

      {/* Search + Add */}
      <div className="flex justify-between flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by Name or SKU..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-600"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <button
          onClick={openModal}
          className="px-6 py-2 bg-yellow-700 text-white rounded-lg font-bold shadow flex items-center justify-center hover:bg-yellow-800"
        >
          <Plus size={18} className="mr-2" /> Add Stock
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white p-4 sm:p-6 rounded-lg shadow-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">HSN</th>
              <th className="px-3 py-2">HUID</th>
              <th className="px-3 py-2">Total (g)</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredStock.map((item) => (
              <tr key={item.id} className="text-center hover:bg-gray-50">
                <td className="td">{item.id}</td>
                <td className="td">{item.name}</td>
                <td className="td">{item.hsnCode}</td>
                <td className="td">{item.huid}</td>
                <td className={`td ${lowStockClass(item.totalWeight || 0)}`}>
                  {item.totalWeight <= 0
                    ? "Out of Stock"
                    : `${item.totalWeight} g`}
                </td>
                <td className="td">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStock.length === 0 && (
              <tr>
                <td className="td text-center text-gray-400" colSpan={6}>
                  No stock items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
          <div className="bg-white p-6 w-full max-w-lg rounded-lg shadow-lg">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {isEditMode ? "Edit Stock" : "Add Stock"}
              </h3>
              <X className="cursor-pointer" onClick={closeModal} />
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Name Dropdown */}
              <div>
                <label className="label">Product Name</label>
                <select
                  name="name"
                  value={formData.name}
                  required
                  className="input"
                  onChange={handleFormChange}
                >
                  <option value="">Select Jewellery Type</option>
                  {productNames.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* HSN + HUID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">HSN Code</label>
                  <input
                    placeholder="Enter HSN Code"
                    name="hsnCode"
                    className="input"
                    value={formData.hsnCode}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label className="label">HUID</label>
                  <input
                    placeholder="Enter HUID Code"
                    name="huid"
                    className="input"
                    value={formData.huid}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {/* Total Weight */}
              <div>
                <label className="label">Total Weight (g)</label>
                <input
                  placeholder="Ex: 25.50"
                  name="totalWeight"
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  value={formData.totalWeight}
                  onChange={handleFormChange}
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-yellow-700 text-white w-full rounded-lg mt-3 hover:bg-yellow-800 flex items-center justify-center"
              >
                <Package size={18} className="mr-2" />
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .td { padding: 10px; font-size: 14px; }
        .label { font-size: 14px; font-weight: 600; margin-bottom: 4px; display: block; }
        .input { width: 100%; padding: 8px; border:1px solid #d1d5db; border-radius:8px; }
      `}</style>
    </div>
  );
};

export default Stock;
