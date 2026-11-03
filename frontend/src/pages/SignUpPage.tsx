import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SignUpPage() {
  const { user, signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "merchant" ? "merchant" : "weaver";

  const [role, setRole] = useState<"weaver" | "merchant">(initialRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return <div className="loading"><span>⏳</span> Loading…</div>;
  if (user) {
    if (user.roles?.includes("admin") || user.role === "admin") return <Navigate to="/admin/weavers" replace />;
    if (user.roles?.includes("merchant") || user.role === "merchant") return <Navigate to="/merchant" replace />;
    return <Navigate to="/weaver" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match. Please verify.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const authUser = await signup({
        firstName,
        lastName,
        companyName: role === "merchant" ? companyName.trim() || undefined : undefined,
        phone: phone || undefined,
        username,
        password,
        role,
      });

      if (authUser.roles?.includes("merchant") || authUser.role === "merchant") {
        navigate("/merchant", { replace: true });
      } else {
        navigate("/weaver", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} style={{ width: "min(490px, 100%)" }}>
        <div className="auth-logo">
          <div className="auth-logo-mark" aria-hidden="true">
            {role === "merchant" ? "🏬" : "🧵"}
          </div>
          <h1 className="auth-title">ተመዝገብ / Sign Up</h1>
          <p className="auth-subtitle">
            {role === "merchant" ? "Create your Commercial Merchant Account" : "Create your Awra Amba Weaver Account"}
          </p>
        </div>

        {/* Role toggle */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            background: "var(--bg-subtle)",
            padding: "0.35rem",
            borderRadius: "10px",
            marginBottom: "1.25rem",
          }}
        >
          <button
            type="button"
            className={role === "weaver" ? "tab-pill active" : "tab-pill"}
            onClick={() => setRole("weaver")}
            style={{
              justifyContent: "center",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              fontWeight: 700,
              border: "none",
            }}
          >
            🪢 Weaver / አሸጋይ
          </button>
          <button
            type="button"
            className={role === "merchant" ? "tab-pill active" : "tab-pill"}
            onClick={() => setRole("merchant")}
            style={{
              justifyContent: "center",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              fontWeight: 700,
              border: "none",
            }}
          >
            🏬 Merchant / ነጋዴ
          </button>
        </div>

        <div className="form">
          {role === "merchant" && (
            <label>
              <span>Company / Business Name (የድርጅት ስም)</span>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Merkato Textile Wholesalers"
                autoFocus
              />
            </label>
          )}

          <div className="form-row">
            <label>
              <span>First name / ስም</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Abebe"
                autoFocus={role === "weaver"}
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
              <span style={{ fontWeight: 400, color: "var(--text-subtle)", fontSize: "11px" }}>
                {role === "merchant" ? "Required for Orders" : "Optional"}
              </span>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 9xx xxx xxx"
              required={role === "merchant"}
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
          style={{ width: "100%", justifyContent: "center", minHeight: 44, fontSize: 14.5, marginTop: "0.5rem" }}
        >
          {loading ? "Creating account…" : `Create ${role === "merchant" ? "Merchant" : "Weaver"} Account →`}
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
