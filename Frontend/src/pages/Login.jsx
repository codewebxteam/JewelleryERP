import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/logo.webp";
import { Loader2 } from "lucide-react"; // ✅ Import Icon

const SHOP_NAME = "Shree Laxmi Jewellers and Sons";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  // Initial Page Load Spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 text-yellow-600 animate-spin" />
      </div>
    );
  }

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

          {/* ✅ Button with Spinner */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-600 shadow flex items-center justify-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
