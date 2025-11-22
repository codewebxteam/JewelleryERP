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

/* -----------------------------------------
   📌 1. STATS CARDS
----------------------------------------- */
export const statsCardsData = [
  {
    title: "Today's Sales",
    value: "₹14,250",
    change: "+12.5%",
    changeType: "positive",
    icon: <Wallet size={24} className="text-brand-gold" />,
  },
  {
    title: "Monthly Revenues",
    value: "₹32,40,000",
    change: "+8.2%",
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

/* -----------------------------------------
   📌 2. MONTHLY SALES DATA (Updated)
----------------------------------------- */
export const monthlySalesData = [
  { month: "Jan", sales: 120000 },
  { month: "Feb", sales: 150000 },
  { month: "Mar", sales: 180000 },
  { month: "Apr", sales: 220000 },
  { month: "May", sales: 240000 },
  { month: "Jun", sales: 260000 },
  { month: "Jul", sales: 280000 },
  { month: "Aug", sales: 310000 },
  { month: "Sep", sales: 300000 },
  { month: "Oct", sales: 330000 },
  { month: "Nov", sales: 350000 },
  { month: "Dec", sales: 370000 },
];

/* -----------------------------------------
   📌 3. TOP SELLING PRODUCTS (STOCK → grams)
----------------------------------------- */
export const topSellingProducts = [
  {
    id: 1,
    name: "Gold Ring",
    sold: 25,
    grams: 100, // Updated
    icon: <Gem size={20} className="text-gray-500" />,
  },
  {
    id: 2,
    name: "Gold Chain",
    sold: 18,
    grams: 500, // Updated
    icon: <Link size={20} className="text-gray-500" />,
  },
  {
    id: 3,
    name: "Gold Chain",
    sold: 18,
    grams: 500, // Updated
    icon: <Link size={20} className="text-gray-500" />,
  },
  {
    id: 4,
    name: "Gold Chain",
    sold: 18,
    grams: 500, // Updated
    icon: <Link size={20} className="text-gray-500" />,
  },
];

/* -----------------------------------------
   📌 4. RECENT TRANSACTIONS
----------------------------------------- */
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

/* -----------------------------------------
   📌 5. GIRWI DATA
----------------------------------------- */
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

/* -----------------------------------------
   📌 6. STOCK DATA (Updated to grams)
----------------------------------------- */
export const stockData = [
  {
    id: "SKU-001",
    name: "Gold Ring",
    category: "Ring",
    grams: 100.0,
    price: 7200,
  },
  {
    id: "SKU-002",
    name: "Gold Chain",
    category: "Chain",
    grams: 500.0,
    price: 7200,
  },
  {
    id: "SKU-003",
    name: "Diamond Necklace",
    category: "Necklace",
    grams: 150.0,
    price: 65000,
  },
  {
    id: "SKU-004",
    name: "Silver Anklet",
    category: "Anklet",
    grams: 1000.0,
    price: 85,
  },
  {
    id: "SKU-005",
    name: "Gold Bangle",
    category: "Bangle",
    grams: 250.0,
    price: 7200,
  },
];


