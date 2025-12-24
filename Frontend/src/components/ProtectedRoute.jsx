import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react"; // ✅ Icon import kiya

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ Loading Spinner (Center of Screen)
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 text-yellow-600 animate-spin mb-3" />
        <p className="text-gray-500 font-medium text-sm">Please wait...</p>
      </div>
    );

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
