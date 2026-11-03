import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../api";

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await login(username, password);
      navigate(getLandingRoute(result), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
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
              placeholder="e.g. admin, weaver, or merchant"
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
          <div className="error-msg">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", minHeight: 44, fontSize: 14.5 }}
        >
          {loading ? "Signing in…" : "Continue / ግባ →"}
        </button>

        <div className="auth-footer" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
