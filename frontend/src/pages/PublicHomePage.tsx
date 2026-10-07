import { Link } from "react-router-dom";

const features = [
  { icon: "🧵", text: "Track work orders (Zigs) per weaver" },
  { icon: "📦", text: "Manage yarn & fabric inventory" },
  { icon: "💳", text: "Automated settlement & HISAB reports" },
];

export function PublicHomePage() {
  return (
    <div className="public-page">
      {/* ── Left panel: brand & feature list ── */}
      <div className="public-left">
        <p className="eyebrow" style={{ color: "rgba(240,232,223,0.6)", letterSpacing: "0.12em" }}>
          አውራ አምባ ቴክስታይል
        </p>
        <h1 className="public-tagline">Awra Amba<br />Textile</h1>
        <p className="public-desc">
          Production management, inventory tracking, and weaver settlement for the Awra Amba cooperative.
        </p>
        <ul className="public-feature-list">
          {features.map((f) => (
            <li key={f.text} className="public-feature">
              <span className="public-feature-icon">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right panel: action cards ── */}
      <div className="public-right">
        <div style={{ width: "min(360px, 100%)", display: "grid", gap: "1rem" }}>
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 52, height: 52, borderRadius: 14,
              background: "var(--accent)", color: "#fff", fontSize: 22, marginBottom: "0.75rem"
            }}>🪡</div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>Welcome back</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Sign in to your account to continue
            </p>
          </div>

          <Link to="/login" className="big-btn btn-primary"
            style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius)", fontWeight: 700 }}>
            ግባ &nbsp;/ &nbsp;Sign In
          </Link>

          <Link to="/signup" className="big-btn btn-secondary"
            style={{ borderRadius: "var(--radius)" }}>
            ተመዝገብ &nbsp;/ &nbsp;Sign Up as Weaver
          </Link>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-subtle)", margin: 0 }}>
            Admin accounts are created by the cooperative manager.
          </p>
        </div>
      </div>
    </div>
  );
}