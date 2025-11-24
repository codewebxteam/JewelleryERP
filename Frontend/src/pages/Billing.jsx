import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Pencil,
} from "lucide-react";

// --- Configuration ---
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

// --- Helpers ---
const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
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
    "Eighteen",
    "Nineteen",
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
  // Load invoices from localStorage
  const loadInvoices = () => {
    const stored = localStorage.getItem("invoices");
    return stored ? JSON.parse(stored) : [];
  };

  const [invoices, setInvoices] = useState(loadInvoices());

  // --- Main State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);

  // NEW: Track invoice being edited
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  // Load stock from localStorage (for suggestions + auto-fill)
  const [stockInventory, setStockInventory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jewellery_stock");
      setStockInventory(stored ? JSON.parse(stored) : []);
    } catch {
      setStockInventory([]);
    }
  }, []); // jab modal open hoga, fresh stock load hoga


  // Save invoices to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem("invoices", JSON.stringify(invoices));
  }, [invoices]);



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
  const [itemName, setItemName] = useState("");
  const [itemHsn, setItemHsn] = useState("7113");
  const [itemHuc, setItemHuc] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemRate, setItemRate] = useState("");
  const [itemMaking, setItemMaking] = useState("");

  // --- Old Item Exchange State ---
  const [oldItemName, setOldItemName] = useState("");
  const [oldItemWeight, setOldItemWeight] = useState("");
  const [oldItemRate, setOldItemRate] = useState("");

  // --- Searchable product suggestions ---
  const [productQuery, setProductQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  useEffect(() => {
    if (!productQuery) {
      setSuggestions([]);
      return;
    }
    const q = productQuery.toLowerCase();

    const filtered = stockInventory
      .filter((item) => item.name && item.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name)) // A-Z by name
      .slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(true);
  }, [productQuery, stockInventory]);

  // --- Financial Calculations ---
  const newItemsTotal = useMemo(
    () => newItems.reduce((total, item) => total + Number(item.amount || 0), 0),
    [newItems]
  );
  const oldItemsTotal = useMemo(
    () => oldItems.reduce((total, item) => total + Number(item.amount || 0), 0),
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

  const selectedStockItem = useMemo(
    () =>
      stockInventory.find(
        (s) =>
          s.name === itemName &&
          (s.hsnCode || "") === (itemHsn || "") &&
          (s.huid || "") === (itemHuc || "")
      ),
    [stockInventory, itemName, itemHsn, itemHuc]
  );


  // --- Edit Invoice Handler ---
  const handleEditInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);

    setCustomer(invoice.customer);
    setPaymentMode(invoice.paymentMode);
    setNewItems(invoice.newItems || []);
    setOldItems(invoice.oldItems || []);
    setDiscount(invoice.discount || "");
    setReceivedAmount(invoice.receivedAmount || "");

    setIsModalOpen(true);
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();

    if (!itemName || !itemWeight || !itemRate || !itemMaking) {
      alert("Please fill all product fields.");
      return;
    }

    const weight = Number(itemWeight);
    const rate = Number(itemRate);
    const making = Number(itemMaking);

    // 🛑 NEW STOCK VALIDATION
    if (selectedStockItem) {
      const currentStock = Number(selectedStockItem.totalWeight || 0);

      if (weight > currentStock) {
        alert(`Stock is low! Only ${currentStock}g available. Please enter lower weight.`);
        setItemWeight(""); // reset field for correct value
        return;
      }
    }

    const amount = (rate + making) * weight;

    const newItem = {
      id: Date.now().toString(),
      name: itemName,
      weight,
      rate,
      makingCharge: making,
      hsn: itemHsn,
      huc: itemHuc,
      amount,
    };

    setNewItems((prev) => [...prev, newItem]);

    // Reset input fields
    setItemName("");
    setProductQuery("");
    setItemHsn("7113");
    setItemHuc("");
    setItemWeight("");
    setItemRate("");
    setItemMaking("");
    setSuggestions([]);
    setShowSuggestions(false);
  };


  const handleRemoveNewItem = (index) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddOldItem = (e) => {
    e.preventDefault();

    if (!oldItemName || !oldItemWeight || !oldItemRate) {
      alert("Please fill old product fields.");
      return;
    }

    const weight = Number(oldItemWeight);
    const rate = Number(oldItemRate);
    const amount = weight * rate;

    const oldItem = {
      id: Date.now().toString(),
      name: oldItemName,
      weight,
      rate,
      amount,
    };

    setOldItems((prev) => [...prev, oldItem]);

    // Reset old fields
    setOldItemName("");
    setOldItemWeight("");
    setOldItemRate("");
  };

  const handleRemoveOldItem = (index) => {
    setOldItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔥 UPDATE STOCK FROM INVOICE (only for new invoice, not edit)
  const updateStockFromInvoice = (invoice) => {
    try {
      const stored = localStorage.getItem("jewellery_stock");
      if (!stored) return;
      let stockList = JSON.parse(stored) || [];

      const updated = stockList.map((item) => ({ ...item }));

      invoice.newItems.forEach((sold) => {
        const index = updated.findIndex(
          (s) =>
            s.name === sold.name &&
            (s.hsnCode || "") === (sold.hsn || "") &&
            (s.huid || "") === (sold.huc || "")
        );
        if (index === -1) return;

        const stockItem = updated[index];
        const soldWeight = Number(sold.weight || 0);
        if (!soldWeight || soldWeight <= 0) return;

        const currentTotal = Number(stockItem.totalWeight || 0);
        const perPieceWeight = Number(stockItem.weight || 0);

        let newTotal = Number((currentTotal - soldWeight).toFixed(2));
        if (newTotal < 0) newTotal = 0;

        let newQty = stockItem.quantity;
        if (perPieceWeight > 0) {
          newQty = Number((newTotal / perPieceWeight).toFixed(2));
        }

        updated[index] = {
          ...stockItem,
          totalWeight: newTotal,
          quantity: newTotal <= 0 ? 0 : newQty,
        };
      });

      localStorage.setItem("jewellery_stock", JSON.stringify(updated));
    } catch (err) {
      console.error("Stock update error:", err);
    }
  };

  // --- Save Handler (Create or Update) ---
  const handleSaveInvoice = () => {
    if (!customer.name || newItems.length === 0) {
      alert("Customer Name and at least one Item are required.");
      return;
    }

    if (editingInvoiceId) {
      // UPDATE EXISTING INVOICE (no stock change to avoid double adjustment)
      const updatedInvoices = invoices.map((inv) =>
        inv.id === editingInvoiceId
          ? {
            ...inv,
            customer,
            paymentMode,
            newItems,
            oldItems,
            discount: Number(discount || 0),
            receivedAmount: Number(receivedAmount || 0),
            balanceDue,
            subTotal,
            oldItemTotal: oldItemsTotal,
            taxableAmount,
            cgst,
            sgst,
            grandTotal,
          }
          : inv
      );

      setInvoices(updatedInvoices);
    } else {
      // CREATE NEW INVOICE
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
        oldItemTotal: oldItemsTotal,
        taxableAmount,
        sgst,
        cgst,
        grandTotal,
      };

      setInvoices([newInvoice, ...invoices]);

      // ✅ Reduce stock based on this invoice
      updateStockFromInvoice(newInvoice);
    }

    // Reset
    setIsModalOpen(false);
    setEditingInvoiceId(null);
    setCustomer({ name: "", address: "", contact: "" });
    setNewItems([]);
    setOldItems([]);
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
        doc.text("OLD PRODUCT EXCHANGE (LESS)", 14, finalY);

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
    <div className="space-y-6 p-4 sm:px-4 md:px-6 lg:px-4 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Billing & Invoices
          </h2>
          <p className="text-gray-500 text-sm">
            Create professional invoices from stock management.
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

                  {/* --- Action Buttons --- */}
                  <td className="px-6 py-4 text-right whitespace-nowrap flex justify-end gap-2">

                    {/* EDIT BUTTON 🚀 */}
                    <button
                      onClick={() => handleEditInvoice(invoice)}
                      className="text-gray-500 hover:text-purple-600 p-2"
                    >
                      <Pencil size={18} />
                    </button>

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

              {/* Add Products Section */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                  Add Products
                </h4>

                <form
                  onSubmit={handleAddNewItem}
                  className="grid grid-cols-2 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  {/* Product Name with searchable suggestions */}
                  <div className="col-span-2 md:col-span-3 relative" ref={suggestionsRef}>
                    <label className={labelStyle}>Product Name</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={productQuery || itemName}
                      onChange={(e) => {
                        setProductQuery(e.target.value);
                        setItemName(e.target.value);
                      }}
                      onFocus={() => {
                        if (productQuery) setShowSuggestions(true);
                      }}
                      placeholder="Type product name..."
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-44 overflow-auto border border-gray-200">
                        {suggestions.map((s, i) => (
                          <li
                            key={i}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between"
                            onClick={() => {
                              setItemName(s.name);
                              setProductQuery(s.name);
                              setItemHsn(s.hsnCode || itemHsn);
                              setItemHuc(s.huid || "");
                              setShowSuggestions(false);
                            }}
                          >
                            <span>{s.name}</span>
                            {s.totalWeight !== undefined && (
                              <span className="text-xs text-gray-500">
                                {s.totalWeight} g in stock
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className={labelStyle}>HSN Code</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={itemHsn}
                      onChange={(e) => setItemHsn(e.target.value)}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className={labelStyle}>HUC ID</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={itemHuc}
                      onChange={(e) => setItemHuc(e.target.value)}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className={labelStyle}>Weight (g)</label>
                    <input
                      type="number"
                      className={inputStyle}
                      value={itemWeight}
                      onChange={(e) => setItemWeight(e.target.value)}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className={labelStyle}>Rate/g</label>
                    <input
                      type="number"
                      className={inputStyle}
                      value={itemRate}
                      onChange={(e) => setItemRate(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 md:col-span-2">
                    <label className={labelStyle}>Making/g</label>
                    <input
                      type="number"
                      className={inputStyle}
                      value={itemMaking}
                      onChange={(e) => setItemMaking(e.target.value)}
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
                            <td className="px-4 py-2 font-medium">{item.name}</td>
                            <td className="px-4 py-2 text-right">{item.weight}</td>
                            <td className="px-4 py-2 text-right">{item.rate}</td>
                            <td className="px-4 py-2 text-right">{item.makingCharge}</td>
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

              {/* Old Items / Exchange */}
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
                    Include Old Product Exchange
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

              {/* SUMMARY & ACTIONS */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
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
                      className={`flex justify-between items-center p-3 rounded-lg mt-2 ${balanceDue > 0
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
                <div className="mt-6 flex gap-4 justify-end pb-10">
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
        </div>
      )}
    </div>
  );
};

export default Billing;