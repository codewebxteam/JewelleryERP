import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const SHOP_NAME = "Shree Ganesh Jewellery";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    const ADMIN_EMAIL = "admin@example.com";
    const ADMIN_PASS = "admin123";

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      localStorage.setItem("auth", "true");
      navigate("/");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-white p-4">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-xl border border-yellow-200">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="h-20 mb-3" />
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            {SHOP_NAME} Admin Login
          </h1>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full border rounded p-2 shadow-sm focus:ring-2 focus:ring-yellow-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded p-2 shadow-sm focus:ring-2 focus:ring-yellow-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-600 shadow"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
