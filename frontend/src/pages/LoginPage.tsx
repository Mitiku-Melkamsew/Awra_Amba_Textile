import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../domain/models";

function getLandingRoute(u?: AuthUser | null): string {
  if (!u) return "/login";
  if (u.roles?.includes("admin") || u.role === "admin") return "/admin/weavers";
  if (u.roles?.includes("merchant") || u.role === "merchant") return "/merchant";
  return "/weaver";
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={getLandingRoute(user)} replace />;
  }

  async function handleLogin(u: string, p: string) {
    setLoading(true);
    setError("");
    try {
      const result = await login(u, p);
      navigate(getLandingRoute(result), { replace: true });
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    handleLogin(username, password);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <div className="auth-logo-mark" aria-hidden="true">
            🪡
          </div>
          <h1 className="auth-title">ግባ / Sign In</h1>
          <p className="auth-subtitle">Awra Amba Textile Cooperative</p>
        </div>

        <div className="form">
          <label>
            <span>Username / መለያ ስም</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              autoFocus
              required
            />
          </label>

          <label>
            <span>Password / የይለፍ ቃል</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {error && (
          <div className="error-msg" style={{ margin: "0.75rem 0", color: "#b91c1c", fontSize: "0.85rem" }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", minHeight: 44, fontSize: 14.5, marginTop: "0.75rem" }}
        >
          {loading ? "Signing in…" : "Continue / ግባ →"}
        </button>

        <div className="auth-footer" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          <div>
            Don't have an account?{" "}
            <Link to="/signup?role=weaver" style={{ fontWeight: 700 }}>
              Join as Weaver
            </Link>
            &ensp;·&ensp;
            <Link to="/signup?role=merchant" style={{ fontWeight: 700, color: "#0284C7" }}>
              Join as Merchant
            </Link>
          </div>
          <div>
            <Link to="/" style={{ color: "var(--text-subtle)", fontSize: 13 }}>
              ← Back to Overview
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
