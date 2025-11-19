import React from "react";
import {
  Wallet,
  Calendar,
  CircleDollarSign,
  Banknote,
  Link,
  Gem,
  ShoppingBag,
  Watch,
} from "lucide-react";

// --- Stats Cards ---
export const statsCardsData = [
  {
    title: "Today's Sales",
    value: "₹1,42,500",
    change: "+12.5%",
    changeType: "positive",
    icon: <Wallet size={24} className="text-brand-gold" />,
  },
  {
    title: "Weekly Revenue",
    value: "₹8,15,000",
    change: "+5.2%",
    changeType: "positive",
    icon: <Banknote size={24} className="text-green-600" />,
  },
  {
    title: "Pending Payments",
    value: "₹45,200",
    change: "-2.0%",
    changeType: "negative",
    icon: <CircleDollarSign size={24} className="text-red-500" />,
  },
  {
    title: "Total Orders",
    value: "156",
    change: "+8.5%",
    changeType: "positive",
    icon: <ShoppingBag size={24} className="text-blue-500" />,
  },
];

export const salesDataLineChart = [
  { name: "Mon", sales: 12000 },
  { name: "Tue", sales: 19000 },
  { name: "Wed", sales: 15000 },
  { name: "Thu", sales: 22000 },
  { name: "Fri", sales: 28000 },
  { name: "Sat", sales: 35000 },
  { name: "Sun", sales: 42000 },
];

export const topSellingProducts = [
  {
    id: 1,
    name: "Gold Ring",
    sold: 25,
    stock: 100,
    icon: <Gem size={20} className="text-gray-500" />,
  },
  {
    id: 2,
    name: "Gold Chain",
    sold: 18,
    stock: 500,
    icon: <Link size={20} className="text-gray-500" />,
  },
];

export const recentTransactions = [
  {
    id: "INV-1001",
    customerName: "Rohan Sharma",
    amount: 42400,
    status: "Paid",
  },
  {
    id: "INV-1002",
    customerName: "Anjali Gupta",
    amount: 12500,
    status: "Due",
  },
];

export const girwiData = [
  {
    id: "G-1001",
    name: "Ramesh Kumar",
    item: "Gold Chain",
    weight: 20.5,
    amount: 80000,
    date: "2025-10-01",
    status: "Active",
  },
];

// --- STOCK DATA (Updated as per request) ---
export const stockData = [
  {
    id: "SKU-001",
    name: "Gold Ring",
    category: "Ring",
    stock: 100.0,
    weight: 0,
    price: 7200,
  },
  {
    id: "SKU-002",
    name: "Gold Chain",
    category: "Chain",
    stock: 500.0,
    weight: 0,
    price: 7200,
  },
  {
    id: "SKU-003",
    name: "Diamond Necklace",
    category: "Necklace",
    stock: 150.0,
    weight: 0,
    price: 65000,
  },
  {
    id: "SKU-004",
    name: "Silver Anklet",
    category: "Anklet",
    stock: 1000.0,
    weight: 0,
    price: 85,
  },
  {
    id: "SKU-005",
    name: "Gold Bangle",
    category: "Bangle",
    stock: 250.0,
    weight: 0,
    price: 7200,
  },
];

// --- Invoice History ---
export const invoiceHistory = [
  {
    id: "INV-1001",
    date: "2025-11-15",
    customer: {
      name: "Rohan Sharma",
      address: "Flat 101, MG Road, Mumbai",
      contact: "9876543210",
    },
    paymentMode: "Cash",
    newItems: [
      {
        id: "SKU-001",
        name: "Gold Ring",
        weight: 5.2,
        rate: 7200,
        makingCharge: 500,
        hsn: "7113",
        huc: "HD12345",
        amount: 5.2 * (7200 + 500),
      },
    ],
    oldItems: [],
    subTotal: 40040,
    discount: 40,
    oldItemTotal: 0,
    taxableAmount: 40000,
    sgst: 1200,
    cgst: 1200,
    grandTotal: 42400,
    receivedAmount: 42400,
    balanceDue: 0,
  },
];
