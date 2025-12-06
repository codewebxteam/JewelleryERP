// Billing.jsx
// ✅ Added Optional IGST (18%) – Bill Level

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
} from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// --- Configuration ---
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;
const IGST_RATE = 0.18;

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
  const [invoices, setInvoices] = useState([]);

  // Load invoices
  useEffect(() => {
    const ref = collection(db, "invoices");
    const unsub = onSnapshot(ref, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInvoices(all);
    });
    return () => unsub();
  }, []);

  // --- Main State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState(null);

  // Manual date & time for invoice
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceTime, setInvoiceTime] = useState("");

  // UTR for new invoice payment
  const [utr, setUtr] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Payment modal for due payments
  const [paymentModal, setPaymentModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [payUtr, setPayUtr] = useState("");

  // Stock
  const [stockInventory, setStockInventory] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "jewellery_stock"), (snap) => {
      setStockInventory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

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

  // ✅ NEW: IGST Toggle
  const [isIGSTEnabled, setIsIGSTEnabled] = useState(false);

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
      .filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(true);
  }, [productQuery, stockInventory]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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

  // ✅ NEW: IGST Calculation
  const igstAmount = useMemo(() => {
    return isIGSTEnabled ? taxableAmount * IGST_RATE : 0;
  }, [taxableAmount, isIGSTEnabled]);

  const grandTotal = useMemo(
    () => Math.round(taxableAmount + cgst + sgst + igstAmount),
    [taxableAmount, cgst, sgst, igstAmount]
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
          (s.hsnCode || s.hsn || "") === (itemHsn || "") &&
          (s.huid || s.huc || "") === (itemHuc || "")
      ),
    [stockInventory, itemName, itemHsn, itemHuc]
  );

  const handleAddNewItem = (e) => {
    e.preventDefault();

    if (!itemName || !itemWeight || !itemRate || !itemMaking) {
      alert("Please fill all product fields.");
      return;
    }

    const weight = Number(itemWeight);
    const rate = Number(itemRate);
    const making = Number(itemMaking);

    if (selectedStockItem) {
      const currentStock = Number(
        selectedStockItem.totalWeight ||
        selectedStockItem.weight ||
        selectedStockItem.qty ||
        0
      );

      if (weight > currentStock) {
        alert(
          `Stock is low! Only ${currentStock}g available. Please enter lower weight.`
        );
        setItemWeight("");
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

    setOldItemName("");
    setOldItemWeight("");
    setOldItemRate("");
  };

  const handleRemoveOldItem = (index) => {
    setOldItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStockFromInvoice = async (invoice) => {
    for (const sold of invoice.newItems) {
      const match = stockInventory.find(
        (s) =>
          s.name === sold.name &&
          (s.hsnCode || s.hsn || "") === (sold.hsn || "") &&
          (s.huid || s.huc || "") === (sold.huc || "")
      );

      if (!match) continue;

      let newTotal = Number((match.totalWeight - sold.weight).toFixed(2));
      if (newTotal < 0) newTotal = 0;

      await updateDoc(doc(db, "jewellery_stock", match.id), {
        totalWeight: newTotal,
        quantity:
          newTotal > 0
            ? Number((newTotal / (match.weight || 1)).toFixed(2))
            : 0,
      });
    }
  };

  const handleSaveInvoice = async () => {
    if (!customer.name || newItems.length === 0) {
      alert("Customer Name and at least one Item are required.");
      return;
    }

    if (!invoiceDate || !invoiceTime) {
      alert("Please enter invoice date and time.");
      return;
    }

    const receivedNum = Number(receivedAmount || 0);

    if (receivedNum > grandTotal) {
      alert(
        `Allowed Payment Limit: ${formatCurrency(grandTotal)}\n` +
        `You entered: ${formatCurrency(receivedNum)}`
      );
      return;
    }

    if (paymentMode !== "Cash" && receivedNum > 0 && !utr.trim()) {
      alert("UTR / Transaction ID is required for non-cash payments.");
      return;
    }

    // Generate Financial Year from Invoice Date
    const invoiceDateObj = new Date(invoiceDate);
    const year = invoiceDateObj.getFullYear();
    const month = invoiceDateObj.getMonth() + 1; // Month is 0-indexed

    let financialYear;
    if (month >= 4) {
      financialYear = `${year}-${(year + 1).toString().slice(2)}`;
    } else {
      financialYear = `${year - 1}-${year.toString().slice(2)}`;
    }

    // Fetch the last invoice number from the database
    const invoicesSnapshot = await getDocs(query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(1)));
    let lastInvoiceNo = "SLJ" + financialYear + "-0000";
    if (!invoicesSnapshot.empty) {
      const lastInvoice = invoicesSnapshot.docs[0].data();
      const lastInvoiceNoParts = lastInvoice.invoiceNo.match(/SLJ(\d{4}-\d{2})-(\d{4})/);
      if (lastInvoiceNoParts) {
        const lastYear = lastInvoiceNoParts[1];
        const lastNumber = parseInt(lastInvoiceNoParts[2], 10);
        if (lastYear === financialYear) {
          lastInvoiceNo = `SLJ${financialYear}-${String(lastNumber + 1).padStart(4, '0')}`;
        } else {
          lastInvoiceNo = `SLJ${financialYear}-0001`;
        }
      }
    }

    const balance = grandTotal - receivedNum;
    const safeBalance = balance > 0 ? balance : 0;

    const initialHistory =
      receivedNum > 0
        ? [
          {
            amount: receivedNum,
            method: paymentMode,
            utr: paymentMode !== "Cash" ? utr.trim() : "",
            date: new Date().toISOString(),
            balanceAfter: safeBalance,
          },
        ]
        : [];

    const invoicePayload = {
      invoiceNo: lastInvoiceNo,
      date: invoiceDate,
      time: invoiceTime,
      customer,
      paymentMode,
      utr: paymentMode !== "Cash" && receivedNum > 0 ? utr.trim() : "",
      newItems,
      oldItems,
      discount: Number(discount || 0),
      receivedAmount: receivedNum,
      balanceDue: safeBalance,
      subTotal,
      oldItemTotal: oldItemsTotal,
      taxableAmount,
      cgst,
      sgst,
      igstAmount,
      isIGSTEnabled,
      grandTotal,
      paymentHistory: initialHistory,
    };

    try {
      await addDoc(collection(db, "invoices"), {
        ...invoicePayload,
        createdAt: new Date(),
      });

      await updateStockFromInvoice(invoicePayload);

      alert("Invoice Saved Successfully ✨");
    } catch (err) {
      console.error(err);
      alert("❌ Saving Error! Check console.");
    }

    setCustomer({ name: "", address: "", contact: "" });
    setNewItems([]);
    setOldItems([]);
    setDiscount("");
    setReceivedAmount("");
    setInvoiceDate("");
    setInvoiceTime("");
    setPaymentMode("Cash");
    setUtr("");
    setIsIGSTEnabled(false);

    setItemName("");
    setItemHsn("7113");
    setItemHuc("");
    setItemWeight("");
    setItemRate("");
    setItemMaking("");

    setIsModalOpen(false);
  };

  const handleAddPayment = async () => {
    if (!paymentModal) return;

    const amountNum = Number(payAmount || 0);
    if (!amountNum || amountNum <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (payMode !== "Cash" && !payUtr.trim()) {
      alert("UTR / Transaction ID is required for non-cash payments.");
      return;
    }

    const currentDue = Number(paymentModal.balanceDue || 0);

    if (amountNum > currentDue) {
      alert(
        `Allowed Payment Limit: ${formatCurrency(currentDue)}\n` +
        `You entered: ${formatCurrency(amountNum)}`
      );
      return;
    }

    try {
      const invRef = doc(db, "invoices", paymentModal.id);
      const existingHistory = paymentModal.paymentHistory || [];

      const newBalance = Math.max(0, currentDue - amountNum);
      const newReceived =
        Number(paymentModal.receivedAmount || 0) + amountNum;

      const newHistoryEntry = {
        amount: amountNum,
        method: payMode,
        utr: payMode !== "Cash" ? payUtr.trim() : "",
        date: new Date().toISOString(),
        balanceAfter: newBalance,
      };

      await updateDoc(invRef, {
        receivedAmount: newReceived,
        balanceDue: newBalance,
        paymentHistory: [...existingHistory, newHistoryEntry],
        updatedAt: new Date(),
      });

      alert("Payment updated successfully ✅");
    } catch (error) {
      console.error(error);
      alert("Error updating payment. Check console.");
    }

    setPaymentModal(null);
    setPayAmount("");
    setPayMode("Cash");
    setPayUtr("");
  };

  // --- GENERATE PDF ---
  const generatePDF = async (invoice, action = "view") => {
    setLoadingInvoiceId(invoice.id);

    try {
      const pdf = new jsPDF();

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
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      const goldColor = [218, 165, 32];
      const lightGold = [253, 245, 230];
      const darkText = [30, 30, 30];

      // Header
      pdf.setFillColor(...goldColor);
      pdf.rect(0, 0, pageWidth, 3, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(...goldColor);
      pdf.text("TAX INVOICE", pageWidth - 15, 12, { align: "right" });

      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(` ${invoice.invoiceNo || invoice.id}`, pageWidth - 15, 16, {
        align: "right",
      });

      if (logoData) {
        pdf.addImage(logoData, "JPEG", 10, 8, 30, 30);
      }

      pdf.setFont("times", "bold");
      pdf.setFontSize(21);
      pdf.setTextColor(...goldColor);
      pdf.text("SHREE LAXMI JEWELLERS & SONS", 45, 22);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...darkText);
      pdf.text("Exclusive Gold & Diamond Jewellery", 45, 28);
      pdf.text("123, Main Road, City Center - 400001", 45, 33);
      pdf.text("Ph: 98765 43210 | GSTIN: 27ABCDE1234F1Z5", 45, 38);

      pdf.setDrawColor(220);
      pdf.line(10, 45, pageWidth - 10, 45);

      // Billing info
      let yPos = 55;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...goldColor);
      pdf.text("BILL TO:", 14, yPos);

      pdf.setTextColor(0);
      pdf.setFontSize(11);
      pdf.text((invoice.customer?.name || "").toUpperCase(), 14, yPos + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(invoice.customer?.address || "N/A", 14, yPos + 12);
      pdf.text(`Ph: ${invoice.customer?.contact || "-"}`, 14, yPos + 17);

      const rightColX = 155;
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...goldColor);
      pdf.text("DETAILS:", rightColX, yPos);

      pdf.setTextColor(0);
      pdf.setFont("helvetica", "normal");

      const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString("en-GB")
        : "-";

      pdf.text("Date:", rightColX, yPos + 6);
      pdf.text(dateStr, pageWidth - 15, yPos + 6, { align: "right" });

      pdf.text("Time:", rightColX, yPos + 12);
      pdf.text(invoice.time || "-", pageWidth - 15, yPos + 12, {
        align: "right",
      });

      // Items table
      yPos += invoice.utr ? 32 : 28;
      autoTable(pdf, {
        startY: yPos,
        head: [
          [
            "Sno.",
            "Item Description",
            "HSN",
            "HUC",
            "Wt(g)",
            "Rate",
            "Making",
            "Total",
          ],
        ],
        body: (invoice.newItems || []).map((item, i) => [
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

      let finalY = pdf.lastAutoTable.finalY || yPos;

      // Old items
      if (invoice.oldItems && invoice.oldItems.length > 0) {
        finalY += 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...goldColor);
        pdf.text("OLD PRODUCT EXCHANGE (LESS)", 14, finalY);

        autoTable(pdf, {
          startY: finalY + 2,
          head: [["Description", "Weight (g)", "Rate / g", "Amount"]],
          body: invoice.oldItems.map((item) => [
            item.name,
            item.weight.toFixed(2),
            item.rate,
            formatCurrency(item.amount),
          ]),
          theme: "grid",
          headStyles: {
            fillColor: goldColor,
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { halign: "left" },
            1: { halign: "right" },
            2: { halign: "right" },
            3: { halign: "right", textColor: [200, 0, 0] },
          },
        });
        finalY = pdf.lastAutoTable.finalY || finalY;
      }

      if (pageHeight - finalY < 85) {
        pdf.addPage();
        finalY = 20;
      }

      finalY += 10;

      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text("Amount in Words:", 14, finalY + 5);
      pdf.setFont("times", "italic");
      pdf.setTextColor(0);
      pdf.setFontSize(10);
      pdf.text(
        numberToWords(Math.round(invoice.grandTotal || 0)),
        14,
        finalY + 11,
        { maxWidth: 70 }
      );

      const boxWidth = 105;
      const summaryStartX = pageWidth - 15 - boxWidth;
      const valueX = pageWidth - 20;
      const lineHeight = 6.5;

      pdf.setDrawColor(230);
      pdf.setFillColor(...lightGold);
      pdf.roundedRect(summaryStartX, finalY - 2, boxWidth, 75, 2, 2, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      pdf.text("Subtotal:", summaryStartX + 5, finalY + 5);
      pdf.text(
        formatCurrency(invoice.subTotal),
        valueX,
        finalY + 5,
        { align: "right" }
      );

      if (invoice.discount > 0) {
        pdf.setTextColor(200, 0, 0);
        pdf.text("Discount:", summaryStartX + 5, finalY + 5 + lineHeight);
        pdf.text(
          `- ${formatCurrency(invoice.discount)}`,
          valueX,
          finalY + 5 + lineHeight,
          { align: "right" }
        );
        pdf.setTextColor(0);
      }

      pdf.text(
        "CGST (9%):",
        summaryStartX + 5,
        finalY + 5 + lineHeight * 2
      );
      pdf.text(
        formatCurrency(invoice.cgst),
        valueX,
        finalY + 5 + lineHeight * 2,
        { align: "right" }
      );

      pdf.text(
        "SGST (9%):",
        summaryStartX + 5,
        finalY + 5 + lineHeight * 3
      );
      pdf.text(
        formatCurrency(invoice.sgst),
        valueX,
        finalY + 5 + lineHeight * 3,
        { align: "right" }
      );

      // ✅ IGST in PDF
      if (invoice.igstAmount > 0) {
        pdf.text(
          "IGST (18%):",
          summaryStartX + 5,
          finalY + 5 + lineHeight * 4
        );
        pdf.text(
          formatCurrency(invoice.igstAmount),
          valueX,
          finalY + 5 + lineHeight * 4,
          { align: "right" }
        );
      }

      pdf.setDrawColor(200);
      pdf.line(
        summaryStartX + 5,
        finalY + 5 + lineHeight * 5,
        valueX,
        finalY + 5 + lineHeight * 5
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...goldColor);
      pdf.text(
        "GRAND TOTAL",
        summaryStartX + 5,
        finalY + 5 + lineHeight * 6 + 2
      );
      pdf.text(
        formatCurrency(invoice.grandTotal),
        valueX,
        finalY + 5 + lineHeight * 6 + 2,
        { align: "right" }
      );

      pdf.setFontSize(10);
      pdf.setTextColor(0);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "Received:",
        summaryStartX + 5,
        finalY + 5 + lineHeight * 7 + 4
      );
      pdf.text(
        formatCurrency(invoice.receivedAmount),
        valueX,
        finalY + 5 + lineHeight * 7 + 4,
        { align: "right" }
      );

      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Balance Due:",
        summaryStartX + 5,
        finalY + 5 + lineHeight * 8 + 6
      );
      const balanceColor =
        (invoice.balanceDue || 0) > 0 ? [200, 0, 0] : [0, 128, 0];
      pdf.setTextColor(...balanceColor);
      pdf.text(
        formatCurrency(invoice.balanceDue),
        valueX,
        finalY + 5 + lineHeight * 8 + 6,
        { align: "right" }
      );
      pdf.setTextColor(0);

      // Payment history
      const history = invoice.paymentHistory || [];
      let paymentY = finalY + 5 + lineHeight * 10 + 10;

      if (history.length > 0) {
        if (pageHeight - paymentY < 40) {
          pdf.addPage();
          paymentY = 20;
        }

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...goldColor);
        pdf.text("Payment History", 14, paymentY);

        pdf.setTextColor(0);
        autoTable(pdf, {
          startY: paymentY + 4,
          head: [["Date & Time", "Mode", "Amount", "UTR / Txn ID", "Balance"]],
          body: history.map((p) => [
            p.date ? new Date(p.date).toLocaleString("en-GB") : "",
            p.method || "",
            formatCurrency(p.amount || 0),
            p.utr || "",
            formatCurrency(p.balanceAfter ?? 0),
          ]),
          theme: "grid",
          headStyles: {
            fillColor: goldColor,
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 20 },
            2: { cellWidth: 25, halign: "right" },
            3: { cellWidth: 60 },
            4: { cellWidth: 30, halign: "right" },
          },
        });
      }

      const footerY = pageHeight - 30;
      pdf.setDrawColor(200);
      pdf.line(14, footerY, pageWidth - 14, footerY);

      pdf.setFontSize(8);
      pdf.setTextColor(120);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "TERMS: 1. Goods once sold will not be taken back. 2. Subject to local jurisdiction.",
        14,
        footerY + 5
      );

      pdf.setTextColor(0);
      pdf.setFontSize(9);
      pdf.text("Authorized Signatory", pageWidth - 15, pageHeight - 10, {
        align: "right",
      });

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (action === "download") {
        pdf.save(`Invoice_${invoice.invoiceNo || invoice.id}.pdf`);
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

  // Filter + pagination
  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return invoices.filter((inv) => {
      const name = inv.customer?.name?.toLowerCase() || "";
      const id = (inv.invoiceNo || inv.id || "").toLowerCase();
      return name.includes(term) || id.includes(term);
    });
  }, [invoices, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / itemsPerPage)
  );

  const paginatedInvoices = useMemo(
    () =>
      filteredInvoices.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      ),
    [filteredInvoices, page]
  );

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
              {paginatedInvoices.map((invoice) => (
                <tr
                  key={invoice.invoiceNo || invoice.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {invoice.invoiceNo || invoice.id}
                  </td>

                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    <div className="font-bold">
                      {invoice.customer?.name || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {invoice.date} {invoice.time}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-bold text-gray-800 whitespace-nowrap">
                    {formatCurrency(invoice.grandTotal)}
                  </td>

                  <td className="px-6 py-4 text-green-600 whitespace-nowrap">
                    {formatCurrency(invoice.receivedAmount)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {Number(invoice.balanceDue || 0) > 0 ? (
                      <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full flex items-center w-max">
                        <AlertCircle size={12} className="mr-1" /> Due:{" "}
                        {formatCurrency(invoice.balanceDue)}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full flex items-center w-max">
                        <CheckCircle size={12} className="mr-1" /> Paid
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap flex justify-end gap-2">
                    {Number(invoice.balanceDue || 0) > 0 && (
                      <button
                        onClick={() => setPaymentModal(invoice)}
                        className="text-green-600 hover:text-green-800 p-2 text-xs font-semibold border border-green-600 rounded-full"
                      >
                        Pay Due
                      </button>
                    )}

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
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-gray-400 text-sm"
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length > itemsPerPage && (
          <div className="flex justify-between items-center px-4 py-3 border-t text-sm text-gray-600">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={page === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
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
                    <label className={labelStyle}>Invoice Date</label>
                    <input
                      type="date"
                      className={inputStyle}
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Invoice Time</label>
                    <input
                      type="time"
                      className={inputStyle}
                      value={invoiceTime}
                      onChange={(e) => setInvoiceTime(e.target.value)}
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
                  {paymentMode !== "Cash" && (
                    <div>
                      <label className={labelStyle}>
                        Transaction ID / UTR
                      </label>
                      <input
                        type="text"
                        className={inputStyle}
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        placeholder="Enter UTR / Txn ID"
                      />
                    </div>
                  )}
                  {/* ✅ IGST Toggle */}
                  <div className="col-span-1 md:col-span-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={isIGSTEnabled}
                        onChange={(e) => setIsIGSTEnabled(e.target.checked)}
                        className="w-4 h-4 accent-yellow-600"
                      />
                      Add IGST (18%)
                    </label>
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
                  <div
                    className="col-span-2 md:col-span-3 relative"
                    ref={suggestionsRef}
                  >
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
                        {suggestions.map((s) => (
                          <li
                            key={s.id}
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
                            <td className="px-4 py-2 text-right">
                              {item.weight}
                            </td>
                            <td className="px-4 py-2 text-right">{item.rate}</td>
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
                        max={grandTotal}
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
                      <span>CGST (9%):</span>{" "}
                      <span>{formatCurrency(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span>SGST (9%):</span>{" "}
                      <span>{formatCurrency(sgst)}</span>
                    </div>
                    {/* ✅ IGST in UI */}
                    {isIGSTEnabled && (
                      <div className="flex justify-between text-gray-500 text-xs">
                        <span>IGST (18%):</span>{" "}
                        <span>{formatCurrency(igstAmount)}</span>
                      </div>
                    )}
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
                        {balanceDue > 0
                          ? "Balance Due (Baaki):"
                          : "Fully Paid:"}
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

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-800">
                Add Payment - {paymentModal.invoiceNo || paymentModal.id}
              </h3>
              <button
                onClick={() => setPaymentModal(null)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <div>
                <span className="font-semibold">Customer: </span>
                {paymentModal.customer?.name}
              </div>
              <div>
                <span className="font-semibold">Current Due: </span>
                {formatCurrency(paymentModal.balanceDue)}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelStyle}>Pay Amount</label>
                <input
                  type="number"
                  className={inputStyle}
                  placeholder="Enter amount"
                  value={payAmount}
                  max={paymentModal?.balanceDue || undefined}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div>
                <label className={labelStyle}>Payment Mode</label>
                <select
                  className={inputStyle}
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              {payMode !== "Cash" && (
                <div>
                  <label className={labelStyle}>UTR / Transaction ID</label>
                  <input
                    type="text"
                    className={inputStyle}
                    placeholder="Enter UTR / Txn ID"
                    value={payUtr}
                    onChange={(e) => setPayUtr(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setPaymentModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center gap-1"
              >
                <CheckCircle size={16} /> Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;