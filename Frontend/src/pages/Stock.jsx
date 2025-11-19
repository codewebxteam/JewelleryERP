import React, { useState } from "react";
import { stockData } from "../data/dummyData.jsx"; // Import dummy data
import { Plus, Search, Edit, Trash2, X, Package } from "lucide-react"; // Import icons

const Stock = () => {
  // --- State for the list, search, and modal ---
  const [stockList, setStockList] = useState(stockData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // Used for editing
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    weight: "",
    stock: "",
    price: "",
  });

  // --- Filter Logic ---
  const filteredStock = stockList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Modal & Form Handling ---
  const openModal = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    setFormData({ name: "", category: "", weight: "", stock: "", price: "" }); // Reset form
  };

  const openEditModal = (item) => {
    setIsModalOpen(true);
    setIsEditMode(true);
    setCurrentItem(item); // Set the item to be edited
    setFormData(item); // Pre-fill the form
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setIsEditMode(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isEditMode) {
      // --- Update Logic (for state) ---
      // TODO: Add Firebase updateDoc() here
      setStockList((prevList) =>
        prevList.map((item) =>
          item.id === currentItem.id ? { ...item, ...formData } : item
        )
      );
      console.log("Updated item:", currentItem.id);
    } else {
      // --- Add New Logic (for state) ---
      // TODO: Add Firebase addDoc() here
      const newItem = {
        id: `SKU-${Math.floor(Math.random() * 1000)}`, // Temporary ID
        ...formData,
        weight: parseFloat(formData.weight),
        stock: parseInt(formData.stock, 10),
        price: parseFloat(formData.price),
      };
      setStockList((prevList) => [newItem, ...prevList]);
      console.log("Added new item:", newItem);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    // --- Delete Logic (for state) ---
    // TODO: Add Firebase deleteDoc() here
    if (window.confirm("Are you sure you want to delete this item?")) {
      setStockList((prevList) => prevList.filter((item) => item.id !== id));
      console.log("Deleted item:", id);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Stock Inventory</h2>

      {/* --- Search and Add Button --- */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by Product Name or SKU..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
        <button
          onClick={openModal}
          className="flex items-center px-6 py-2 bg-brand-gold text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add New Stock Item
        </button>
      </div>

      {/* --- Stock Data Table --- */}
      <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="th">SKU</th>
              <th className="th">Product Name</th>
              <th className="th">Category</th>
              <th className="th">Weight (g)</th>
              <th className="th">Stock Qty</th>
              <th className="th">Price</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStock.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="td font-medium">{item.id}</td>
                <td className="td">{item.name}</td>
                <td className="td">{item.category}</td>
                <td className="td">{item.weight}</td>
                <td className="td">{item.stock}</td>
                <td className="td">₹{item.price.toLocaleString()}</td>
                <td className="td">
                  {/* --- Action Buttons --- */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {isEditMode ? "Edit Stock Item" : "Add New Stock Item"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="label">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                  className="input"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Weight (g)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleFormChange}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Stock Qty</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleFormChange}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    required
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-brand-gold text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90"
                >
                  <Package size={18} className="mr-2" />
                  {isEditMode ? "Save Changes" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Reusable styles for this component --- */}
      <style>{`
        .th { padding: 12px 16px; text-align: left; font-size: 12px; font-medium; color: #6B7280; text-transform: uppercase; }
        .td { padding: 12px 16px; white-space: nowrap; font-size: 14px; color: #374151; }
        .label { display: block; margin-bottom: 4px; font-size: 14px; font-medium; color: #374151; }
        .input { margin-top: 4px; display: block; width: 100%; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
};

export default Stock;
