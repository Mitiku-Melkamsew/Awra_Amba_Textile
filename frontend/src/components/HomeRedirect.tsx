import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomeRedirect() {
  const { user, loading, isAdmin, isWeaver, isMerchant } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  if (isAdmin) {
    return <Navigate to="/admin/weavers" replace />;
  }
  if (isWeaver) {
    return <Navigate to="/weaver" replace />;
  }
  if (isMerchant) {
    return <Navigate to="/merchant" replace />;
  }

  return <Navigate to="/" replace />;
}
