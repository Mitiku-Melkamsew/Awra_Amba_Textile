import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../infrastructure/http/api-client";
import { useAuth } from "../context/AuthContext";

const PASSWORD_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

function formatSignupError(err: unknown): string {
  if (err instanceof ApiError && Array.isArray(err.details) && err.details.length > 0) {
    const messages = err.details
      .map((d: unknown) =>
        d && typeof d === "object" && "message" in d ? String((d as { message: unknown }).message) : ""
      )
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(". ");
    }
  }
  return err instanceof Error ? err.message : "Sign up failed.";
}

export function SignUpPage() {
  const { user, signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "merchant" ? "merchant" : "weaver";

  const [role, setRole] = useState<"weaver" | "merchant">(initialRole);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paramRole = searchParams.get("role");
    if (paramRole === "merchant" || paramRole === "weaver") {
      setRole(paramRole);
    }
  }, [searchParams]);

  if (authLoading) return <div className="loading"><span>⏳</span> Loading…</div>;
  if (user) {
    if (user.roles?.includes("admin") || user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.roles?.includes("merchant") || user.role === "merchant") return <Navigate to="/merchant" replace />;
    return <Navigate to="/weaver" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 8 || !PASSWORD_COMPLEXITY_RE.test(password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const authUser = await signup({
        fullName: trimmedName,
        phone: trimmedPhone || undefined,
        username: trimmedUsername,
        password,
        role,
      });

      if (authUser.roles?.includes("merchant") || authUser.role === "merchant") {
        navigate("/merchant", { replace: true });
      } else {
        navigate("/weaver", { replace: true });
      }
    } catch (err) {
      setError(formatSignupError(err));
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
          <label>
            <span>{role === "merchant" ? "Company / Business Name (የድርጅት ስም)" : "Full Name / ሙሉ ስም"}</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === "merchant" ? "e.g. Merkato Textile Wholesalers" : "e.g. Abebe Alemu"}
              autoFocus
              required
            />
          </label>

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
              placeholder="Choose a username (min 3 chars)"
              autoComplete="username"
              minLength={3}
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
                placeholder="Min 8 chars (A-z, 0-9)"
                autoComplete="new-password"
                required
                minLength={8}
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
                minLength={8}
              />
            </label>
          </div>
          <p className="auth-hint">
            Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.
          </p>
        </div>

        {error && (
          <div className="error-msg">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full-width"
          disabled={loading}
          style={{ minHeight: 44, fontSize: "14.5px", marginTop: "0.5rem" }}
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
