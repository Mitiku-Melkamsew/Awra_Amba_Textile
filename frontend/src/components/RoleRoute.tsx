import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../api";

interface RoleRouteProps {
  role: AuthUser["role"];
  redirectTo: string;
}

export function RoleRoute({ role, redirectTo }: RoleRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}