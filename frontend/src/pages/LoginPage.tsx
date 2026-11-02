import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === "weaver" ? "/weaver" : "/admin/weavers"} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await login(username, password);
      navigate(result?.role === "weaver" ? "/weaver" : "/admin/weavers");
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
              placeholder="e.g. admin or weaver username"
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

        <p className="auth-footer">
          New weaver? <Link to="/signup" style={{ fontWeight: 700 }}>Create account</Link>
          &ensp;·&ensp;
          <Link to="/">Back to Home</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
