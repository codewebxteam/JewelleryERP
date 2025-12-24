import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import {
  FaEye,
  FaLock,
  FaLockOpen,
  FaTimes,
  FaPlus,
  FaMoneyBillWave,
  FaUser,
  FaGem,
  FaStickyNote,
  FaArrowLeft,
  FaArrowRight,
  FaTrash,
  FaCoins,
  FaHandHoldingUsd,
  FaChartLine,
} from "react-icons/fa";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

// ==========================================
// 🧮 CORE INTEREST CALCULATION ENGINE
// ==========================================
const calculateMonthlyInterest = (
  principal,
  rate,
  startDate,
  closedDate,
  payments = []
) => {
  if (!principal || !rate || !startDate)
    return {
      interest: 0,
      total: principal,
      principalRemaining: principal,
      daysHeld: 0,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      payments: [],
    };

  const start = new Date(startDate);
  const end = closedDate ? new Date(closedDate) : new Date();

  // Normalize to midnight
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const timeDiff = end.getTime() - start.getTime();
  const daysHeld = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));

  let currentPrincipal = Number(principal);
  let accruedInterest = 0;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;

  // Sort payments chronologically
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let processedPaymentsIdx = 0;
  let monthCount = 0;

  // --- MONTHLY CYCLE LOOP ---
  while (true) {
    let chargeDate = new Date(start);

    // Determine the interest charge date for this specific month cycle
    if (monthCount === 0) {
      chargeDate = new Date(start); // Day 1
    } else {
      chargeDate.setMonth(start.getMonth() + monthCount);
      chargeDate.setDate(chargeDate.getDate() + 1);
    }
    chargeDate.setHours(0, 0, 0, 0);

    // Stop if the charging date is in the future
    if (chargeDate > end) break;

    // 1. CHARGE INTEREST
    const interestForMonth = Math.round(currentPrincipal * (rate / 100));
    accruedInterest += interestForMonth;

    // 2. DETERMINE NEXT CYCLE DATE (Cutoff for payments)
    let nextCycleDate = new Date(start);
    nextCycleDate.setMonth(start.getMonth() + (monthCount + 1));
    nextCycleDate.setDate(nextCycleDate.getDate() + 1);
    nextCycleDate.setHours(0, 0, 0, 0);

    // 3. PROCESS PAYMENTS made in this window
    while (processedPaymentsIdx < sortedPayments.length) {
      const pay = sortedPayments[processedPaymentsIdx];
      const payDate = new Date(pay.date);
      payDate.setHours(0, 0, 0, 0);

      if (payDate < nextCycleDate) {
        let amt = Number(pay.amount);

        if (amt > 0) {
          // Pay Interest First
          const interestClear = Math.min(amt, accruedInterest);
          accruedInterest -= interestClear;
          amt -= interestClear;
          totalInterestPaid += interestClear;

          // Pay Principal Second
          if (amt > 0) {
            const principalClear = Math.min(amt, currentPrincipal);
            currentPrincipal -= principalClear;
            totalPrincipalPaid += principalClear;
          }
        }
        processedPaymentsIdx++;
      } else {
        break;
      }
    }

    monthCount++;
    if (monthCount > 1200) break; // Safety brake
  }

  // Handle payments made after the last cycle but before closing/today
  while (processedPaymentsIdx < sortedPayments.length) {
    const pay = sortedPayments[processedPaymentsIdx];
    let amt = Number(pay.amount);

    const interestClear = Math.min(amt, accruedInterest);
    accruedInterest -= interestClear;
    amt -= interestClear;
    totalInterestPaid += interestClear;

    if (amt > 0) {
      const principalClear = Math.min(amt, currentPrincipal);
      currentPrincipal -= principalClear;
      totalPrincipalPaid += principalClear;
    }
    processedPaymentsIdx++;
  }

  const totalPayable = Math.round(currentPrincipal + accruedInterest);

  return {
    interest: Math.round(accruedInterest),
    total: totalPayable > 0 ? totalPayable : 0,
    principalRemaining: Math.round(currentPrincipal),
    daysHeld,
    totalPrincipalPaid: Math.round(totalPrincipalPaid),
    totalInterestPaid: Math.round(totalInterestPaid),
    payments: sortedPayments,
  };
};

// ==========================================
// 👁️ VIEW DETAILS / ADD PAYMENT MODAL
// ==========================================
function ViewDetailsModal({ girvi, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'payments'
  const [currentInterestRate, setCurrentInterestRate] = useState(
    girvi.interestRate || 2
  );

  // Payment Form State
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [payRemark, setPayRemark] = useState("");

  // Payment Pagination State
  const [paymentPage, setPaymentPage] = useState(1);
  const PAYMENT_ITEMS_PER_PAGE = 5;

  const {
    total,
    interest,
    principalRemaining,
    daysHeld,
    totalPrincipalPaid,
    totalInterestPaid,
    payments,
  } = useMemo(
    () =>
      calculateMonthlyInterest(
        girvi.amount,
        currentInterestRate,
        girvi.startDate,
        girvi.status === "Closed" ? girvi.closedDate : null,
        girvi.payments
      ),
    [
      girvi.amount,
      currentInterestRate,
      girvi.startDate,
      girvi.status,
      girvi.closedDate,
      girvi.payments,
    ]
  );

  // Pagination Logic for Payments
  const totalPaymentPages = Math.ceil(payments.length / PAYMENT_ITEMS_PER_PAGE);
  const currentPayments = payments.slice(
    (paymentPage - 1) * PAYMENT_ITEMS_PER_PAGE,
    paymentPage * PAYMENT_ITEMS_PER_PAGE
  );

  // Reset page if payments change drastically
  useEffect(() => {
    if (paymentPage > totalPaymentPages && totalPaymentPages > 0) {
      setPaymentPage(totalPaymentPages);
    }
  }, [payments.length, totalPaymentPages, paymentPage]);

  const handleStatusChange = (newStatus) => {
    let date = null;
    let time = null;
    if (newStatus === "Closed") {
      date = new Date().toISOString().split("T")[0];
      time = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    onUpdate(girvi.girviNumber, {
      status: newStatus,
      closedDate: date,
      closedTime: time,
      interestRate: currentInterestRate,
    });

    if (newStatus === "Active") onClose();
  };

  const handleAddPayment = () => {
    if (!payAmount || Number(payAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const newPayment = {
      id: Date.now().toString(),
      amount: Number(payAmount),
      date: payDate,
      remark: payRemark,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [...(girvi.payments || []), newPayment];

    onUpdate(girvi.girviNumber, {
      payments: updatedPayments,
    });

    setPayAmount("");
    setPayRemark("");
    alert("Payment Added Successfully ✅");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-yellow-50 to-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              #{girvi.girviNumber}{" "}
              <span className="text-gray-400 font-normal">|</span> {girvi.name}
            </h2>
            <p className="text-sm text-gray-500">
              {girvi.itemDescription || "No Description"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition p-2"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            className={`flex-1 py-3 font-bold text-sm transition border-b-2 ${
              activeTab === "overview"
                ? "border-yellow-600 text-yellow-800 bg-white"
                : "border-transparent text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Details & Overview
          </button>
          <button
            className={`flex-1 py-3 font-bold text-sm transition border-b-2 ${
              activeTab === "payments"
                ? "border-blue-600 text-blue-800 bg-white"
                : "border-transparent text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("payments")}
          >
            Payments History ({payments.length})
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {/* Financial Status Section */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-xl border border-yellow-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-yellow-800 font-bold flex items-center gap-2 text-lg">
                    <FaMoneyBillWave /> Financial Status
                  </h3>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-yellow-200 shadow-sm">
                    <label className="text-xs font-bold text-gray-600">
                      INT. RATE (%):
                    </label>
                    <input
                      type="number"
                      value={currentInterestRate}
                      onChange={(e) =>
                        setCurrentInterestRate(Number(e.target.value))
                      }
                      className="w-12 p-0 text-center border-none focus:ring-0 font-bold text-yellow-700 bg-transparent text-sm"
                      disabled={girvi.status === "Closed"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white/60 p-2 rounded">
                    <span className="block text-gray-500 text-xs uppercase font-bold">
                      Total Loan
                    </span>
                    <span className="text-gray-900 font-bold text-lg">
                      ₹{girvi.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/60 p-2 rounded">
                    <span className="block text-gray-500 text-xs uppercase font-bold">
                      Principal Bal
                    </span>
                    <span className="text-red-600 font-bold text-lg">
                      ₹{principalRemaining.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/60 p-2 rounded">
                    <span className="block text-gray-500 text-xs uppercase font-bold">
                      Interest Due
                    </span>
                    <span className="text-yellow-700 font-bold text-lg">
                      ₹{interest.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/60 p-2 rounded border border-yellow-200">
                    <span className="block text-gray-500 text-xs uppercase font-bold">
                      Net Payable
                    </span>
                    <span className="text-blue-800 font-extrabold text-lg">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Collection Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-yellow-200/50">
                  <div className="flex justify-between text-xs text-green-700 font-medium">
                    <span>Total Principal Recv:</span>
                    <span className="font-bold">
                      ₹{totalPrincipalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-700 font-medium">
                    <span>Total Interest Recv:</span>
                    <span className="font-bold">
                      ₹{totalInterestPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-1">
                    <FaUser className="text-gray-400" size={14} /> Customer
                    Details
                  </h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs block">
                        Full Name
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Contact No
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.contactNumber || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Start Date
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.startDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        ID Proof Type
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.idProofType || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        ID Proof No
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.idProofNumber || "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs block">
                        Address
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.Address || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-1">
                    <FaGem className="text-gray-400" size={14} /> Item Details
                  </h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="col-span-2">
                      <span className="text-gray-500 text-xs block">
                        Description
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.itemDescription || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Weight (g)
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.weight || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Purity
                      </span>
                      <span className="font-medium text-gray-900">
                        {girvi.purity || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Market Value
                      </span>
                      <span className="font-medium text-gray-900">
                        ₹{Number(girvi.marketValue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Locker ID
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-bold inline-block text-xs">
                        {girvi.lockerId || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="col-span-1 md:col-span-2">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-1 mb-2">
                    <FaStickyNote className="text-gray-400" size={14} /> Remarks
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic">
                    {girvi.remark || "No remarks added."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add Payment Form */}
              {girvi.status === "Active" && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-sm">
                    <FaPlus size={12} /> Add Partial Payment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      className="p-2 border rounded text-sm w-full focus:ring-2 focus:ring-blue-400 outline-none"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                    <input
                      type="date"
                      className="p-2 border rounded text-sm w-full focus:ring-2 focus:ring-blue-400 outline-none"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Remark (Optional)"
                      className="p-2 border rounded text-sm w-full focus:ring-2 focus:ring-blue-400 outline-none"
                      value={payRemark}
                      onChange={(e) => setPayRemark(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAddPayment}
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition shadow-sm text-sm"
                  >
                    Record Payment
                  </button>
                </div>
              )}

              {/* Payments Table with Pagination */}
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-600">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-gray-600">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-gray-600">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {currentPayments.length > 0 ? (
                      currentPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{p.date}</td>
                          <td className="px-4 py-3 font-bold text-green-700">
                            ₹{p.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-500 italic">
                            {p.remark || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-8 text-gray-400 italic"
                        >
                          No payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPaymentPages > 1 && (
                <div className="flex justify-between items-center text-sm">
                  <button
                    onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                    disabled={paymentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                  >
                    <FaArrowLeft size={10} /> Prev
                  </button>
                  <span className="text-gray-500 font-medium">
                    Page {paymentPage} of {totalPaymentPages}
                  </span>
                  <button
                    onClick={() =>
                      setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))
                    }
                    disabled={paymentPage === totalPaymentPages}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                  >
                    Next <FaArrowRight size={10} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
          {girvi.status === "Active" ? (
            <button
              onClick={() => handleStatusChange("Closed")}
              disabled={total > 0}
              className={`flex-1 w-full px-4 py-3 rounded-lg font-bold shadow transition flex justify-center items-center gap-2 text-sm uppercase tracking-wide ${
                total > 0
                  ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              <FaLock />{" "}
              {total > 0
                ? `Clear Due (₹${total.toLocaleString()})`
                : "Final Close Deal"}
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange("Active")}
              className="flex-1 w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-green-700 transition flex justify-center items-center gap-2 text-sm uppercase tracking-wide"
            >
              <FaLockOpen /> Re-Open Deal
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold hover:bg-gray-100 transition text-sm uppercase tracking-wide"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 📋 RECORDS TABLE
// ==========================================
function GirviRecordsTable({ girviList, onViewDetails, onDelete }) {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700">All Records</h2>
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          Total: {girviList.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Loan Amt</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {girviList.map((g) => (
              <tr key={g.girviNumber} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-bold text-gray-700">
                  #{g.girviNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{g.name}</div>
                  <div className="text-xs text-gray-500">{g.contactNumber}</div>
                </td>
                <td className="px-4 py-3 font-bold text-gray-800">
                  ₹{g.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {g.date}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      g.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {g.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                  <button
                    onClick={() => onViewDetails(g)}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"
                    title="View Details"
                  >
                    <FaEye size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(g.id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition"
                    title="Delete Record"
                  >
                    <FaTrash size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {girviList.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 📄 MAIN PAGE
// ==========================================
export default function GirviPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGirvi, setSelectedGirvi] = useState(null);
  const [girviListState, setGirviListState] = useState([]);
  const [nextGirviId, setNextGirviId] = useState(1001);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Stats State
  const [stats, setStats] = useState({
    activePrincipal: 0,
    totalInterestCollected: 0,
    totalPrincipalRecovered: 0,
  });

  // Initial Load
  useEffect(() => {
    handleSearch("");
  }, []);

  // Update Stats whenever list changes
  useEffect(() => {
    let activeP = 0;
    let totalInt = 0;
    let totalPrinc = 0;

    girviListState.forEach((item) => {
      // Run calculations for every item to get accurate historical interest paid
      const calc = calculateMonthlyInterest(
        item.amount,
        item.interestRate || 2,
        item.startDate,
        item.status === "Closed" ? item.closedDate : null,
        item.payments
      );

      // Add to aggregate stats
      if (item.status === "Active") {
        activeP += calc.principalRemaining;
      }
      totalInt += calc.totalInterestPaid;
      totalPrinc += calc.totalPrincipalPaid;
    });

    setStats({
      activePrincipal: activeP,
      totalInterestCollected: totalInt,
      totalPrincipalRecovered: totalPrinc,
    });
  }, [girviListState]);

  // Fetch Next ID
  const fetchNextId = async () => {
    try {
      const q = query(
        collection(db, "girvi_records"),
        orderBy("girviNumber", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastId = snapshot.docs[0].data().girviNumber;
        setNextGirviId(Number(lastId) + 1);
      } else {
        setNextGirviId(1001);
      }
    } catch (err) {
      console.error("Error fetching next ID:", err);
      setNextGirviId(1001);
    }
  };

  const openForm = () => {
    fetchNextId();
    setShowForm(true);
  };

  const handleSearch = async (value) => {
    setSearch(value);
    setCurrentPage(1);

    if (!value.trim()) {
      const q = query(
        collection(db, "girvi_records"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setGirviListState(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      return;
    }

    const colRef = collection(db, "girvi_records");
    const snap = await getDocs(colRef);
    const allDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const filtered = allDocs.filter(
      (item) =>
        item.name?.toLowerCase().includes(value.toLowerCase()) ||
        String(item.girviNumber).includes(value)
    );

    filtered.sort((a, b) => b.girviNumber - a.girviNumber);
    setGirviListState(filtered);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      )
    ) {
      try {
        await deleteDoc(doc(db, "girvi_records", id));
        setGirviListState((prev) => prev.filter((item) => item.id !== id));
        alert("Record deleted successfully.");
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Error deleting record.");
      }
    }
  };

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = girviListState.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(girviListState.length / recordsPerPage);

  const handleFormSubmit = async (formData) => {
    const newGirvi = {
      ...formData,
      girviNumber: Number(formData.girviNumber),
      marketValue: Number(formData.marketValue || 0), // Explicit Number conversion
      amount: Number(formData.amount),
      startDate: formData.date,
      interestRate: Number(formData.interestRate) || 2,
      closedDate: null,
      closedTime: null,
      payments: [],
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "girvi_records"), newGirvi);
      alert(`Girvi #${newGirvi.girviNumber} Created Successfully 🎉`);
      setShowForm(false);
      handleSearch(""); // Refresh list
    } catch (error) {
      console.error(error);
      alert("❌ Error saving data.");
    }
  };

  const handleUpdate = useCallback(
    async (girviNumber, updates) => {
      try {
        const match = girviListState.find((g) => g.girviNumber === girviNumber);
        if (!match) return;

        const ref = doc(db, "girvi_records", match.id);
        await updateDoc(ref, updates);

        setGirviListState((prev) =>
          prev.map((item) =>
            item.girviNumber === girviNumber ? { ...item, ...updates } : item
          )
        );
        setSelectedGirvi((prev) => (prev ? { ...prev, ...updates } : null));
      } catch (error) {
        console.error(error);
        alert("Error updating record");
      }
    },
    [girviListState]
  );

  return (
    <div className="space-y-6 p-4 sm:px-6 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Girvi Management</h1>
          <p className="text-gray-500 text-sm">
            Create and manage mortgage entries
          </p>
        </div>
        <button
          onClick={openForm}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg flex items-center gap-2 transition transform active:scale-95"
        >
          <FaPlus /> New Entry
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-50 text-red-600">
            <FaHandHoldingUsd size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">
              Active Market Money
            </p>
            <p className="text-xl font-extrabold text-gray-800">
              ₹{stats.activePrincipal.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-50 text-green-600">
            <FaChartLine size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">
              Total Interest Collected
            </p>
            <p className="text-xl font-extrabold text-gray-800">
              ₹{stats.totalInterestCollected.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <FaCoins size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">
              Principal Recovered
            </p>
            <p className="text-xl font-extrabold text-gray-800">
              ₹{stats.totalPrincipalRecovered.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by Name or Girvi ID..."
          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>

      {/* Table */}
      <GirviRecordsTable
        girviList={currentRecords}
        onViewDetails={setSelectedGirvi}
        onDelete={handleDelete}
      />

      {/* Main Page Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-600"
          >
            Previous
          </button>
          <span className="text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-600"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Add New Girvi</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <FaTimes size={22} />
              </button>
            </div>
            <div className="p-6">
              <GirviForm onSubmit={handleFormSubmit} nextId={nextGirviId} />
            </div>
          </div>
        </div>
      )}

      {selectedGirvi && (
        <ViewDetailsModal
          girvi={selectedGirvi}
          onClose={() => setSelectedGirvi(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

// ==========================================
// 📝 FORM COMPONENT
// ==========================================
function GirviForm({ onSubmit, nextId }) {
  const [form, setForm] = useState({
    name: "",
    itemDescription: "",
    marketValue: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    interestRate: 2,
    purity: "",
    weight: "",
    girviNumber: nextId || "",
    contactNumber: "",
    idProofType: "Aadhaar Card",
    idProofNumber: "",
    lockerId: "",
    remark: "",
    Address: "",
  });

  useEffect(() => {
    if (nextId) setForm((f) => ({ ...f, girviNumber: nextId }));
  }, [nextId]);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = () => {
    if (!form.name || !form.amount || !form.date) {
      alert("Please fill required fields (Name, Amount, Date)");
      return;
    }
    onSubmit(form);
  };

  const inputClass =
    "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm outline-none";
  const labelClass =
    "block text-xs font-bold text-gray-500 uppercase mb-1 ml-1";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <label className={labelClass}>Girvi Number</label>
          <input
            name="girviNumber"
            value={form.girviNumber}
            readOnly
            className={`${inputClass} bg-gray-100 font-bold text-gray-600 cursor-not-allowed`}
          />
        </div>
        <div className="col-span-1">
          <label className={labelClass}>Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={update}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Customer Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={update}
            className={inputClass}
            placeholder="Enter name"
          />
        </div>
        <div>
          <label className={labelClass}>Contact Number</label>
          <input
            name="contactNumber"
            value={form.contactNumber}
            onChange={update}
            className={inputClass}
            placeholder="Mobile"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Loan Amount (₹) *</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={update}
            className={`${inputClass} border-yellow-400`}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass}>Interest Rate (%)</label>
          <input
            type="number"
            name="interestRate"
            value={form.interestRate}
            onChange={update}
            className={inputClass}
            placeholder="2"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Item Description</label>
        <textarea
          name="itemDescription"
          value={form.itemDescription}
          onChange={update}
          rows="2"
          className={inputClass}
          placeholder="E.g., Gold Ring, 22k..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Weight (g)</label>
          <input
            name="weight"
            value={form.weight}
            onChange={update}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass}>Purity</label>
          <input
            name="purity"
            value={form.purity}
            onChange={update}
            className={inputClass}
            placeholder="22k"
          />
        </div>
        <div>
          <label className={labelClass}>Market Val</label>
          <input
            type="number"
            name="marketValue"
            value={form.marketValue}
            onChange={update}
            className={inputClass}
            placeholder="₹"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>ID Proof Type</label>
          <select
            name="idProofType"
            value={form.idProofType}
            onChange={update}
            className={inputClass}
          >
            <option>Aadhaar Card</option>
            <option>PAN Card</option>
            <option>Voter ID</option>
            <option>Driving License</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>ID Number</label>
          <input
            name="idProofNumber"
            value={form.idProofNumber}
            onChange={update}
            className={inputClass}
            placeholder="ID No."
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <textarea
          name="Address"
          value={form.Address}
          onChange={update}
          rows="2"
          className={inputClass}
          placeholder="Customer Address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Locker ID</label>
          <input
            name="lockerId"
            value={form.lockerId}
            onChange={update}
            className={inputClass}
            placeholder="Box/Shelf No."
          />
        </div>
        <div>
          <label className={labelClass}>Remark</label>
          <input
            name="remark"
            value={form.remark}
            onChange={update}
            className={inputClass}
            placeholder="Any notes"
          />
        </div>
      </div>

      <button
        onClick={submit}
        className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold shadow hover:bg-yellow-700 transition mt-4 uppercase tracking-wide text-sm"
      >
        Save Record
      </button>
    </div>
  );
}
