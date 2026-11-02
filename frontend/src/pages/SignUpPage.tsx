import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SignUpPage() {
  const { user, signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return <div className="loading"><span>⏳</span> Loading…</div>;
  if (user) return <Navigate to={user.role === "weaver" ? "/weaver" : "/admin"} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match. Please verify.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup({ firstName, lastName, phone: phone || undefined, username, password });
      navigate("/weaver", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} style={{ width: "min(460px, 100%)" }}>
        <div className="auth-logo">
          <div className="auth-logo-mark" aria-hidden="true">
            🧵
          </div>
          <h1 className="auth-title">ተመዝገብ / Sign Up</h1>
          <p className="auth-subtitle">Create your Awra Amba Weaver Account</p>
        </div>

        <div className="form">
          <div className="form-row">
            <label>
              <span>First name / ስም</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Abebe"
                autoFocus
                required
              />
            </label>
            <label>
              <span>Last name / የአባት ስም</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Alemu"
                required
              />
            </label>
          </div>

          <label>
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Phone number / ስልክ ቁጥር</span>
              <span style={{ fontWeight: 400, color: "var(--text-subtle)", fontSize: "11px" }}>Optional</span>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 9xx xxx xxx"
            />
          </label>

          <label>
            <span>Username / መለያ ስም</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              required
            />
          </label>

          <div className="form-row">
            <label>
              <span>Password / የይለፍ ቃል</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 chars"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </label>

            <label>
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </label>
          </div>
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
          {loading ? "Creating account…" : "Create Weaver Account →"}
        </button>

        <p className="auth-footer">
          Already registered? <Link to="/login" style={{ fontWeight: 700 }}>Sign in</Link>
          &ensp;·&ensp;
          <Link to="/">Back to Home</Link>
        </p>
      </form>
    </div>
  );
}

export default SignUpPage;
