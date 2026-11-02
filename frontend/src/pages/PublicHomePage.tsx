import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const portals = [
  {
    role: "admin",
    icon: "🛡️",
    badge: "Cooperative Management",
    amharicBadge: "የማህበር አስተዳዳሪ",
    title: "Admin Operations Portal",
    amharicTitle: "የአስተዳደር ፖርታል",
    desc: "Complete production oversight, yarn inventory, work order (Zig) assignments, direct transactions, and automated batch HISAB settlement.",
    link: "/admin",
    loginState: "/login",
    buttonText: "Admin Access",
    color: "#EA580C",
    bgGradient: "linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(251, 146, 60, 0.04) 100%)",
    borderColor: "rgba(234, 88, 12, 0.25)",
  },
  {
    role: "weaver",
    icon: "🪢",
    badge: "Artisan Workspace",
    amharicBadge: "የሸማኔዎች መድረክ",
    title: "Weaver Portal",
    amharicTitle: "የሸማኔ ፖርታል",
    desc: "Personal work orders, issued yarn records, fabric delivery weight measurements, and verified payroll settlement statements.",
    link: "/weaver",
    loginState: "/login",
    signupLink: "/signup",
    buttonText: "Artisan Workspace",
    color: "#059669",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)",
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  {
    role: "merchant",
    icon: "🏬",
    badge: "Commercial Catalog",
    amharicBadge: "የነጋዴ ካታሎግ",
    title: "Merchant Portal",
    amharicTitle: "የነጋዴ ፖርታል",
    desc: "Browse authentic handcrafted fabrics, review physical specifications (dimensions and weight), and check current official cooperative selling prices.",
    link: "/merchant",
    loginState: "/login",
    buttonText: "Browse Catalog & Prices",
    color: "#0284C7",
    bgGradient: "linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(3, 105, 161, 0.04) 100%)",
    borderColor: "rgba(2, 132, 199, 0.25)",
  },
];

const highlights = [
  {
    icon: "🧵",
    title: "Work Order (Zig) Lifecycle",
    text: "From yarn disbursement to multi-variant fabric returns with clamped quality weight deductions.",
  },
  {
    icon: "📦",
    title: "Multi-Role Transparency",
    text: "Role-specific capabilities strictly separating internal cost data from public commercial prices.",
  },
  {
    icon: "💳",
    title: "Automated Batch HISAB",
    text: "Atomic settlement runs, floored deduction formulas, and official receipts with Amharic currency words.",
  },
  {
    icon: "⚖️",
    title: "Community Owned",
    text: "Equitable cooperative model empowering both master artisans and trusted commercial buyers.",
  },
];

export function PublicHomePage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "#F8FAFC", fontFamily: "var(--font-sans)" }}>
      {/* ── Top Navigation Bar ── */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "0.85rem 2rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "var(--brand-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
              }}
            >
              🪡
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.01em", color: "#FFFFFF" }}>
                Awra Amba Textile
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 500 }}>
                አውራ አምባ ቴክስታይል ማህበር
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "13px", color: "#CBD5E1" }}>
                  Signed in as <strong>{user.username}</strong> ({user.role})
                </span>
                <Link
                  to={
                    user.roles?.includes("admin") || user.role === "admin"
                      ? "/admin/weavers"
                      : user.roles?.includes("weaver") || user.role === "weaver"
                      ? "/weaver"
                      : "/merchant"
                  }
                  className="btn-primary"
                  style={{ fontSize: "13px", padding: "0.45rem 0.95rem" }}
                >
                  Go to Dashboard →
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#F8FAFC",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  Sign In / ግባ
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                  style={{ fontSize: "13px", padding: "0.45rem 1rem" }}
                >
                  Join as Weaver / ተመዝገብ
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "4rem 2rem 3rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(234, 88, 12, 0.15)",
            border: "1px solid rgba(234, 88, 12, 0.35)",
            borderRadius: "999px",
            padding: "0.35rem 1rem",
            marginBottom: "1.5rem",
          }}
        >
          <span style={{ fontSize: "14px" }}>🇪🇹</span>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#FDBA74", textTransform: "uppercase" }}>
            Official Cooperative Production & Trading Platform
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "850px",
            margin: "0 auto 1.25rem",
            background: "linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Artisan Weaving Excellence. Complete Operational Integrity.
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.18rem)",
            color: "#94A3B8",
            maxWidth: "700px",
            margin: "0 auto 2.5rem",
            lineHeight: 1.6,
          }}
        >
          A unified cooperative workspace serving administrators, independent weavers, and commercial wholesale merchants with real-time stock, production tracking, and transparent HISAB payroll.
        </p>
      </section>

      {/* ── Role Portals Section ── */}
      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>
            Access By Role / እንደ ሚናዎ ይግቡ
          </h2>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
            Select your dedicated portal to access your authorized cooperative capabilities.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.75rem" }}>
          {portals.map((p) => (
            <div
              key={p.role}
              style={{
                background: "rgba(30, 41, 59, 0.7)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${p.borderColor}`,
                borderRadius: "16px",
                padding: "2rem 1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      background: p.bgGradient,
                      border: `1px solid ${p.borderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    {p.icon}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: p.color,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {p.badge}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>{p.amharicBadge}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px" }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: "12.5px", color: "#94A3B8", margin: "0 0 1rem", fontWeight: 500 }}>
                  {p.amharicTitle}
                </p>

                <p style={{ fontSize: "13.5px", color: "#CBD5E1", lineHeight: 1.5, marginBottom: "1.75rem" }}>
                  {p.desc}
                </p>
              </div>

              <div style={{ display: "grid", gap: "0.65rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Link
                  to={user ? p.link : p.loginState}
                  className="big-btn"
                  style={{
                    background: p.color,
                    color: "#FFFFFF",
                    width: "100%",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    borderRadius: "10px",
                    textDecoration: "none",
                  }}
                >
                  {p.buttonText} →
                </Link>

                {p.signupLink && !user && (
                  <Link
                    to={p.signupLink}
                    style={{
                      fontSize: "12px",
                      textAlign: "center",
                      color: "#94A3B8",
                      textDecoration: "underline",
                      paddingTop: "0.25rem",
                    }}
                  >
                    New Weaver? Register for an account
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Operational Features Section ── */}
      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "1rem 2rem 5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {highlights.map((h) => (
            <div
              key={h.title}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "14px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.45rem" }}>
                <span style={{ fontSize: "1.25rem" }}>{h.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#FFFFFF" }}>{h.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#94A3B8", lineHeight: 1.5 }}>
                {h.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "2rem",
          textAlign: "center",
          fontSize: "12.5px",
          color: "#64748B",
        }}
      >
        <p style={{ margin: "0 0 0.5rem" }}>
          © {new Date().getFullYear()} Awra Amba Textile Cooperative Society (አውራ አምባ ቴክስታይል ማህበር). All rights reserved.
        </p>
        <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
          <span>Cooperative Administration</span>
          <span>·</span>
          <span>Weaver Artisans</span>
          <span>·</span>
          <span>Wholesale Merchant Distribution</span>
        </div>
      </footer>
    </div>
  );
}

export default PublicHomePage;
