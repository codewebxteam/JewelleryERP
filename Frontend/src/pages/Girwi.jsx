import React, { useState, useMemo, useCallback } from "react";
import { FaEye, FaLock, FaLockOpen, FaTimes, FaPlus } from "react-icons/fa";

const DAYS_IN_YEAR = 365.25;

const calculateMonthlyInterest = (principal, rate, startDate, closedDate, payments = []) => {
    if (!principal || !rate || !startDate) return { interest: 0, total: principal, principalRemaining: principal, daysHeld: 0, totalPrincipalPaid: 0, totalInterestPaid: 0, payments: [] };

    const start = new Date(startDate);
    const end = closedDate ? new Date(closedDate) : new Date();

    const timeDiff = end.getTime() - start.getTime();
    const daysHeld = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));

    const monthlyRateDecimal = rate / 100 / 12;
    const avgDaysInMonth = DAYS_IN_YEAR / 12;

    let interestAccumulated = 0;
    let principalRemaining = principal;
    let totalInterestPaid = 0; 

    const sortedPayments = [...payments].sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentCalcDate = start;
    const calculationPoints = [...sortedPayments.map(p => new Date(p.date)), end]
        .filter((date, index, self) => date >= start && self.findIndex(d => d.getTime() === date.getTime()) === index)
        .sort((a, b) => a - b);


    calculationPoints.forEach(paymentDate => {
        let timePeriodDays = Math.max(0, Math.floor((paymentDate.getTime() - currentCalcDate.getTime()) / (1000 * 3600 * 24)));

        if (timePeriodDays > 0) {
             const periodInterest = principalRemaining * monthlyRateDecimal * (timePeriodDays / avgDaysInMonth);
             interestAccumulated += periodInterest;
        }


        const paymentsOnThisDate = sortedPayments.filter(p => new Date(p.date).toDateString() === paymentDate.toDateString());

        paymentsOnThisDate.forEach(payment => {
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
        daysHeld: daysHeld,
        totalPrincipalPaid: Math.round(finalTotalPrincipalPaid),
        totalInterestPaid: Math.round(totalInterestPaid), 
        payments: sortedPayments,
    };
};

function ViewDetailsModal({ girvi, onClose, onUpdate }) {
    const [currentInterestRate, setCurrentInterestRate] = useState(girvi.interestRate || 10);

    const { total, interest, principalRemaining, daysHeld } = useMemo(() => 
        calculateMonthlyInterest(
            girvi.amount, 
            currentInterestRate, 
            girvi.startDate, 
            girvi.status === 'Closed' ? girvi.closedDate : null, 
            girvi.payments
        )
    , [girvi.amount, currentInterestRate, girvi.startDate, girvi.status, girvi.closedDate, girvi.payments]);

    const handleStatusChange = (newStatus) => {
        let date = null;
        let time = null;
        if (newStatus === 'Closed') {
            date = new Date().toISOString().split('T')[0];
            time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        onUpdate(girvi.girviNumber, { 
            status: newStatus, 
            closedDate: date, 
            closedTime: time,
            interestRate: currentInterestRate 
        });
        if (newStatus === 'Active') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg md:max-w-xl shadow-2xl overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl sm:text-2xl font-bold">Girvi Details: #{girvi.girviNumber}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><FaTimes /></button>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-700">💍 Item Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
                    <p><strong>Girvi Number:</strong></p> <p>{girvi.girviNumber}</p>
                    <p><strong>Item:</strong></p> <p className="truncate">{girvi.item}</p>
                    <p><strong>Purity:</strong></p> <p>{girvi.purity} Karat</p>
                    <p><strong>Weight:</strong></p> <p>{girvi.weight} g</p>
                    <p><strong>Locker ID:</strong></p> <p>{girvi.lockerId || 'N/A'}</p> 
                </div>

                <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-3 text-yellow-600">💰 Financial Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-gray-700 mb-4 bg-yellow-50 p-3 rounded-lg">
                    <p><strong>Customer:</strong></p> <p className="truncate">{girvi.name}</p>
                    <p><strong>Address:</strong></p> <p className="truncate">{girvi.Address}</p>
                    <p><strong>Original Loan:</strong></p> <p className="font-bold">₹{girvi.amount.toLocaleString('en-IN')}</p>
                    <p><strong>Start Date:</strong></p> <p>{girvi.startDate}</p>
                    <p><strong>Days Held:</strong></p> <p>{daysHeld} days</p>

                    <label htmlFor="interestRate" className="font-bold self-center">Interest Rate (%/Yr):</label> 
                    <input
                        id="interestRate"
                        type="number"
                        min="0"
                        value={currentInterestRate}
                        onChange={(e) => setCurrentInterestRate(Number(e.target.value))}
                        className="p-1 border rounded w-full text-lg font-mono text-center"
                        disabled={girvi.status === 'Closed'}
                    />

                    <div className="col-span-1 sm:col-span-2 h-px bg-gray-200 my-2"></div>

                    <p className="text-md sm:text-lg font-bold text-red-600">Remaining Principal:</p>
                    <p className="text-md sm:text-lg font-bold text-red-600">₹{principalRemaining.toLocaleString('en-IN')}</p>

                    <p className="text-md sm:text-lg font-bold text-yellow-700">Accumulated Interest:</p>
                    <p className="text-md sm:text-lg font-bold text-yellow-700">₹{interest.toLocaleString('en-IN')}</p>

                    <p className="text-lg sm:text-xl font-extrabold text-blue-800 pt-2 border-t border-blue-200">Total Payable:</p>
                    <p className="text-lg sm:text-xl font-extrabold text-blue-800 pt-2 border-t border-blue-200">₹{total.toLocaleString('en-IN')}</p>

                    {girvi.status === 'Closed' && (
                        <>
                            <p className="text-sm"><strong>Closed Date/Time:</strong></p> <p className="text-sm">{girvi.closedDate} @ {girvi.closedTime}</p>
                        </>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t gap-3">
                    {girvi.status === "Active" ? (
                        <button
                            onClick={() => handleStatusChange('Closed')}
                            className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-md font-semibold shadow hover:bg-red-700 transition"
                        >
                            <FaLock /> Final Close Deal
                        </button>
                    ) : (
                        <button
                            onClick={() => handleStatusChange('Active')}
                            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-md font-semibold shadow hover:bg-green-700 transition"
                        >
                            <FaLockOpen /> Re-Open Deal
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---

function GirviRecordsTable({ girviList, search, onViewDetails }) {
    const filteredList = useMemo(() => girviList
        .filter((g) =>
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.girviNumber.toLowerCase().includes(search.toLowerCase())
        ), [girviList, search]);

    return (
        <div className="overflow-x-auto shadow rounded-xl mt-6">
            <h2 className="text-xl sm:text-2xl font-bold p-4 bg-white border-b">Detailed Records List ({filteredList.length} Entries)</h2>
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
                    {filteredList.map((g) => (
                        <tr key={g.girviNumber} className="border-b hover:bg-gray-50 transition duration-150">
                            <td className="p-3 font-semibold text-blue-600">{g.girviNumber}</td>
                            <td className="p-3 whitespace-nowrap">{g.name}</td>
                            <td className="p-3 hidden sm:table-cell whitespace-nowrap">{g.contactNumber || 'N/A'}</td>
                            <td className="p-3 hidden md:table-cell max-w-[150px] truncate">{g.idProofType || 'N/A'}: {g.idProofNumber || 'N/A'}</td>
                            <td className="p-3 font-medium whitespace-nowrap">₹{g.amount.toLocaleString('en-IN')}</td>
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
            {filteredList.length === 0 && (
                 <div className="text-center p-4 text-gray-500 italic">No records found matching your search.</div>
            )}
        </div>
    );
}

export default function GirviPage() {
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedGirvi, setSelectedGirvi] = useState(null); 
    
    const initialGirviList = [
        { name: "Ramesh Kumar", item: "Gold Chain (22g)", amount: 18000, date: "2025-01-01", status: "Active", startDate: "2025-01-01", interestRate: 10, closedDate: null, closedTime: null, purity: '22', weight: '22', girviNumber: '100', contactNumber: '9876543210', idProofType: 'Aadhaar', idProofNumber: '123456789012', payments: [], lockerId: 'L-A01', remark: 'Good condition' },
        { name: "Suresh Yadav", item: "Ring (5g)", amount: 4500, date: "2025-02-10", status: "Active", startDate: "2025-02-10", interestRate: 12, closedDate: null, closedTime: null, purity: '18', weight: '5', girviNumber: '101', contactNumber: '9988776655', idProofType: 'PAN', idProofNumber: 'ABCDE1234F', payments: [{date: "2025-03-15", amount: 1000, type: 'Partial'}], lockerId: 'L-A02', remark: '' },
        { name: "Neha Sharma", item: "Bracelet (12g)", amount: 13000, date: "2025-03-18", status: "Closed", startDate: "2025-03-18", interestRate: 9, closedDate: "2025-05-20", closedTime: "11:30 AM", purity: '20', weight: '12', girviNumber: '102', contactNumber: '8765432109', idProofType: 'Voter ID', idProofNumber: 'XYZ9876543', payments: [], lockerId: 'L-B01', remark: 'Closed and returned' },
        { name: "Aman Gupta", item: "Pendant (8g)", amount: 6200, date: "2025-01-20", status: "Active", startDate: "2025-01-20", interestRate: 11, closedDate: null, closedTime: null, purity: '22', weight: '8', girviNumber: '103', contactNumber: '9000111222', idProofType: 'Aadhaar', idProofNumber: '246813579024', payments: [{date: "2025-04-01", amount: 500, type: 'Partial'}, {date: "2025-05-01", amount: 500, type: 'Partial'}], lockerId: 'L-A03', remark: 'Partial payments received' },
        { name: "Vikas Singh", item: "Nosepin (2g)", amount: 1500, date: "2025-01-12", status: "Closed", startDate: "2025-01-12", interestRate: 15, closedDate: "2025-04-15", closedTime: "04:45 PM", purity: '24', weight: '2', girviNumber: '104', contactNumber: '8080808080', idProofType: 'PAN', idProofNumber: 'FGHIJ5678K', payments: [], lockerId: 'L-B02', remark: '' },
        { name: "Lavkesh Kumar", item: "Gold Coin (10g)", amount: 10000, date: "2025-04-01", status: "Active", startDate: "2025-04-01", interestRate: 10, closedDate: null, closedTime: null, purity: '24', weight: '10', girviNumber: '105', contactNumber: '7654321098', idProofType: 'Aadhaar', idProofNumber: '135792468013', payments: [], lockerId: 'L-A04', remark: 'New client' },
        { name: "Pooja Mishra", item: "Ear Rings (7g)", amount: 7000, date: "2025-03-10", status: "Active", startDate: "2025-03-10", interestRate: 12, closedDate: null, closedTime: null, purity: '20', weight: '7', girviNumber: '106', contactNumber: '9797979797', idProofType: 'Voter ID', idProofNumber: 'PQR0101010', payments: [], lockerId: 'L-B03', remark: '' },
        { name: "Sanjay Patel", item: "Bangles (30g)", amount: 25000, date: "2025-02-28", status: "Closed", startDate: "2025-02-28", interestRate: 8, closedDate: "2025-06-01", closedTime: "01:00 PM", purity: '22', weight: '30', girviNumber: '107', contactNumber: '9456123789', idProofType: 'PAN', idProofNumber: 'LMNOP0001Z', payments: [], lockerId: 'L-A05', remark: 'High value item' },
        { name: "Aisha Khan", item: "Chain (15g)", amount: 15000, date: "2025-03-05", status: "Active", startDate: "2025-03-05", interestRate: 10, closedDate: null, closedTime: null, purity: '22', weight: '15', girviNumber: '108', contactNumber: '8123456789', idProofType: 'Aadhaar', idProofNumber: '987654321098', payments: [], lockerId: 'L-B04', remark: '' },
        { name: "Varun Raj", item: "Ring (6g)", amount: 5000, date: "2025-01-25", status: "Active", startDate: "2025-01-25", interestRate: 11, closedDate: null, closedTime: null, purity: '18', weight: '6', girviNumber: '109', contactNumber: '9123450987', idProofType: 'Voter ID', idProofNumber: 'ASDFG54321', payments: [], lockerId: 'L-A06', remark: '' }
    ];

    const [girviListState, setGirviListState] = useState(initialGirviList);

    const handleFormSubmit = (formData) => {
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
            purity: formData.purity || 'N/A', 
            weight: formData.weight || 'N/A', 
            girviNumber: formData.girviNumber,
            contactNumber: formData.contactNumber, 
            idProofType: formData.idProofType,
            idProofNumber: formData.idProofNumber,
            lockerId: formData.lockerId || '',
            remark: formData.remark || '',
            Address: formData.Address||'',
        };
        setGirviListState([...girviListState, newGirvi]);
        setShowForm(false);
    };

    const handleUpdate = useCallback((girviNumber, updates) => {
        setGirviListState(prevList =>
            prevList.map(g =>
                g.girviNumber === girviNumber
                    ? { ...g, ...updates }
                    : g
            )
        );
        setSelectedGirvi(prevGirvi => {
            if (prevGirvi && prevGirvi.girviNumber === girviNumber) {
                return { ...prevGirvi, ...updates };
            }
            return prevGirvi;
        });
    }, []);

    const handleViewDetails = (girvi) => {
        setSelectedGirvi(girvi);
    };

    const closeModal = () => {
        setSelectedGirvi(null);
    };

    return (
        <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Girvi Management</h1>

            <div className="flex flex-col md:flex-row justify-between mb-5 gap-3">
                <input
                    type="text"
                    placeholder="Search by Name or Girvi Number..."
                    className="border p-2 rounded w-full md:w-1/2 shadow-sm"
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button
                    onClick={() => setShowForm(true)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-md sm:text-lg shadow hover:bg-yellow-700 transition w-full md:w-auto"
                >
                    <FaPlus /> Add New Record
                </button>
            </div>
            
            <GirviRecordsTable 
                girviList={girviListState} 
                search={search} 
                onViewDetails={handleViewDetails} 
            />
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Add New Girvi Record</h2>

                        <GirviForm onSubmit={handleFormSubmit} />

                        <button
                            onClick={() => setShowForm(false)}
                            className="mt-4 mb-8 bg-red-500 text-white p-2 w-full rounded-lg hover:bg-red-600 transition"
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
        date: new Date().toISOString().split('T')[0],
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
        Address:"",
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
            Address:form.Address,
        });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <input name="name" onChange={update} className="p-2 border rounded" placeholder="Customer Name" value={form.name} />
            <input name="contactNumber" onChange={update} className="p-2 border rounded" placeholder="Contact Number" type="tel" value={form.contactNumber} />

            <select name="idProofType" onChange={update} className="p-2 border rounded" value={form.idProofType}>
                <option value="Select ID Proof">Select ID Proof</option>
                <option value="PAN">PAN</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Voter ID">Voter ID</option>
             
            </select>

            <input name="idProofNumber" onChange={update} className="p-2 border rounded" placeholder="ID Proof Number" value={form.idProofNumber} />

            <textarea name="itemDescription" onChange={update} className="p-2 border rounded col-span-1 sm:col-span-2" placeholder="Item Description" rows="1" value={form.itemDescription} ></textarea>

            <input name="purity" onChange={update} className="p-2 border rounded" placeholder="Purity (Karat)" value={form.purity} />
            <input name="weight" onChange={update} className="p-2 border rounded" placeholder="Weight (g)" value={form.weight} />

            <input name="marketValue" type="number" onChange={update} className="p-2 border rounded" placeholder="Market Value (₹)" value={form.marketValue} />
            <input name="amount" type="number" onChange={update} className="p-2 border rounded" placeholder="Amount Given (₹) *" value={form.amount} />

            <input name="interestRate" type="number" onChange={update} className="p-2 border rounded" placeholder="Interest Rate (%)" defaultValue="10" value={form.interestRate} />
            
            <input name="girviNumber" onChange={update} className="p-2 border rounded" placeholder="Girvi Number (Mandatory) *" value={form.girviNumber} />

            <input name="date" type="date" onChange={update} className="p-2 border rounded" value={form.date} />

            <select className="p-2 border rounded col-span-1 sm:col-span-2">
                <option>Select</option><option>New</option><option>Old</option><option>Good Condition</option><option>Scratched</option>
            </select>
            <textarea name="lockerId" onChange={update} className="p-2 border rounded col-span-1 sm:col-span-2" placeholder="Locker ID Of Item" rows="1" value={form.lockerId}></textarea>
            <textarea name="remark" onChange={update} className="p-2 border rounded col-span-1 sm:col-span-2" placeholder="Remark" rows="1" value={form.remark}></textarea>
            <textarea name="Address" onChange={update} className="p-2 border rounded col-span-1 sm:col-span-2" placeholder="Address" rows="1" value={form.Address}></textarea>

            <button onClick={submit} className="bg-yellow-600 text-white p-3 rounded-xl mt-3 col-span-1 sm:col-span-2 hover:bg-yellow-700 transition">Submit Record</button>
        </div>
    );
}
