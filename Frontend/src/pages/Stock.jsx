import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Package } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // NEW FIELD: To control custom name input
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

  const filteredStock = stockList.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    if (isEditMode && currentItem) {
      await updateDoc(doc(db, "jewellery_stock", currentItem.id), {
        sku: formData.sku,
        name: finalName,
        hsnCode: formData.hsnCode,
        huid: formData.huid,
        totalWeight: finalWeight,
        stockType: formData.stockType,
      });
    } else {
      await addDoc(collection(db, "jewellery_stock"), {
        sku: formData.sku,
        name: finalName,
        hsnCode: formData.hsnCode,
        huid: formData.huid,
        totalWeight: finalWeight,
        stockType: formData.stockType,
        createdAt: new Date(),
      });
    }

    closeModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteDoc(doc(db, "jewellery_stock", id));
    }
  };

  const lowStockClass = (total) => {
    if (total <= 0) return "text-red-700 font-extrabold";
    if (total < 5) return "text-red-600 font-bold";
    if (total < 10) return "text-orange-600 font-bold";
    return "text-green-700 font-bold";
  };

  return (
    <div className="space-y-6 p-4 sm:p-4 md:px-6 lg:px-4 pb-24">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Stock Inventory</h2>

      {/* Search + Add */}
      <div className="flex justify-between flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by SKU or Name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-600"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <button
          onClick={openModal}
          className="px-6 py-2 bg-yellow-700 text-white rounded-lg font-bold shadow flex items-center justify-center hover:bg-yellow-800"
        >
          <Plus size={18} className="mr-2" /> Add Stock
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-lg">
        <table className="min-w-full text-center">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">HSN</th>
              <th className="px-3 py-2">HUID</th>
              <th className="px-3 py-2">Weight (g)</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredStock.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td>{item.sku}</td>
                <td>{item.name}</td>
                <td>{item.hsnCode}</td>
                <td>{item.huid}</td>
                <td className={lowStockClass(item.totalWeight)}>{item.totalWeight} g</td>

                <td className="flex justify-center gap-3 py-2">
                  <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredStock.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-gray-400">
                  No stock available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50">
          <div className="bg-white p-6 w-full max-w-lg rounded-lg shadow-lg">
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">{isEditMode ? "Edit Stock" : "Add Stock"}</h3>
              <X className="cursor-pointer" onClick={closeModal} />
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="SKU"
                name="sku"
                required
                className="input"
                value={formData.sku}
                onChange={handleFormChange}
              />

              {/* Dropdown + Custom Input */}
              <select
                name="name"
                required
                className="input"
                value={formData.name}
                onChange={handleFormChange}
              >
                <option value="">Select Jewellery Type</option>
                {productNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>

              {isCustomName && (
                <input
                  type="text"
                  placeholder="Enter Custom Product Name"
                  name="customName"
                  className="input"
                  value={formData.customName}
                  onChange={handleFormChange}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="HSN Code"
                  name="hsnCode"
                  className="input"
                  value={formData.hsnCode}
                  onChange={handleFormChange}
                />
                <input
                  type="text"
                  placeholder="HUID"
                  name="huid"
                  className="input"
                  value={formData.huid}
                  onChange={handleFormChange}
                />
              </div>

              <input
                type="number"
                placeholder="Total Weight (g)"
                name="totalWeight"
                required
                step="0.01"
                className="input"
                value={formData.totalWeight}
                onChange={handleFormChange}
              />

              <select
                name="stockType"
                required
                className="input"
                value={formData.stockType}
                onChange={handleFormChange}
              >
                <option value="">Select Stock Type</option>
                <option value="white">White (GST Paid)</option>
                <option value="black">Black (No GST)</option>
              </select>


              <button className="bg-yellow-700 text-white w-full py-2 rounded-lg font-bold hover:bg-yellow-800 flex justify-center">
                <Package className="mr-2" /> Save
              </button>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
        .input { width: 100%; padding: 8px; border:1px solid #d1d5db; border-radius:8px; }
      `}
      </style>
    </div>
  );
};

export default Stock;
