import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "weaver") return <Navigate to="/weaver" replace />;
  return <Navigate to="/" replace />;
}