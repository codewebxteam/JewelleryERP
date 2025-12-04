import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const SHOP_NAME = "Shree Ganesh Jewellery";

function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(`Password reset email sent to ${email}`);
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-white p-4">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-xl border border-yellow-200">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="h-20 mb-3" />
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            {SHOP_NAME} Reset Password
          </h1>
        </div>

        {message && (
          <p className="text-green-600 text-sm text-center mb-3">{message}</p>
        )}
        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleReset} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-600 shadow ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>

        <button
          onClick={() => navigate(-1)}
          className="mt-4 w-full py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;