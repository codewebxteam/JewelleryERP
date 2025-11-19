import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // Your logo
import { LogIn, Loader2, AlertCircle } from "lucide-react"; // Import icons
//import { auth } from "../firebase-config"; // Import your Firebase auth
//import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();

  // --- ADDED: State for inputs, loading, and errors ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // Clear previous errors

    try {
      // --- ADDED: Firebase Login Logic ---
      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, navigate to the dashboard
      navigate("/");
    } catch (firebaseError) {
      // --- ADDED: Error Handling ---
      console.error("Firebase login error:", firebaseError.code);
      if (firebaseError.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("An error occurred. Please try again later.");
      }
    } finally {
      // --- ADDED: Stop loading ---
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-2xl">
        <div className="flex flex-col items-center">
          <img src={logo} alt="Logo" className="w-20 h-20 mb-4" />
          <h2 className="text-3xl font-extrabold text-center text-gray-900">
            Shree Laxmi Jewellers and Sons
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Admin Portal Login
          </p>
        </div>

        {/* --- ADDED: Error Message Display --- */}
        {error && (
          <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email} // --- ADDED ---
                onChange={(e) => setEmail(e.target.value)} // --- ADDED ---
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password} // --- ADDED ---
                onChange={(e) => setPassword(e.target.value)} // --- ADDED ---
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-gold focus:border-brand-gold focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading} // --- ADDED ---
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-gold hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold disabled:bg-opacity-70"
            >
              {/* --- ADDED: Loading spinner and text --- */}
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
