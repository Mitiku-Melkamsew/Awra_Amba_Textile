import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/admin/weavers",      label: "Weavers & Zigs", icon: "🧑‍🤝‍🧑", amharic: "አሸጋዮች" },
  { to: "/admin/users",        label: "User Accounts",  icon: "👥", amharic: "ተጠቃሚዎች" },
  { to: "/admin/stock",        label: "Stock Inventory", icon: "📦", amharic: "ስቶክ" },
  { to: "/admin/transactions", label: "Transactions", icon: "🔄", amharic: "ግብይት" },
  { to: "/admin/catalog",      label: "Catalog & Specs", icon: "📋", amharic: "ካታሎግ" },
  { to: "/admin/prices",       label: "Price Management", icon: "🏷️", amharic: "የዋጋ አስተዳደር" },
  { to: "/admin/quality-rules",label: "Quality Rules", icon: "⚖️", amharic: "የጥራት ህጎች" },
  { to: "/admin/settlement",   label: "Settlement & Payroll", icon: "💳", amharic: "ሂሳብ" },
  { to: "/admin/reports",      label: "Reports & HISAB", icon: "📊", amharic: "ሪፖርት" },
  { to: "/admin/audit-logs",   label: "Audit Logs", icon: "📜", amharic: "ኦዲት" },
];

export function Layout() {
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden="true">
            🪡
          </div>
          <div className="sidebar-brand-info">
            <p className="sidebar-brand-eyebrow">አውራ አምባ ቴክስታይል</p>
            <p className="sidebar-brand-name">Textile Operations</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-nav-label">Management</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                <span>{link.label}</span>
                <span style={{ fontSize: "10.5px", opacity: 0.65, fontWeight: 400 }}>{link.amharic}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status-pill">
            <span className="status-indicator-dot" /> Live Production
          </div>
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.username ?? "Administrator"}</span>
              <span className="sidebar-user-role">Cooperative Admin</span>
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
              cursor: "pointer",
            }}
          >
            <span className="nav-icon" aria-hidden="true">🚪</span>
            <span>Sign out / ውጣ</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
