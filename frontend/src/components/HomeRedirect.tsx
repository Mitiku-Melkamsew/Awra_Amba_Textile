import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  if (user.roles?.includes("admin") || user.role === "admin") {
    return <Navigate to="/admin/weavers" replace />;
  }
  if (user.roles?.includes("weaver") || user.role === "weaver") {
    return <Navigate to="/weaver" replace />;
  }
  if (user.roles?.includes("merchant") || user.role === "merchant") {
    return <Navigate to="/merchant" replace />;
  }

  return <Navigate to="/" replace />;
}
