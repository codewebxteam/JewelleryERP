import React, { useState } from "react";
import { girwiData } from "../data/dummyData.jsx"; // Importing dummy data
import { Search, Plus, X, Calculator } from "lucide-react"; // Added new icons

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const Girwi = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // --- State for Modals ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // --- State for the "Add New" form ---
  const [newGirwiData, setNewGirwiData] = useState({
    name: "",
    item: "",
    weight: "",
    amount: "",
    date: getTodayDate(),
  });

  // --- State for the "Close Deal" modal ---
  const [selectedGirwi, setSelectedGirwi] = useState(null);
  const [interestRate, setInterestRate] = useState("");
  const [returnDate, setReturnDate] = useState(getTodayDate());

  // --- Filter Logic ---
  const filteredData = girwiData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- "Add New Girwi" Modal Logic ---
  const handleNewGirwiChange = (e) => {
    const { name, value } = e.target;
    setNewGirwiData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveGirwi = (e) => {
    e.preventDefault();
    // --- TODO: Add Firebase addDoc() logic here ---
    console.log("Saving new girwi:", newGirwiData);
    // In a real app, you would add this to your state/database
    // For now, we just close the modal.
    setIsAddModalOpen(false);
    setNewGirwiData({
      name: "",
      item: "",
      weight: "",
      amount: "",
      date: getTodayDate(),
    });
  };

  // --- "Close Deal" Modal Logic ---
  const openCloseModal = (item) => {
    setSelectedGirwi(item);
    setReturnDate(getTodayDate());
    setInterestRate(""); // Reset interest rate
    setIsCloseModalOpen(true);
  };

  const closeCloseModal = () => {
    setIsCloseModalOpen(false);
    setSelectedGirwi(null);
  };

  const handleConfirmClose = () => {
    // --- TODO: Add Firebase updateDoc() logic here ---
    // This would update the item's status to "Closed" in Firestore
    console.log(
      "Closing deal for:",
      selectedGirwi.id,
      "Total:",
      totalAmountDue
    );
    closeCloseModal();
  };

  // --- Interest Calculation Logic ---
  let principal = 0,
    rate = 0,
    timeInMonths = 0,
    simpleInterest = 0,
    totalAmountDue = 0;

  if (selectedGirwi) {
    principal = Number(selectedGirwi.amount);
    rate = Number(interestRate);

    const startDate = new Date(selectedGirwi.date);
    const endDate = new Date(returnDate);

    if (endDate > startDate) {
      // Calculate time difference in days
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Convert days to months (using 30 days/month)
      timeInMonths = diffDays / 30;
    }

    // SI = (P * R * T) / 100 (where R is per month)
    simpleInterest = (principal * rate * timeInMonths) / 100;
    totalAmountDue = principal + simpleInterest;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Girwi Management
      </h2>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by Name or Girwi ID..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-6 py-2 bg-brand-gold text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add New Girwi
        </button>
      </div>

      {/* Girwi Data Table */}
      <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Girwi ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {/* --- FIXED TYPO: whitespace-nowrap --- */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {item.item} ({item.weight}g)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  ₹{item.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {item.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {item.status === "Active" && (
                    <button
                      onClick={() => openCloseModal(item)} // --- UPDATED ---
                      className="flex items-center text-indigo-600 hover:text-indigo-900"
                    >
                      <Calculator size={16} className="mr-1" />
                      Close Deal
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- "Add New Girwi" Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Add New Girwi
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveGirwi} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newGirwiData.name}
                  onChange={handleNewGirwiChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Item Description
                </label>
                <input
                  type="text"
                  name="item"
                  value={newGirwiData.item}
                  onChange={handleNewGirwiChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Weight (g)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={newGirwiData.weight}
                    onChange={handleNewGirwiChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount Given (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={newGirwiData.amount}
                    onChange={handleNewGirwiChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={newGirwiData.date}
                  onChange={handleNewGirwiChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-gold text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90"
                >
                  Save Girwi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- "Close Deal" Modal --- */}
      {isCloseModalOpen && selectedGirwi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Close Girwi Deal
              </h3>
              <button
                onClick={closeCloseModal}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Display Item Info */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p>
                  <strong>Customer:</strong> {selectedGirwi.name}
                </p>
                <p>
                  <strong>Item:</strong> {selectedGirwi.item} (
                  {selectedGirwi.weight}g)
                </p>
                <p>
                  <strong>Girwi Date:</strong>{" "}
                  {new Date(selectedGirwi.date).toLocaleDateString()}
                </p>
                <p className="font-bold">
                  <strong>Principal Amount:</strong> ₹
                  {principal.toLocaleString()}
                </p>
              </div>

              {/* Calculation Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Interest Rate (% per Month)
                  </label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="e.g., 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              {/* Display Calculation */}
              {rate > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                  <p>
                    <strong>Time:</strong> {timeInMonths.toFixed(2)} months (
                    {Math.ceil(timeInMonths * 30)} days)
                  </p>
                  <p>
                    <strong>Calculated Interest:</strong> ₹
                    {simpleInterest.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <hr className="my-2 border-blue-200" />
                  <p className="text-xl font-bold">
                    <strong>Total Amount Due:</strong> ₹
                    {totalAmountDue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleConfirmClose}
                  disabled={!rate}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Confirm Return & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Girwi;
