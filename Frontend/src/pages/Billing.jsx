import React, { useState, useMemo, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../assets/logo.webp";
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
  TrendingUp,
  Wallet,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

// --- Configuration (UPDATED RATES) ---
const CGST_RATE = 0.015; // 1.5%
const SGST_RATE = 0.015; // 1.5%
const IGST_RATE = 0.03; // 3%

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

  // Load invoices - Ordered by CreatedAt DESC (Latest on top)
  useEffect(() => {
    const ref = collection(db, "invoices");
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInvoices(all);
    });
    return () => unsub();
  }, []);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = invoices.reduce(
      (acc, curr) => acc + (Number(curr.grandTotal) || 0),
      0
    );
    const received = invoices.reduce(
      (acc, curr) => acc + (Number(curr.receivedAmount) || 0),
      0
    );
    const pending = invoices.reduce(
      (acc, curr) => acc + (Number(curr.balanceDue) || 0),
      0
    );
    return { total, received, pending };
  }, [invoices]);

  // --- Main State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);

  // Filter State (All, Paid, Due)
  const [filterStatus, setFilterStatus] = useState("All");

  // Manual date & time for invoice
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceTime, setInvoiceTime] = useState("");

  // UTR for new invoice payment
  const [utr, setUtr] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

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

  // IGST Toggle
  const [isIGSTEnabled, setIsIGSTEnabled] = useState(false);

  // --- New Item Input State ---
  const [itemCategory, setItemCategory] = useState("");
  const [itemName, setItemName] = useState("");
  // ✅ UPDATE: Default HSN removed (Empty string)
  const [itemHsn, setItemHsn] = useState("");
  const [itemHuc, setItemHuc] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemRate, setItemRate] = useState("");
  const [itemMaking, setItemMaking] = useState("");
  const [itemStockType, setItemStockType] = useState("");

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
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  // Updated Suggestion Logic
  useEffect(() => {
    let filtered = stockInventory;

    // 1. Filter by Category (if selected)
    if (itemCategory && itemCategory !== "All") {
      filtered = filtered.filter((item) => item.category === itemCategory);
    }

    // 2. Filter by Search Query (if typed)
    if (productQuery) {
      const q = productQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q)
      );
    } else if (!itemCategory || itemCategory === "All") {
      // If NO category selected and NO query typed -> Show nothing
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Sort and limit
    filtered = filtered
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [productQuery, itemCategory, stockInventory]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

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
  const igstAmount = useMemo(() => {
    return isIGSTEnabled ? taxableAmount * IGST_RATE : 0;
  }, [taxableAmount, isIGSTEnabled]);

  const grandTotal = useMemo(
    () => Math.round(taxableAmount + cgst + sgst + igstAmount),
    [taxableAmount, cgst, sgst, igstAmount, subTotal]
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
      stockType: itemStockType || selectedStockItem?.stockType || "white",
      category: itemCategory || selectedStockItem?.category || "Other",
    };

    setNewItems((prev) => [...prev, newItem]);
    setItemName("");
    setProductQuery("");
    setItemCategory("");
    setItemHsn(""); // Reset HSN to empty
    setItemHuc("");
    setItemWeight("");
    setItemRate("");
    setItemMaking("");
    setItemStockType("");
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
      let match = stockInventory.find(
        (s) =>
          s.name === sold.name &&
          (s.hsnCode || s.hsn || "") === (sold.hsn || "") &&
          (s.huid || s.huc || "") === (sold.huc || "") &&
          (s.stockType || "white") === (sold.stockType || "white")
      );

      if (!match) {
        match = stockInventory.find(
          (s) =>
            s.name === sold.name &&
            (s.hsnCode || s.hsn || "") === (sold.hsn || "") &&
            (s.huid || s.huc || "") === (sold.huc || "")
        );
      }

      if (!match) continue;

      let newTotal = Number((match.totalWeight - sold.weight).toFixed(2));
      if (newTotal < 0) newTotal = 0;

      try {
        await updateDoc(doc(db, "jewellery_stock", match.id), {
          totalWeight: newTotal,
          quantity:
            newTotal > 0
              ? Number((newTotal / (match.weight || 1)).toFixed(2))
              : 0,
        });
      } catch (err) {
        console.error("Stock update error:", err);
      }
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
        `Allowed Payment Limit: ${formatCurrency(
          grandTotal
        )}\nYou entered: ${formatCurrency(receivedNum)}`
      );
      return;
    }
    if (paymentMode !== "Cash" && receivedNum > 0 && !utr.trim()) {
      alert("UTR / Transaction ID is required for non-cash payments.");
      return;
    }

    // Generate Invoice No
    const invoiceDateObj = new Date(invoiceDate);
    const year = invoiceDateObj.getFullYear();
    const month = invoiceDateObj.getMonth() + 1;
    let financialYear;
    if (month >= 4) {
      financialYear = `${year}-${(year + 1).toString().slice(2)}`;
    } else {
      financialYear = `${year - 1}-${year.toString().slice(2)}`;
    }

    const fyPrefix = `SLJ/${financialYear}/`;
    const fyInvoices = invoices.filter(
      (inv) => inv.invoiceNo && inv.invoiceNo.startsWith(fyPrefix)
    );
    let nextSeq = 1;
    if (fyInvoices.length > 0) {
      const maxSeq = Math.max(
        ...fyInvoices.map((inv) => {
          const parts = inv.invoiceNo.split("/");
          return parseInt(parts[2], 10) || 0;
        })
      );
      nextSeq = maxSeq + 1;
    }
    const newInvoiceNo = `${fyPrefix}${String(nextSeq).padStart(4, "0")}`;

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
      invoiceNo: newInvoiceNo,
      financialYear: financialYear,
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
      stockType: newItems.some((i) => i.stockType === "black")
        ? "black"
        : "white",
    };

    try {
      await addDoc(collection(db, "invoices"), {
        ...invoicePayload,
        createdAt: new Date(),
      });
      await updateStockFromInvoice(invoicePayload);
      alert(`Invoice Generated: ${newInvoiceNo} 🎉`);
    } catch (err) {
      console.error(err);
      alert("❌ Saving Error! Check console.");
    }

    // Reset Form
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
    setItemCategory("");
    setItemHsn("");
    setItemHuc("");
    setItemWeight("");
    setItemRate("");
    setItemMaking("");
    setItemStockType("");
    setIsModalOpen(false);
  };

  const handleDeleteInvoice = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      try {
        await deleteDoc(doc(db, "invoices", id));
        alert("Invoice deleted successfully 🗑️");
      } catch (error) {
        console.error("Error deleting invoice:", error);
        alert("Failed to delete invoice.");
      }
    }
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
        `Allowed Payment Limit: ${formatCurrency(
          currentDue
        )}\nYou entered: ${formatCurrency(amountNum)}`
      );
      return;
    }

    try {
      const invRef = doc(db, "invoices", paymentModal.id);
      const existingHistory = paymentModal.paymentHistory || [];
      const newBalance = Math.max(0, currentDue - amountNum);
      const newReceived = Number(paymentModal.receivedAmount || 0) + amountNum;
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
      alert("Error updating payment.");
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
      pdf.text("Exclusive Gold & Silvers Jewellery", 45, 28);
      pdf.text("Mandir Road, Mairwa, Siwan Bihar - 841239", 45, 33);
      pdf.text("Ph: +91-8873873269 | GSTIN: 10AZXPK1966D2ZA", 45, 38);
      pdf.setDrawColor(220);
      pdf.line(10, 45, pageWidth - 10, 45);

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
      pdf.text(formatCurrency(invoice.subTotal), valueX, finalY + 5, {
        align: "right",
      });

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

      pdf.text("CGST (1.5%):", summaryStartX + 5, finalY + 5 + lineHeight * 2);
      pdf.text(
        formatCurrency(invoice.cgst),
        valueX,
        finalY + 5 + lineHeight * 2,
        { align: "right" }
      );
      pdf.text("SGST (1.5%):", summaryStartX + 5, finalY + 5 + lineHeight * 3);
      pdf.text(
        formatCurrency(invoice.sgst),
        valueX,
        finalY + 5 + lineHeight * 3,
        { align: "right" }
      );

      if (invoice.igstAmount > 0) {
        pdf.text("IGST (3%):", summaryStartX + 5, finalY + 5 + lineHeight * 4);
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
      pdf.text("Received:", summaryStartX + 5, finalY + 5 + lineHeight * 7 + 4);
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

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return invoices.filter((inv) => {
      const name = inv.customer?.name?.toLowerCase() || "";
      const id = (inv.invoiceNo || inv.id || "").toLowerCase();
      const matchesSearch = name.includes(term) || id.includes(term);

      // ✅ Filter Logic (Added as requested)
      let matchesStatus = true;
      if (filterStatus === "Paid") matchesStatus = Number(inv.balanceDue) <= 0;
      if (filterStatus === "Due") matchesStatus = Number(inv.balanceDue) > 0;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / itemsPerPage)
  );
  const paginatedInvoices = useMemo(
    () =>
      filteredInvoices.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredInvoices, page]
  );

  return (
    <div className="p-4 sm:px-6 space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* 🔹 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              Total Sales Amount
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(stats.total)}
            </h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600 shadow-sm">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-green-600 font-bold text-xs uppercase tracking-wider mb-1">
              Received Amount
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(stats.received)}
            </h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600 shadow-sm">
            <Wallet size={24} />
          </div>
        </div>

        {/* ✅ Made Pending Amount Card Clickable */}
        <div
          onClick={() => setFilterStatus("Due")}
          className="bg-gradient-to-br from-rose-50 to-red-50 p-5 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between cursor-pointer hover:scale-105 transition-transform"
        >
          <div>
            <p className="text-red-600 font-bold text-xs uppercase tracking-wider mb-1">
              Pending Amount
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(stats.pending)}
            </h3>
          </div>
          <div className="bg-red-100 p-3 rounded-full text-red-600 shadow-sm">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* 🔹 HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search invoice no or customer..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        {/* ✅ New Filter Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {["All", "Paid", "Due"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                filterStatus === status
                  ? "bg-white text-gray-800 shadow text-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold rounded-xl shadow hover:shadow-lg transition flex items-center justify-center gap-2 transform active:scale-95"
        >
          <Plus size={20} /> New Invoice
        </button>
      </div>

      {/* 🔹 INVOICE TABLE */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4 text-left">Invoice No</th>
                <th className="px-6 py-4 text-left">Customer</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition group">
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {inv.invoiceNo}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {inv.customer?.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {Number(inv.balanceDue) > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Due: {formatCurrency(inv.balanceDue)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {Number(inv.balanceDue) > 0 && (
                        <button
                          onClick={() => setPaymentModal(inv)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg tooltip"
                          title="Add Payment"
                        >
                          <IndianRupee size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => generatePDF(inv, "view")}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View PDF"
                      >
                        {loadingInvoiceId === inv.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => generatePDF(inv, "download")}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete Invoice"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredInvoices.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {Math.ceil(filteredInvoices.length / itemsPerPage)}
            </span>
            <button
              onClick={() =>
                setPage((p) =>
                  Math.min(
                    Math.ceil(filteredInvoices.length / itemsPerPage),
                    p + 1
                  )
                )
              }
              disabled={
                page >= Math.ceil(filteredInvoices.length / itemsPerPage)
              }
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-600"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* 🔹 CREATE INVOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* ✅ Reduced Max Width to 5xl for better fit on small laptops */}
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                Create New Invoice
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
              {/* Customer Info */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    className="input-field"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="input-field"
                    value={customer.contact}
                    onChange={(e) =>
                      setCustomer({ ...customer, contact: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    className="input-field"
                    value={customer.address}
                    onChange={(e) =>
                      setCustomer({ ...customer, address: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className="input-field"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="input-field"
                    value={invoiceTime}
                    onChange={(e) => setInvoiceTime(e.target.value)}
                  />

                  <div className="relative">
                    <select
                      className="input-field appearance-none"
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
                      className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
                    />
                  </div>

                  {paymentMode !== "Cash" && (
                    <input
                      type="text"
                      placeholder="UTR / Transaction ID"
                      className="input-field"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                    />
                  )}

                  <div className="md:col-span-3 flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="igst"
                      checked={isIGSTEnabled}
                      onChange={(e) => setIsIGSTEnabled(e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                    />
                    <label
                      htmlFor="igst"
                      className="text-sm font-medium text-gray-700"
                    >
                      Enable IGST (3%)
                    </label>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                  Add Items
                </h4>
                <form
                  onSubmit={handleAddNewItem}
                  className="grid grid-cols-2 md:grid-cols-12 gap-4 items-end"
                >
                  {/* ✅ Category Dropdown */}
                  <div className="col-span-2 md:col-span-2">
                    <label className="label">Category</label>
                    <select
                      className="input-field"
                      value={itemCategory}
                      onChange={(e) => {
                        setItemCategory(e.target.value);
                        setProductQuery(""); // Reset search on category change
                      }}
                    >
                      <option value="">All</option>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* ✅ Increased column span for Item Name (Balanced Layout) */}
                  <div
                    className="col-span-2 md:col-span-3 relative"
                    ref={suggestionsRef}
                  >
                    <label className="label">Item Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Search..."
                      value={productQuery || itemName}
                      onChange={(e) => {
                        setProductQuery(e.target.value);
                        setItemName(e.target.value);
                      }}
                      onFocus={() => {
                        if (
                          productQuery ||
                          (itemCategory && itemCategory !== "All")
                        )
                          setShowSuggestions(true);
                      }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-xl max-h-48 overflow-auto">
                        {suggestions.map((s) => (
                          <li
                            key={s.id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between"
                            onClick={() => {
                              setItemName(s.name);
                              setProductQuery(s.name);
                              setItemHsn(s.hsnCode || itemHsn);
                              setItemHuc(s.huid || "");
                              setItemStockType(s.stockType || "white");
                              // ✅ Auto-set category if not already set
                              if (!itemCategory)
                                setItemCategory(s.category || "Other");
                              setShowSuggestions(false);
                            }}
                          >
                            <span>{s.name}</span>{" "}
                            <span className="text-gray-400 text-xs">
                              {s.totalWeight}g
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="label">HSN</label>
                    <input
                      type="text"
                      className="input-field"
                      value={itemHsn}
                      onChange={(e) => setItemHsn(e.target.value)}
                    />
                  </div>
                  {/* ✅ Reduced HUC Input Size to 1 Column */}
                  <div className="col-span-1 md:col-span-1">
                    <label className="label">HUC</label>
                    <input
                      type="text"
                      className="input-field"
                      value={itemHuc}
                      onChange={(e) => setItemHuc(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="label">Wt (g)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={itemWeight}
                      onChange={(e) => setItemWeight(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="label">Rate</label>
                    <input
                      type="number"
                      className="input-field"
                      value={itemRate}
                      onChange={(e) => setItemRate(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="label">Making</label>
                    <input
                      type="number"
                      className="input-field"
                      value={itemMaking}
                      onChange={(e) => setItemMaking(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="label">Type</label>
                    <select
                      className="input-field"
                      value={itemStockType}
                      onChange={(e) => setItemStockType(e.target.value)}
                    >
                      <option value="">Auto</option>
                      <option value="white">White</option>
                      <option value="black">Black</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 shadow-sm flex justify-center"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </form>

                {newItems.length > 0 && (
                  <div className="mt-6 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-right">Wt</th>
                          <th className="px-4 py-2 text-right">Rate</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {newItems.map((item, idx) => (
                          <tr key={idx} className="border-t border-gray-50">
                            <td className="px-4 py-2 font-medium">
                              {item.name}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.weight}g
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.rate}
                            </td>
                            <td className="px-4 py-2 text-right font-bold">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => handleRemoveNewItem(idx)}
                                className="text-red-500 hover:text-red-700"
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

              {/* Summary Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div
                    onClick={() => setShowOldItems(!showOldItems)}
                    className="flex items-center cursor-pointer gap-2 text-gray-700 font-medium select-none"
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        showOldItems
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {showOldItems && <CheckCircle size={14} />}
                    </div>
                    Include Old Gold Exchange
                  </div>

                  {showOldItems && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Item"
                          className="input-field bg-white"
                          value={oldItemName}
                          onChange={(e) => setOldItemName(e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Wt"
                          className="input-field bg-white w-20"
                          value={oldItemWeight}
                          onChange={(e) => setOldItemWeight(e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Rate"
                          className="input-field bg-white w-24"
                          value={oldItemRate}
                          onChange={(e) => setOldItemRate(e.target.value)}
                        />
                        <button
                          onClick={handleAddOldItem}
                          className="bg-gray-800 text-white px-3 rounded-lg"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      {oldItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm text-red-700 bg-white p-2 rounded border border-red-100"
                        >
                          <span>
                            {item.name} ({item.weight}g)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              - {formatCurrency(item.amount)}
                            </span>
                            <button onClick={() => handleRemoveOldItem(idx)}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(subTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Discount</span>
                    <input
                      type="number"
                      className="w-24 text-right border rounded p-1 text-sm"
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>CGST (1.5%)</span>
                    <span>{formatCurrency(cgst)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>SGST (1.5%)</span>
                    <span>{formatCurrency(sgst)}</span>
                  </div>
                  {isIGSTEnabled && (
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>IGST (3%)</span>
                      <span>{formatCurrency(igstAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">
                      Grand Total
                    </span>
                    <span className="text-xl font-extrabold text-yellow-600">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium text-gray-700">Received</span>
                    <input
                      type="number"
                      className="w-32 text-right border border-green-300 bg-green-50 rounded p-1.5 font-bold text-green-700 outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                    />
                  </div>
                  <div
                    className={`text-right text-sm font-bold mt-1 ${
                      balanceDue > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {balanceDue > 0
                      ? `Balance Due: ${formatCurrency(balanceDue)}`
                      : "Fully Paid"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInvoice}
                className="px-8 py-2.5 bg-yellow-600 text-white font-bold rounded-xl shadow-lg hover:bg-yellow-700 flex items-center gap-2"
              >
                <Printer size={18} /> Save & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 PAYMENT MODAL */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setPaymentModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              Add Payment
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Invoice:{" "}
              <span className="font-mono font-medium text-gray-700">
                {paymentModal.invoiceNo}
              </span>
            </p>

            <div className="space-y-4">
              <div className="flex justify-between text-sm bg-red-50 p-3 rounded-lg border border-red-100 text-red-700">
                <span className="font-semibold">Current Due</span>
                <span className="font-bold text-lg">
                  {formatCurrency(paymentModal.balanceDue)}
                </span>
              </div>

              <div>
                <label className="label">Amount to Pay</label>
                <input
                  type="number"
                  className="input-field text-lg font-bold"
                  placeholder="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Mode</label>
                <select
                  className="input-field"
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
                  <label className="label">UTR / Ref No</label>
                  <input
                    type="text"
                    className="input-field"
                    value={payUtr}
                    onChange={(e) => setPayUtr(e.target.value)}
                  />
                </div>
              )}

              <button
                onClick={handleAddPayment}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg mt-2"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

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
        }
        .input-field:focus {
          border-color: #ca8a04;
          box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1);
        }
        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
          letter-spacing: 0.025em;
        }
      `}</style>
    </div>
  );
};

export default Billing;
