import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../domain/models";

interface RoleRouteProps {
  role: UserRole;
  redirectTo?: string;
}

export function RoleRoute({ role, redirectTo = "/" }: RoleRouteProps) {
  const { user, loading, hasRole } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (!hasRole(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
