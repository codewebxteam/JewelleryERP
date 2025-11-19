import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";

// Import Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Girwi from "./pages/Girwi";
import Stock from "./pages/Stock";
import Reports from "./pages/Reports";

function App() {
  return (
    <Routes>
      {/* Route for the Login page (no sidebar/header) */}
      <Route path="/login" element={<Login />} />

      {/* Routes that use the MainLayout (with sidebar/header) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/girwi" element={<Girwi />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default App;
