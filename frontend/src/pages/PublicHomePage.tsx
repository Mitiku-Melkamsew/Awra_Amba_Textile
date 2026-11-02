import { Link } from "react-router-dom";

const features = [
  {
    icon: "🧵",
    title: "Work Order (Zig) Tracking",
    text: "Assign yarn variants, issue zigs, and record fabric returns with weight and dimensional quality checks.",
  },
  {
    icon: "📦",
    title: "Real-time Inventory",
    text: "Automated stock snapshots updated synchronously on every procurement delivery and commercial sale.",
  },
  {
    icon: "💳",
    title: "Automated HISAB Settlement",
    text: "Standardized weight deduction rules, batch master payroll generation, and printable official receipts.",
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "Empowering Weaver Portal",
    text: "Artisans check their active zigs, fabric delivery records, and payment history independently.",
  },
];

export function PublicHomePage() {
  return (
    <div className="public-page">
      {/* ── Left panel: Brand presentation ── */}
      <div className="public-left">
        <div style={{ maxWidth: "600px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(234,88,12,0.2)", border: "1px solid rgba(234,88,12,0.4)", borderRadius: "999px", padding: "0.3rem 0.85rem", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "14px" }}>🇪🇹</span>
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#FDBA74", textTransform: "uppercase" }}>
              አውራ አምባ ቴክስታይል ማህበር
            </span>
          </div>

          <h1 className="public-tagline">
            Artisan Weaving.<br />
            Modern Operations.
          </h1>

          <p className="public-desc">
            The official digital operations platform for Awra Amba Textile Cooperative — managing yarn distribution, artisan work orders, commercial transactions, and transparent HISAB settlement.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  padding: "1rem 1.15rem",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                  <span className="public-feature-icon">{f.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#FFFFFF" }}>{f.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(248, 250, 252, 0.7)", lineHeight: 1.45 }}>
                  {f.text}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "12.5px", color: "rgba(248, 250, 252, 0.6)" }}>
            <span>✓ Community Owned</span>
            <span>✓ Transparent Accounting</span>
            <span>✓ Bilingual (English / አማርኛ)</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: Login & Access Card ── */}
      <div className="public-right">
        <div style={{ width: "min(400px, 100%)", display: "grid", gap: "1.25rem" }}>
          <div className="card" style={{ padding: "2.25rem 2rem", boxShadow: "var(--shadow-xl)", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                borderRadius: "16px",
                background: "var(--brand-gradient)",
                color: "#fff",
                fontSize: "26px",
                marginBottom: "1rem",
                boxShadow: "0 6px 18px rgba(234, 88, 12, 0.35)",
              }}
            >
              🪡
            </div>

            <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>
              Welcome back / እንኳን ደህና መጡ
            </h2>
            <p style={{ margin: "0 0 1.75rem", fontSize: "13.5px", color: "var(--text-muted)" }}>
              Sign in to manage cooperative production or check your work orders.
            </p>

            <div style={{ display: "grid", gap: "0.85rem" }}>
              <Link
                to="/login"
                className="big-btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                ግባ &nbsp;· &nbsp;Sign In
              </Link>

              <Link
                to="/signup"
                className="big-btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                ተመዝገብ &nbsp;· &nbsp;Sign Up as Weaver
              </Link>
            </div>

            <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)" }}>
              <span>Cooperative Administrator?</span>{" "}
              <Link to="/login" style={{ fontWeight: 600 }}>
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicHomePage;
