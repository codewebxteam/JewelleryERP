import React, { useState, useMemo, useEffect, useRef } from "react";
import { stockData, invoiceHistory } from "../data/dummyData.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../assets/logo.png";
import {
  Plus,
  Trash2,
  Search,
  X,
  Download,
  Printer,
  Eye,
  ChevronDown,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

// --- Configuration ---
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

// --- Helpers ---
const formatCurrency = (amount) =>
  `Rs. ${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const numberToWords = (num) => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  if ((num = num.toString()).length > 9) return "Overflow";
  const n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  let str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred "
      : "";
  str +=
    n[5] != 0
      ? (str !== "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
      : "";
  return str + "Only";
};

const Billing = () => {
  // --- Main State ---
  const [invoices, setInvoices] = useState(invoiceHistory);
  const [currentStock, setCurrentStock] = useState(stockData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);

  // --- Invoice Form State ---
  const [customer, setCustomer] = useState({
    name: "",
    address: "",
    contact: "",
  });
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [newItems, setNewItems] = useState([]);
  const [oldItems, setOldItems] = useState([]);
  const [showOldItems, setShowOldItems] = useState(false);
  const [discount, setDiscount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");

  // --- New Item Input State ---
  const [itemSearch, setItemSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  const [newItemWeight, setNewItemWeight] = useState("");
  const [newItemRate, setNewItemRate] = useState("");
  const [newItemMakingCharge, setNewItemMakingCharge] = useState("");
  const [newItemHsn, setNewItemHsn] = useState("7113");
  const [newItemHuc, setNewItemHuc] = useState("");

  // --- Old Item Exchange State ---
  const [oldItemName, setOldItemName] = useState("");
  const [oldItemWeight, setOldItemWeight] = useState("");
  const [oldItemRate, setOldItemRate] = useState("");

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter stock based on search
  const availableStock = useMemo(() => {
    if (!itemSearch) return [];
    return currentStock.filter(
      (item) =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) &&
        item.stock > 0
    );
  }, [itemSearch, currentStock]);

  // --- Financial Calculations ---
  const newItemsTotal = useMemo(
    () => newItems.reduce((total, item) => total + item.amount, 0),
    [newItems]
  );
  // Ensure this variable name matches what we use in handleSaveInvoice
  const oldItemsTotal = useMemo(
    () => oldItems.reduce((total, item) => total + item.amount, 0),
    [oldItems]
  );

  const subTotal = useMemo(() => {
    const val = newItemsTotal - oldItemsTotal;
    return val > 0 ? val : 0;
  }, [newItemsTotal, oldItemsTotal]);

  const taxableAmount = useMemo(() => {
    const val = subTotal - Number(discount || 0);
    return val > 0 ? val : 0;
  }, [subTotal, discount]);

  const cgst = useMemo(() => taxableAmount * CGST_RATE, [taxableAmount]);
  const sgst = useMemo(() => taxableAmount * SGST_RATE, [taxableAmount]);
  const grandTotal = useMemo(
    () => Math.round(taxableAmount + cgst + sgst),
    [taxableAmount, cgst, sgst]
  );

  const balanceDue = useMemo(() => {
    const received = Number(receivedAmount || 0);
    const due = grandTotal - received;
    return due > 0 ? due : 0;
  }, [grandTotal, receivedAmount]);

  // --- Handlers ---
  const handleSearchChange = (e) => {
    setItemSearch(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectStockItem = (item) => {
    setSelectedStockItem(item);
    setItemSearch(item.name);
    setNewItemRate(item.price || "");
    setShowDropdown(false);
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (
      !selectedStockItem ||
      !newItemWeight ||
      !newItemRate ||
      !newItemMakingCharge
    ) {
      alert("Please fill all mandatory product fields.");
      return;
    }
    if (Number(newItemWeight) > selectedStockItem.stock) {
      alert(`Insufficient Stock! Only ${selectedStockItem.stock}g available.`);
      return;
    }

    const weight = Number(newItemWeight);
    const rate = Number(newItemRate);
    const making = Number(newItemMakingCharge);
    const amount = (rate + making) * weight;

    const newItem = {
      ...selectedStockItem,
      weight,
      rate,
      makingCharge: making,
      hsn: newItemHsn,
      huc: newItemHuc,
      amount,
    };

    setNewItems([...newItems, newItem]);
    setSelectedStockItem(null);
    setItemSearch("");
    setNewItemWeight("");
    setNewItemRate("");
    setNewItemMakingCharge("");
    setNewItemHsn("7113");
    setNewItemHuc("");
    setShowDropdown(false);
  };

  const handleRemoveNewItem = (index) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const handleAddOldItem = (e) => {
    e.preventDefault();
    if (!oldItemName || !oldItemWeight || !oldItemRate) {
      alert("Please fill all exchange item details.");
      return;
    }
    setOldItems([
      ...oldItems,
      {
        name: oldItemName,
        weight: Number(oldItemWeight),
        rate: Number(oldItemRate),
        amount: Number(oldItemWeight) * Number(oldItemRate),
      },
    ]);
    setOldItemName("");
    setOldItemWeight("");
    setOldItemRate("");
  };

  const handleRemoveOldItem = (index) => {
    setOldItems(oldItems.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = () => {
    if (!customer.name || newItems.length === 0) {
      alert("Customer Name and at least one Item are required.");
      return;
    }
    const nextId = invoices.length
      ? Math.max(...invoices.map((inv) => parseInt(inv.id.split("-")[1]))) + 1
      : 1001;

    const newInvoice = {
      id: `INV-${nextId}`,
      date: new Date().toISOString().split("T")[0],
      customer,
      paymentMode,
      newItems,
      oldItems,
      discount: Number(discount || 0),
      receivedAmount: Number(receivedAmount || 0),
      balanceDue,
      subTotal,
      oldItemTotal: oldItemsTotal, // FIXED: This matches the variable name 'oldItemsTotal' defined above
      taxableAmount,
      sgst,
      cgst,
      grandTotal,
    };
    setInvoices([newInvoice, ...invoices]);

    const updatedStock = [...currentStock];
    newItems.forEach((item) => {
      const idx = updatedStock.findIndex((s) => s.id === item.id);
      if (idx !== -1) updatedStock[idx].stock -= item.weight;
    });
    setCurrentStock(updatedStock);

    setIsModalOpen(false);
    setCustomer({ name: "", address: "", contact: "" });
    setNewItems([]);
    setOldItems([]);
    setShowOldItems(false);
    setDiscount("");
    setReceivedAmount("");
  };

  // --- GENERATE PDF ---
  const generatePDF = async (invoice, action = "view") => {
    setLoadingInvoiceId(invoice.id);

    try {
      const doc = new jsPDF();

      // Image Loader with White Background fix
      const loadImage = (src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = src;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.95));
          };
          img.onerror = () => resolve(null);
        });
      };

      const logoData = await loadImage(logoImg);
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const goldColor = [218, 165, 32];
      const lightGold = [253, 245, 230];
      const darkText = [30, 30, 30];

      // --- 1. HEADER ---
      doc.setFillColor(...goldColor);
      doc.rect(0, 0, pageWidth, 3, "F");

      // FIXED: Moved Invoice text up to prevent overlap
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...goldColor);
      doc.text("TAX INVOICE", pageWidth - 15, 12, { align: "right" }); // Top position

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`# ${invoice.id}`, pageWidth - 15, 18, { align: "right" });

      if (logoData) {
        doc.addImage(logoData, "JPEG", 10, 8, 30, 30);
      }

      // FIXED: Shop Name moved down to avoid overlap with Invoice Text
      doc.setFont("times", "bold");
      doc.setFontSize(21);
      doc.setTextColor(...goldColor);
      doc.text("SHREE LAXMI JEWELLERS & SONS", 45, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      doc.text("Exclusive Gold & Diamond Jewellery", 45, 28);
      doc.text("123, Main Road, City Center - 400001", 45, 33);
      doc.text("Ph: 98765 43210 | GSTIN: 27ABCDE1234F1Z5", 45, 38);

      doc.setDrawColor(220);
      doc.line(10, 45, pageWidth - 10, 45);

      // --- 2. BILLING INFO ---
      let yPos = 55;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...goldColor);
      doc.text("BILL TO:", 14, yPos);

      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(invoice.customer.name.toUpperCase(), 14, yPos + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(invoice.customer.address || "N/A", 14, yPos + 12);
      doc.text(`Ph: ${invoice.customer.contact}`, 14, yPos + 17);

      const rightColX = 165;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...goldColor);
      doc.text("DETAILS:", rightColX, yPos);

      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      doc.text("Date:", rightColX, yPos + 6);
      doc.text(
        new Date(invoice.date).toLocaleDateString("en-GB"),
        pageWidth - 15,
        yPos + 6,
        { align: "right" }
      );

      doc.text("Mode:", rightColX, yPos + 12);
      doc.text(invoice.paymentMode, pageWidth - 15, yPos + 12, {
        align: "right",
      });

      // --- 3. TABLE ---
      yPos += 25;
      autoTable(doc, {
        startY: yPos,
        head: [
          [
            "#",
            "Item Description",
            "HSN",
            "HUC",
            "Wt(g)",
            "Rate",
            "Making",
            "Total",
          ],
        ],
        body: invoice.newItems.map((item, i) => [
          i + 1,
          item.name,
          item.hsn,
          item.huc,
          item.weight.toFixed(2),
          item.rate,
          item.makingCharge,
          formatCurrency(item.amount),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: goldColor,
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center" },
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
          7: { halign: "right", fontStyle: "bold" },
        },
        styles: { lineColor: [220, 220, 220], lineWidth: 0.1, fontSize: 9 },
      });

      let finalY = doc.lastAutoTable.finalY;

      // --- 4. EXCHANGE ---
      if (invoice.oldItems.length > 0) {
        finalY += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...goldColor);
        doc.text("OLD GOLD EXCHANGE (LESS)", 14, finalY);

        autoTable(doc, {
          startY: finalY + 2,
          head: [["Description", "Weight (g)", "Rate / g", "Amount"]],
          body: invoice.oldItems.map((item) => [
            item.name,
            item.weight.toFixed(2),
            item.rate,
            formatCurrency(item.amount),
          ]),
          theme: "plain",
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: 0,
            halign: "right",
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { halign: "left" },
            1: { halign: "right" },
            2: { halign: "right" },
            3: { halign: "right", textColor: [200, 0, 0] },
          },
        });
        finalY = doc.lastAutoTable.finalY;
      }

      // --- 5. TOTALS ---
      if (pageHeight - finalY < 85) {
        doc.addPage();
        finalY = 20;
      }

      finalY += 10;

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Amount in Words:", 14, finalY + 5);
      doc.setFont("times", "italic");
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(numberToWords(Math.round(invoice.grandTotal)), 14, finalY + 11, {
        maxWidth: 70,
      });

      // FIXED: Box width increased so numbers don't overflow
      const boxWidth = 105;
      const summaryStartX = pageWidth - 15 - boxWidth;
      const valueX = pageWidth - 20;
      const lineHeight = 6.5;

      doc.setDrawColor(230);
      doc.setFillColor(...lightGold);
      doc.roundedRect(summaryStartX, finalY - 2, boxWidth, 75, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text("Subtotal:", summaryStartX + 5, finalY + 5);
      doc.text(formatCurrency(invoice.subTotal), valueX, finalY + 5, {
        align: "right",
      });

      if (invoice.discount > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text("Discount:", summaryStartX + 5, finalY + 5 + lineHeight);
        doc.text(
          `- ${formatCurrency(invoice.discount)}`,
          valueX,
          finalY + 5 + lineHeight,
          { align: "right" }
        );
        doc.setTextColor(0);
      }

      doc.text("CGST (9%):", summaryStartX + 5, finalY + 5 + lineHeight * 2);
      doc.text(
        formatCurrency(invoice.cgst),
        valueX,
        finalY + 5 + lineHeight * 2,
        { align: "right" }
      );

      doc.text("SGST (9%):", summaryStartX + 5, finalY + 5 + lineHeight * 3);
      doc.text(
        formatCurrency(invoice.sgst),
        valueX,
        finalY + 5 + lineHeight * 3,
        { align: "right" }
      );

      doc.setDrawColor(200);
      doc.line(
        summaryStartX + 5,
        finalY + 5 + lineHeight * 4,
        valueX,
        finalY + 5 + lineHeight * 4
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...goldColor);
      doc.text(
        "GRAND TOTAL",
        summaryStartX + 5,
        finalY + 5 + lineHeight * 5 + 2
      );
      doc.text(
        formatCurrency(invoice.grandTotal),
        valueX,
        finalY + 5 + lineHeight * 5 + 2,
        { align: "right" }
      );

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      doc.text("Received:", summaryStartX + 5, finalY + 5 + lineHeight * 6 + 4);
      doc.text(
        formatCurrency(invoice.receivedAmount),
        valueX,
        finalY + 5 + lineHeight * 6 + 4,
        { align: "right" }
      );

      doc.setFont("helvetica", "bold");
      doc.text(
        "Balance Due:",
        summaryStartX + 5,
        finalY + 5 + lineHeight * 7 + 6
      );
      const balanceColor = invoice.balanceDue > 0 ? [200, 0, 0] : [0, 128, 0];
      doc.setTextColor(...balanceColor);
      doc.text(
        formatCurrency(invoice.balanceDue),
        valueX,
        finalY + 5 + lineHeight * 7 + 6,
        { align: "right" }
      );

      // --- FOOTER ---
      const footerY = pageHeight - 30;
      doc.setDrawColor(200);
      doc.line(14, footerY, pageWidth - 14, footerY);

      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.setFont("helvetica", "normal");
      doc.text(
        "TERMS: 1. Goods once sold will not be taken back. 2. Subject to local jurisdiction.",
        14,
        footerY + 5
      );

      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.text("Authorized Signatory", pageWidth - 15, pageHeight - 10, {
        align: "right",
      });

      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (action === "download") {
        doc.save(`Invoice_${invoice.id}.pdf`);
      } else {
        window.open(pdfUrl, "_blank");
      }
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF Error. Check Console.");
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  // --- Render UI ---
  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const btnPrimary =
    "px-6 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold rounded-lg shadow hover:shadow-lg transition-all flex items-center justify-center";
  const inputStyle =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white";
  const labelStyle =
    "text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block";

  return (
    <div className="space-y-6 font-sans text-gray-800 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Billing & Invoices
          </h2>
          <p className="text-gray-500 text-sm">
            Create professional invoices with gold stock management.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`w-full md:w-auto ${btnPrimary}`}
        >
          <Plus size={20} className="mr-2" /> Create Invoice
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <Search className="text-gray-400 mr-3" size={20} />
        <input
          type="text"
          placeholder="Search Invoice ID or Customer Name..."
          className="flex-1 outline-none text-gray-700 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-yellow-800 uppercase whitespace-nowrap">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-yellow-800 uppercase whitespace-nowrap">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-yellow-800 uppercase whitespace-nowrap">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-yellow-800 uppercase whitespace-nowrap">
                  Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-yellow-800 uppercase whitespace-nowrap">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-yellow-800 uppercase whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInvoices.slice(0, 10).map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    <div className="font-bold">{invoice.customer.name}</div>
                    <div className="text-xs text-gray-500">{invoice.date}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800 whitespace-nowrap">
                    {formatCurrency(invoice.grandTotal)}
                  </td>
                  <td className="px-6 py-4 text-green-600 whitespace-nowrap">
                    {formatCurrency(invoice.receivedAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.balanceDue > 0 ? (
                      <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full flex items-center w-max">
                        <AlertCircle size={12} className="mr-1" /> Baaki:{" "}
                        {formatCurrency(invoice.balanceDue)}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full flex items-center w-max">
                        <CheckCircle size={12} className="mr-1" /> Paid
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap flex justify-end gap-2">
                    <button
                      onClick={() => generatePDF(invoice, "view")}
                      disabled={loadingInvoiceId === invoice.id}
                      className="text-gray-500 hover:text-blue-600 p-2"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => generatePDF(invoice, "print")}
                      disabled={loadingInvoiceId === invoice.id}
                      className="text-gray-500 hover:text-gray-800 p-2"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => generatePDF(invoice, "download")}
                      disabled={loadingInvoiceId === invoice.id}
                      className="text-gray-500 hover:text-yellow-600 p-2"
                    >
                      {loadingInvoiceId === invoice.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Download size={18} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-2 md:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-white p-4 md:p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                  New Invoice
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/50">
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                  Customer Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Customer Name</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={customer.name}
                      onChange={(e) =>
                        setCustomer({ ...customer, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Phone Number</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={customer.contact}
                      onChange={(e) =>
                        setCustomer({ ...customer, contact: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Address</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer({ ...customer, address: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Payment Mode</label>
                    <div className="relative">
                      <select
                        className={`${inputStyle} appearance-none`}
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                      >
                        <option>Cash</option>
                        <option>UPI</option>
                        <option>Card</option>
                        <option>Bank Transfer</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                  Add Products
                </h4>
                <form
                  onSubmit={handleAddNewItem}
                  className="grid grid-cols-2 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div
                    className="col-span-2 md:col-span-3 relative"
                    ref={dropdownRef}
                  >
                    <label className={labelStyle}>Product Name</label>
                    <input
                      type="text"
                      className={inputStyle}
                      placeholder="Search Stock..."
                      value={itemSearch}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {showDropdown && availableStock.length > 0 && (
                      <div className="absolute top-full left-0 z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                        {availableStock.map((item) => (
                          <div
                            key={item.id}
                            className="px-4 py-2 hover:bg-yellow-50 cursor-pointer text-sm border-b last:border-0"
                            onClick={() => handleSelectStockItem(item)}
                          >
                            {item.name} ({item.stock}g)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <label className={labelStyle}>HSN Code</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={newItemHsn}
                      onChange={(e) => setNewItemHsn(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelStyle}>HUC ID</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={newItemHuc}
                      onChange={(e) => setNewItemHuc(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={labelStyle}>Weight (g)</label>
                    <input
                      type="number"
                      className={inputStyle}
                      value={newItemWeight}
                      onChange={(e) => setNewItemWeight(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className={labelStyle}>Rate/g</label>
                    <input
                      type="number"
                      className={inputStyle}
                      value={newItemRate}
                      onChange={(e) => setNewItemRate(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <label className={labelStyle}>Making/g</label>
                    <input
                      type="number"
                      className={inputStyle}
                      value={newItemMakingCharge}
                      onChange={(e) => setNewItemMakingCharge(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex justify-center shadow-md"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </form>
                {newItems.length > 0 && (
                  <div className="mt-4 border rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-right">Wt(g)</th>
                          <th className="px-4 py-2 text-right">Rate</th>
                          <th className="px-4 py-2 text-right">Making</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {newItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-medium">
                              {item.name}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.weight}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.rate}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.makingCharge}
                            </td>
                            <td className="px-4 py-2 text-right font-bold">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => handleRemoveNewItem(idx)}
                                className="text-red-500"
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
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <div
                  className="flex items-center mb-4 cursor-pointer"
                  onClick={() => setShowOldItems(!showOldItems)}
                >
                  {showOldItems ? (
                    <CheckCircle className="text-green-500 mr-2" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded mr-2"></div>
                  )}
                  <span className="font-bold text-gray-700">
                    Include Old Gold Exchange (Less)
                  </span>
                </div>
                {showOldItems && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <form
                      onSubmit={handleAddOldItem}
                      className="flex flex-col md:flex-row gap-4 items-end"
                    >
                      <div className="flex-1 w-full">
                        <label className={labelStyle}>Item Name</label>
                        <input
                          type="text"
                          className={inputStyle}
                          value={oldItemName}
                          onChange={(e) => setOldItemName(e.target.value)}
                        />
                      </div>
                      <div className="w-full md:w-24">
                        <label className={labelStyle}>Wt(g)</label>
                        <input
                          type="number"
                          className={inputStyle}
                          value={oldItemWeight}
                          onChange={(e) => setOldItemWeight(e.target.value)}
                        />
                      </div>
                      <div className="w-full md:w-32">
                        <label className={labelStyle}>Rate/g</label>
                        <input
                          type="number"
                          className={inputStyle}
                          value={oldItemRate}
                          onChange={(e) => setOldItemRate(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-gray-700 text-white p-2 rounded-lg w-full md:w-auto flex justify-center"
                      >
                        <Plus size={20} />
                      </button>
                    </form>
                    {oldItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center mt-2 p-2 bg-white rounded border border-gray-200 text-sm"
                      >
                        <span>
                          {item.name} ({item.weight}g @ {item.rate})
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-red-600">
                            - {formatCurrency(item.amount)}
                          </span>
                          <button
                            onClick={() => handleRemoveOldItem(idx)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 border-t">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Discount (Rs.)</label>
                    <input
                      type="number"
                      className={inputStyle}
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Received Amount (Rs.)</label>
                    <input
                      type="number"
                      className={`${inputStyle} border-green-400 bg-green-50`}
                      placeholder="0"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3 space-y-2 text-right">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal:</span>{" "}
                    <span>{formatCurrency(subTotal)}</span>
                  </div>
                  {Number(discount) > 0 && (
                    <div className="flex justify-between text-red-500 text-sm">
                      <span>Discount:</span>{" "}
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Tax (18%):</span>{" "}
                    <span>{formatCurrency(cgst + sgst)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-1"></div>
                  <div className="flex justify-between text-xl font-bold text-gray-800">
                    <span>Grand Total:</span>{" "}
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                  <div
                    className={`flex justify-between items-center p-3 rounded-lg mt-2 ${
                      balanceDue > 0
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    <span className="font-bold text-sm">
                      {balanceDue > 0 ? "Balance Due (Baaki):" : "Fully Paid:"}
                    </span>
                    <span className="font-bold text-lg">
                      {formatCurrency(balanceDue > 0 ? balanceDue : 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-4 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInvoice}
                  className={`${btnPrimary} px-8 text-lg shadow-xl`}
                >
                  Save & Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
