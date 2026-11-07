import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/merchant", label: "Available Fabrics", icon: "🧣", amharic: "የሚገኙ ጨርቆች", end: true },
  { to: "/merchant/prices", label: "Official Price List", icon: "🏷️", amharic: "የሽያጭ ዋጋ ዝርዝር" },
];

export function MerchantLayout() {
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "MC";

  return (
    <div className="app-shell">
      {/* ── Merchant Sidebar ── */}
      <aside className="sidebar merchant-sidebar">
        <div className="sidebar-brand">
          <div
            className="sidebar-brand-mark"
            style={{ background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" }}
          >
            🏬
          </div>
          <div className="sidebar-brand-info">
            <p className="sidebar-brand-eyebrow">አውራ አምባ ቴክስታይል</p>
            <p className="sidebar-brand-name">Merchant Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Merchant navigation">
          <p className="sidebar-nav-label">Commercial Catalog / ካታሎግ</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                <span>{link.label}</span>
                <span style={{ fontSize: "10.5px", opacity: 0.7, fontWeight: 400 }}>{link.amharic}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status-pill merchant">
            <span className="status-indicator-dot" /> Active Commercial Buyer
          </div>
          <div className="sidebar-user">
            <div
              className="sidebar-user-avatar"
              style={{ background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" }}
            >
              {initials}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.fullName || user?.username || "Merchant Partner"}</span>
              <span className="sidebar-user-role" style={{ color: "#7DD3FC" }}>Wholesale Buyer</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="nav-item"
            style={{
              width: "100%",
              textAlign: "left",
              fontSize: "12.5px",
              background: "none",
              color: "#FCA5A5",
              opacity: 0.85,
            }}
          >
            <span className="nav-icon" aria-hidden="true">🚪</span>
            <span>Sign out / ውጣ</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content" style={{ background: "#F8FAFC" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default MerchantLayout;
