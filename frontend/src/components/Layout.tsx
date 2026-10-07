import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/admin/weavers",      label: "Weavers",      icon: "🧵", amharic: "ዛሬ" },
  { to: "/admin/stock",        label: "Stock",        icon: "📦", amharic: "ስቶክ" },
  { to: "/admin/transactions", label: "Transactions", icon: "🔄", amharic: "ግብይት" },
  { to: "/admin/catalog",      label: "Catalog",      icon: "📋", amharic: "ካታሎግ" },
  { to: "/admin/settlement",   label: "Settlement",   icon: "💳", amharic: "ሂሳብ" },
  { to: "/admin/reports",      label: "Reports",      icon: "📊", amharic: "ሪፖርት" },
];

export function Layout() {
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-brand-eyebrow">አውራ አምባ</p>
          <p className="sidebar-brand-name">Textile Admin</p>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-nav-label">Navigation</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            >
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <span className="sidebar-user-name">{user?.username}</span>
          </div>
          <NavLink to="/admin/calculator" className="nav-item" style={{ fontSize: "12.5px" }}>
            <span className="nav-icon" aria-hidden="true">🧮</span>
            <span>Calculator</span>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="nav-item"
            style={{ width: "100%", textAlign: "left", opacity: 0.65, fontSize: "12.5px", background: "none" }}
          >
            <span className="nav-icon" aria-hidden="true">↩</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}