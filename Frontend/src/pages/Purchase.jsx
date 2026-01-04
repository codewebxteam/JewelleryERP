import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  ShoppingBag,
  Truck,
  Calendar,
  IndianRupee,
  PackageCheck,
  Eye,
  Menu,
} from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  where,
  getDocs,
} from "firebase/firestore";

// --- Currency Helper ---
const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false); // For Add Purchase
  const [selectedPurchase, setSelectedPurchase] = useState(null); // For View Details

  const [loading, setLoading] = useState(false);

  // --- Form State ---
  const [supplier, setSupplier] = useState({
    name: "",
    gstin: "",
    contact: "",
    address: "",
  });

  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Items in current bill
  const [items, setItems] = useState([]);

  // Current Input Item
  const [currentItem, setCurrentItem] = useState({
    name: "",
    category: "Silver",
    purity: "",
    hsn: "",
    weight: "",
    unit: "g",
    rate: "",
    tax: 3,
  });

  // --- Load Purchases ---
  useEffect(() => {
    const q = query(collection(db, "purchases"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPurchases(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // --- Calculations ---
  const calculateItemTotal = (item) => {
    const weight = Number(item.weight);
    const rate = Number(item.rate);
    const baseAmount = weight * rate;
    const taxAmount = (baseAmount * Number(item.tax)) / 100;
    return baseAmount + taxAmount;
  };

  const grandTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.total, 0);
  }, [items]);

  // --- Handlers ---
  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.weight || !currentItem.rate) {
      alert("Please fill Item Name, Weight, and Rate.");
      return;
    }

    const total = calculateItemTotal(currentItem);
    const newItem = { ...currentItem, total, id: Date.now() };

    setItems([...items, newItem]);

    // Reset Item Fields
    setCurrentItem({
      ...currentItem,
      name: "",
      weight: "",
      rate: "",
      purity: "",
      hsn: "",
    });
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleSavePurchase = async () => {
    if (!supplier.name || items.length === 0) {
      alert("Supplier Name and at least one Item are required.");
      return;
    }

    setLoading(true);

    try {
      const purchaseData = {
        supplier,
        invoiceDetails,
        items,
        grandTotal,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "purchases"), purchaseData);

      // Update Stock
      for (const item of items) {
        const stockRef = collection(db, "jewellery_stock");
        const q = query(
          stockRef,
          where("name", "==", item.name),
          where("category", "==", item.category)
        );
        const querySnapshot = await getDocs(q);
        const weightToAdd =
          item.unit === "kg" ? Number(item.weight) * 1000 : Number(item.weight);

        if (!querySnapshot.empty) {
          const stockDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, "jewellery_stock", stockDoc.id), {
            totalWeight: increment(weightToAdd),
            qty: increment(1),
            updatedAt: new Date(),
          });
        } else {
          await addDoc(stockRef, {
            name: item.name,
            category: item.category,
            purity: item.purity,
            hsn: item.hsn,
            totalWeight: weightToAdd,
            weight: weightToAdd,
            qty: 1,
            stockType: "white",
            createdAt: new Date(),
          });
        }
      }

      alert("Purchase Saved & Stock Updated! ✅");
      setIsModalOpen(false);
      setSupplier({ name: "", gstin: "", contact: "", address: "" });
      setInvoiceDetails({
        invoiceNo: "",
        date: new Date().toISOString().split("T")[0],
      });
      setItems([]);
    } catch (error) {
      console.error("Error saving purchase:", error);
      alert("Failed to save purchase.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchase = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure? This will NOT revert stock.")) {
      try {
        await deleteDoc(doc(db, "purchases", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-4 sm:px-6 space-y-6 w-full max-w-[1600px] mx-auto pb-24 sm:pb-20">
      {/* 🔹 HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-yellow-600" /> Purchase Entry
          </h1>
          <p className="text-sm text-gray-500 hidden sm:block">
            Manage raw material buying & inventory Inward
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold rounded-xl shadow hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={20} /> New Purchase
        </button>
      </div>

      {/* 🔹 SEARCH */}
      <div className="relative w-full sm:w-1/3">
        <input
          type="text"
          placeholder="Search Supplier, Bill No..."
          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-500 outline-none transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>

      {/* 🔹 PURCHASES LIST (Responsive Grid) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {purchases
          .filter(
            (p) =>
              p.supplier?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              p.invoiceDetails?.invoiceNo?.includes(searchTerm)
          )
          .map((purchase) => (
            <div
              key={purchase.id}
              onClick={() => setSelectedPurchase(purchase)}
              className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group relative active:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate group-hover:text-yellow-600 transition">
                    {purchase.supplier.name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                    <Truck size={12} />{" "}
                    {purchase.supplier.address || "No Address"}
                  </p>
                </div>
                <span className="ml-2 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg border border-blue-100 whitespace-nowrap">
                  {purchase.invoiceDetails.date}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3 space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Bill No:</span>
                  <span className="font-mono font-medium">
                    {purchase.invoiceDetails.invoiceNo || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium">{purchase.items.length}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-lg sm:text-xl font-extrabold text-green-700">
                  {formatCurrency(purchase.grandTotal)}
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition">
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDeletePurchase(purchase.id, e)}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {purchases.length === 0 && (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed mx-4 sm:mx-0">
          <PackageCheck size={48} className="mx-auto mb-3 opacity-20" />
          <p>No purchase records found.</p>
        </div>
      )}

      {/* 🔹 1. ADD PURCHASE MODAL (Full Screen on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-none">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus size={20} className="text-yellow-600" /> New Purchase
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-500 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/50">
              {/* Supplier Details */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Supplier Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="Supplier Name *"
                    className="input-field"
                    value={supplier.name}
                    onChange={(e) =>
                      setSupplier({ ...supplier, name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="GSTIN Number"
                    className="input-field"
                    value={supplier.gstin}
                    onChange={(e) =>
                      setSupplier({
                        ...supplier,
                        gstin: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Contact No"
                    className="input-field"
                    value={supplier.contact}
                    onChange={(e) =>
                      setSupplier({ ...supplier, contact: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Bill No"
                    className="input-field"
                    value={invoiceDetails.invoiceNo}
                    onChange={(e) =>
                      setInvoiceDetails({
                        ...invoiceDetails,
                        invoiceNo: e.target.value,
                      })
                    }
                  />
                  <input
                    type="date"
                    className="input-field"
                    value={invoiceDetails.date}
                    onChange={(e) =>
                      setInvoiceDetails({
                        ...invoiceDetails,
                        date: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="City / Address"
                    className="input-field"
                    value={supplier.address}
                    onChange={(e) =>
                      setSupplier({ ...supplier, address: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Add Items Form */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Add Items
                </h4>

                {/* Responsive Grid for Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-3 items-end">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="label">Item Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Silver Bar"
                      value={currentItem.name}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="label">Category</label>
                    <select
                      className="input-field"
                      value={currentItem.category}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          category: e.target.value,
                        })
                      }
                    >
                      <option>Silver</option>
                      <option>Gold</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="label">Weight</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.00"
                      value={currentItem.weight}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          weight: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="label">Unit</label>
                    <select
                      className="input-field"
                      value={currentItem.unit}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, unit: e.target.value })
                      }
                    >
                      <option value="g">Grams</option>
                      <option value="kg">Kg</option>
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="label">Purity</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="999"
                      value={currentItem.purity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          purity: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="label">Rate</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Rate"
                      value={currentItem.rate}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, rate: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="label">Tax %</label>
                    <input
                      type="number"
                      className="input-field"
                      value={currentItem.tax}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, tax: e.target.value })
                      }
                    />
                  </div>

                  {/* Add Button - Full width on mobile */}
                  <div className="col-span-2 sm:col-span-1">
                    <button
                      onClick={handleAddItem}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 shadow-sm flex items-center justify-center active:scale-95 transition"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Items Table - Horizontal Scroll on Mobile */}
                {items.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-gray-100 mt-5">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <th className="px-4 py-3 text-left">Item</th>
                          <th className="px-4 py-3 text-center">Cat</th>
                          <th className="px-4 py-3 text-right">Qty/Wt</th>
                          <th className="px-4 py-3 text-right">Rate</th>
                          <th className="px-4 py-3 text-right">Tax</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.category}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {item.weight} {item.unit}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.rate}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500">
                              {item.tax}%
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions - Sticky Bottom on Mobile */}
            <div className="p-4 bg-white border-t flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 safe-area-bottom">
              <div className="flex justify-between w-full sm:w-auto sm:block text-right">
                <p className="text-xs text-gray-500 uppercase font-bold sm:text-right">
                  Grand Total
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-yellow-600">
                  {formatCurrency(grandTotal)}
                </p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePurchase}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 2. VIEW DETAILS MODAL (Full Screen on Mobile) */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col relative animate-slide-up sm:animate-none">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPurchase(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 p-2 rounded-full transition z-10"
            >
              <X size={20} />
            </button>

            <div className="bg-gray-50 px-6 py-5 border-b flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="text-yellow-600" /> Purchase Details
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Invoice:{" "}
                <span className="font-mono font-medium text-gray-800">
                  {selectedPurchase.invoiceDetails?.invoiceNo}
                </span>
              </p>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-white flex-1">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                    Supplier
                  </h4>
                  <p className="font-bold text-gray-800 text-lg">
                    {selectedPurchase.supplier?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedPurchase.supplier?.address}
                  </p>
                  <div className="mt-2 text-sm text-gray-500 space-y-1">
                    <p>
                      GSTIN:{" "}
                      <span className="font-medium text-gray-800">
                        {selectedPurchase.supplier?.gstin || "N/A"}
                      </span>
                    </p>
                    <p>
                      Contact:{" "}
                      <span className="font-medium text-gray-800">
                        {selectedPurchase.supplier?.contact || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                    Invoice Info
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Date</span>
                      <span className="font-medium text-gray-800">
                        {selectedPurchase.invoiceDetails?.date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Created At</span>
                      <span className="font-medium text-gray-800">
                        {selectedPurchase.createdAt?.seconds
                          ? new Date(
                              selectedPurchase.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table View */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">
                  Purchased Items
                </h4>
                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-center">Cat</th>
                        <th className="px-4 py-2 text-right">Qty/Wt</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                        <th className="px-4 py-2 text-right">Tax %</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedPurchase.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">
                            {item.name}{" "}
                            <span className="text-xs text-gray-400">
                              ({item.purity})
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {item.category}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {item.weight} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right">{item.rate}</td>
                          <td className="px-4 py-2 text-right">{item.tax}</td>
                          <td className="px-4 py-2 text-right font-bold">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold text-gray-800">
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right">
                          Grand Total
                        </td>
                        <td className="px-4 py-3 text-right text-lg text-green-700">
                          {formatCurrency(selectedPurchase.grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end flex-shrink-0 safe-area-bottom">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="w-full sm:w-auto px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles & Animation */}
      <style>{`
        .input-field {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
          background: #fff;
          font-size: 0.95rem;
          color: #1f2937;
        }
        .input-field:focus {
          border-color: #ca8a04;
          box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1);
        }
        .label {
          display: block;
          font-size: 0.70rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
          letter-spacing: 0.025em;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
      `}</style>
    </div>
  );
};

export default Purchase;
