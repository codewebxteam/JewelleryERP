import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { FaEye, FaLock, FaLockOpen, FaTimes, FaPlus } from "react-icons/fa";
import { db } from "../firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
} from "firebase/firestore";

const DAYS_IN_YEAR = 365.25;

const calculateMonthlyInterest = (principal, rate, startDate, closedDate, payments = []) => {
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
    const timeDiff = end.getTime() - start.getTime();
    const daysHeld = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));

    const monthlyRateDecimal = rate / 100 / 12;
    const avgDaysInMonth = DAYS_IN_YEAR / 12;

    let interestAccumulated = 0;
    let principalRemaining = principal;
    let totalInterestPaid = 0;

    const sortedPayments = [...payments].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    let currentCalcDate = start;
    const calculationPoints = [...sortedPayments.map((p) => new Date(p.date)), end]
        .filter(
            (date, i, self) =>
                date >= start && self.findIndex((d) => d.getTime() === date.getTime()) === i
        )
        .sort((a, b) => a - b);

    calculationPoints.forEach((paymentDate) => {
        let timePeriodDays = Math.max(
            0,
            Math.floor((paymentDate.getTime() - currentCalcDate.getTime()) / (1000 * 3600 * 24))
        );

        if (timePeriodDays > 0) {
            const periodInterest =
                principalRemaining * monthlyRateDecimal * (timePeriodDays / avgDaysInMonth);
            interestAccumulated += periodInterest;
        }

        const paymentsOnThisDate = sortedPayments.filter(
            (p) => new Date(p.date).toDateString() === paymentDate.toDateString()
        );

        paymentsOnThisDate.forEach((payment) => {
            if (payment.amount > 0) {
                let paymentAmount = payment.amount;

                let paidInterest = Math.min(paymentAmount, interestAccumulated);
                interestAccumulated -= paidInterest;
                paymentAmount -= paidInterest;
                totalInterestPaid += paidInterest;

                let paidPrincipal = Math.min(paymentAmount, principalRemaining);
                principalRemaining -= paidPrincipal;
                principalRemaining = Math.max(0, principalRemaining);
            }
        });

        currentCalcDate = paymentDate;
    });

    const finalTotalPrincipalPaid = principal - principalRemaining;
    const totalPayable = principalRemaining + interestAccumulated;

    return {
        interest: Math.round(interestAccumulated),
        total: Math.round(totalPayable),
        principalRemaining: Math.round(principalRemaining),
        daysHeld,
        totalPrincipalPaid: Math.round(finalTotalPrincipalPaid),
        totalInterestPaid: Math.round(totalInterestPaid),
        payments: sortedPayments,
    };
};

function ViewDetailsModal({ girvi, onClose, onUpdate }) {
    const [currentInterestRate, setCurrentInterestRate] = useState(
        girvi.interestRate || 10
    );

    const { total, interest, principalRemaining, daysHeld } = useMemo(
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg md:max-w-xl shadow-2xl overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl sm:text-2xl font-bold">
                        Girvi Details: #{girvi.girviNumber}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        <FaTimes />
                    </button>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-700">
                    💍 Item Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
                    <p>
                        <strong>Girvi Number:</strong>
                    </p>
                    <p>{girvi.girviNumber}</p>
                    <p>
                        <strong>Item:</strong>
                    </p>
                    <p className="truncate">{girvi.item}</p>
                    <p>
                        <strong>Purity:</strong>
                    </p>
                    <p>{girvi.purity} Karat</p>
                    <p>
                        <strong>Weight:</strong>
                    </p>
                    <p>{girvi.weight} g</p>
                    <p>
                        <strong>Locker ID:</strong>
                    </p>
                    <p>{girvi.lockerId || "N/A"}</p>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-3 text-yellow-600">
                    💰 Financial Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-gray-700 mb-4 bg-yellow-50 p-3 rounded-lg">
                    <p>
                        <strong>Customer:</strong>
                    </p>
                    <p className="truncate">{girvi.name}</p>
                    <p>
                        <strong>Address:</strong>
                    </p>
                    <p className="truncate">{girvi.Address}</p>
                    <p>
                        <strong>Original Loan:</strong>
                    </p>
                    <p className="font-bold">
                        ₹{girvi.amount.toLocaleString("en-IN")}
                    </p>
                    <p>
                        <strong>Start Date:</strong>
                    </p>
                    <p>{girvi.startDate}</p>
                    <p>
                        <strong>Days Held:</strong>
                    </p>
                    <p>{daysHeld} days</p>

                    <label htmlFor="interestRate" className="font-bold self-center">
                        Interest Rate (%/Yr):
                    </label>
                    <input
                        id="interestRate"
                        type="number"
                        min="0"
                        value={currentInterestRate}
                        onChange={(e) => setCurrentInterestRate(Number(e.target.value))}
                        className="p-1 border rounded w-full text-lg font-mono text-center"
                        disabled={girvi.status === "Closed"}
                    />

                    <div className="col-span-1 sm:col-span-2 h-px bg-gray-200 my-2"></div>

                    <p className="text-md sm:text-lg font-bold text-red-600">
                        Remaining Principal:
                    </p>
                    <p className="text-md sm:text-lg font-bold text-red-600">
                        ₹{principalRemaining.toLocaleString("en-IN")}
                    </p>

                    <p className="text-md sm:text-lg font-bold text-yellow-700">
                        Accumulated Interest:
                    </p>
                    <p className="text-md sm:text-lg font-bold text-yellow-700">
                        ₹{interest.toLocaleString("en-IN")}
                    </p>

                    <p className="text-lg sm:text-xl font-extrabold text-blue-800 pt-2 border-t border-blue-200">
                        Total Payable:
                    </p>
                    <p className="text-lg sm:text-xl font-extrabold text-blue-800 pt-2 border-t border-blue-200">
                        ₹{total.toLocaleString("en-IN")}
                    </p>

                    {girvi.status === "Closed" && (
                        <>
                            <p className="text-sm">
                                <strong>Closed Date/Time:</strong>
                            </p>
                            <p className="text-sm">
                                {girvi.closedDate} @ {girvi.closedTime}
                            </p>
                        </>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t gap-3">
                    {girvi.status === "Active" ? (
                        <button
                            onClick={() => handleStatusChange("Closed")}
                            className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-md font-semibold shadow hover:bg-red-700 transition"
                        >
                            <FaLock /> Final Close Deal
                        </button>
                    ) : (
                        <button
                            onClick={() => handleStatusChange("Active")}
                            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-md font-semibold shadow hover:bg-green-700 transition"
                        >
                            <FaLockOpen /> Re-Open Deal
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full mb-12 sm:w-auto bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
}

function GirviRecordsTable({ girviList, onViewDetails }) {
    return (
        <div className="overflow-x-auto shadow rounded-xl mt-6">
            <h2 className="text-xl sm:text-2xl font-bold p-4 bg-white border-b">
                Detailed Records List
            </h2>
            <table className="min-w-full divide-y divide-gray-200 bg-white text-xs sm:text-sm">
                <thead className="bg-gray-200 text-left whitespace-nowrap">
                    <tr>
                        <th className="p-3">Girvi No.</th>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3 hidden sm:table-cell">Contact</th>
                        <th className="p-3 hidden md:table-cell">ID Proof</th>
                        <th className="p-3">Loan Amt (₹)</th>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {girviList.map((g) => (
                        <tr
                            key={g.girviNumber}
                            className="border-b hover:bg-gray-50 transition duration-150"
                        >
                            <td className="p-3 font-semibold text-blue-600">
                                {g.girviNumber}
                            </td>
                            <td className="p-3 whitespace-nowrap">{g.name}</td>
                            <td className="p-3 hidden sm:table-cell whitespace-nowrap">
                                {g.contactNumber || "N/A"}
                            </td>
                            <td className="p-3 hidden md:table-cell max-w-[150px] truncate">
                                {g.idProofType || "N/A"}: {g.idProofNumber || "N/A"}
                            </td>
                            <td className="p-3 font-medium whitespace-nowrap">
                                ₹{g.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 whitespace-nowrap">{g.date}</td>
                            <td className="p-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                        g.status === "Active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {g.status}
                                </span>
                            </td>
                            <td className="p-3 text-center">
                                <button
                                    onClick={() => onViewDetails(g)}
                                    className="bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 justify-center mx-auto text-xs sm:text-sm shadow hover:bg-blue-700 transition whitespace-nowrap"
                                >
                                    <FaEye /> View/Close
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {girviList.length === 0 && (
                <div className="text-center p-4 text-gray-500 italic">
                    No records found matching your search.
                </div>
            )}
        </div>
    );
}

export default function GirviPage() {
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedGirvi, setSelectedGirvi] = useState(null);
    const [girviListState, setGirviListState] = useState([]);

    // 🔥 Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    // Load Data on Startup
    useEffect(() => {
        handleSearch("");
    }, []);

    const handleSearch = async (value) => {
        setSearch(value);
        setCurrentPage(1); // 🔥 Reset Page on New Search

        if (!value.trim()) {
            const fullSnap = await getDocs(collection(db, "girvi_records"));
            setGirviListState(fullSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            return;
        }

        const colRef = collection(db, "girvi_records");

        const q1 = query(colRef, where("name", ">=", value), where("name", "<=", value + "\uf8ff"));
        const q2 = query(
            colRef,
            where("girviNumber", ">=", value),
            where("girviNumber", "<=", value + "\uf8ff")
        );

        const res1 = await getDocs(q1);
        const res2 = await getDocs(q2);

        const results = [...res1.docs, ...res2.docs].reduce((acc, docSnap) => {
            const data = { id: docSnap.id, ...docSnap.data() };
            if (!acc.some((item) => item.id === data.id)) acc.push(data);
            return acc;
        }, []);

        setGirviListState(results);
    };

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = girviListState.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(girviListState.length / recordsPerPage);

    const handleFormSubmit = async (formData) => {
        if (!formData.girviNumber) {
            alert("Girvi Number is mandatory.");
            return;
        }

        const newGirvi = {
            ...formData,
            startDate: formData.date,
            interestRate: Number(formData.interestRate) || 10,
            closedDate: null,
            closedTime: null,
            payments: [],
            purity: formData.purity || "N/A",
            weight: formData.weight || "N/A",
            girviNumber: formData.girviNumber,
            contactNumber: formData.contactNumber,
            idProofType: formData.idProofType,
            idProofNumber: formData.idProofNumber,
            lockerId: formData.lockerId || "",
            remark: formData.remark || "",
            Address: formData.Address || "",
            status: "Active",
            createdAt: new Date(),
        };

        try {
            await addDoc(collection(db, "girvi_records"), newGirvi);
            alert("New Girvi Record Added Successfully 🎉");
            setShowForm(false);
        } catch (error) {
            console.error(error);
            alert("❌ Error saving data. Check console.");
        }
    };

    const handleUpdate = useCallback(
        async (girviNumber, updates) => {
            try {
                const match = girviListState.find((g) => g.girviNumber === girviNumber);
                if (!match) return;

                const ref = doc(db, "girvi_records", match.id);
                await updateDoc(ref, updates);

                alert("Record Updated");
            } catch (error) {
                console.error(error);
                alert("Error updating record");
            }
        },
        [girviListState]
    );

    const handleViewDetails = (girvi) => setSelectedGirvi(girvi);
    const closeModal = () => setSelectedGirvi(null);

    return (
        <div className="space-y-6 p-4 sm:px-4 md:px-6 lg:px-4 pb-24">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Girvi Management</h1>

            <div className="flex justify-between flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:max-w-md">
                    <input
                        type="text"
                        placeholder="Search by Name or Girvi Number..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-600"
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 bg-yellow-700 text-white rounded-lg font-bold shadow flex items-center justify-center hover:bg-yellow-800"
                >
                    <FaPlus /> Add New Record
                </button>
            </div>

            <GirviRecordsTable girviList={currentRecords} onViewDetails={handleViewDetails} />

            {/* 🔥 Pagination Controls */}
            {girviListState.length > 10 && (
                <div className="flex justify-center items-center gap-4 py-6">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <span className="font-semibold text-lg">
                        {currentPage} / {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Add New Girvi Record</h2>

                        <GirviForm onSubmit={handleFormSubmit} />

                        <button
                            onClick={() => setShowForm(false)}
                            className="mt-4 mb-12 bg-red-500 text-white p-2 w-full rounded-lg hover:bg-red-600 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {selectedGirvi && (
                <ViewDetailsModal
                    girvi={selectedGirvi}
                    onClose={closeModal}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}

function GirviForm({ onSubmit }) {
    const [form, setForm] = useState({
        name: "",
        itemDescription: "",
        marketValue: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        interestRate: 10,
        purity: "",
        weight: "",
        girviNumber: "",
        status: "Active",
        contactNumber: "",
        idProofType: "Aadhaar",
        idProofNumber: "",
        lockerId: "",
        remark: "",
        Address: "",
    });

    const update = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const submit = () => {
        if (!form.name || !form.girviNumber || !form.amount || !form.date) {
            alert("Please fill in Customer Name, Girvi Number, Amount, and Date.");
            return;
        }

        onSubmit({
            name: form.name,
            item: form.itemDescription,
            amount: Number(form.amount),
            date: form.date,
            status: "Active",
            interestRate: Number(form.interestRate),
            purity: form.purity,
            weight: form.weight,
            girviNumber: form.girviNumber,
            contactNumber: form.contactNumber,
            idProofType: form.idProofType,
            idProofNumber: form.idProofNumber,
            lockerId: form.lockerId,
            remark: form.remark,
            Address: form.Address,
        });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
                name="name"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Customer Name"
                value={form.name}
            />
            <input
                name="contactNumber"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Contact Number"
                type="tel"
                value={form.contactNumber}
            />

            <select
                name="idProofType"
                onChange={update}
                className="p-2 border rounded"
                value={form.idProofType}
            >
                <option value="Select ID Proof">Select ID Proof</option>
                <option value="PAN">PAN</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Voter ID">Voter ID</option>
            </select>

            <input
                name="idProofNumber"
                onChange={update}
                className="p-2 border rounded"
                placeholder="ID Proof Number"
                value={form.idProofNumber}
            />

            <textarea
                name="itemDescription"
                onChange={update}
                className="p-2 border rounded col-span-1 sm:col-span-2"
                placeholder="Item Description"
                rows="1"
                value={form.itemDescription}
            ></textarea>

            <input
                name="purity"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Purity (Karat)"
                value={form.purity}
            />
            <input
                name="weight"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Weight (g)"
                value={form.weight}
            />

            <input
                name="marketValue"
                type="number"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Market Value (₹)"
                value={form.marketValue}
            />
            <input
                name="amount"
                type="number"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Amount Given (₹) *"
                value={form.amount}
            />

            <input
                name="interestRate"
                type="number"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Interest Rate (%)"
                value={form.interestRate}
            />

            <input
                name="girviNumber"
                onChange={update}
                className="p-2 border rounded"
                placeholder="Girvi Number (Mandatory) *"
                value={form.girviNumber}
            />

            <input
                name="date"
                type="date"
                onChange={update}
                className="p-2 border rounded"
                value={form.date}
            />

            <select className="p-2 border rounded col-span-1 sm:col-span-2">
                <option>Select</option>
                <option>New</option>
                <option>Old</option>
                <option>Good Condition</option>
                <option>Scratched</option>
            </select>

            <textarea
                name="lockerId"
                onChange={update}
                className="p-2 border rounded col-span-1 sm:col-span-2"
                placeholder="Locker ID Of Item"
                rows="1"
                value={form.lockerId}
            ></textarea>

            <textarea
                name="remark"
                onChange={update}
                className="p-2 border rounded col-span-1 sm:col-span-2"
                placeholder="Remark"
                rows="1"
                value={form.remark}
            ></textarea>

            <textarea
                name="Address"
                onChange={update}
                className="p-2 border rounded col-span-1 sm:col-span-2"
                placeholder="Address"
                rows="1"
                value={form.Address}
            ></textarea>

            <button
                onClick={submit}
                className="bg-yellow-600 text-white p-3 rounded-xl mt-3 col-span-1 sm:col-span-2 hover:bg-yellow-700 transition"
            >
                Submit Record
            </button>
        </div>
    );
}
