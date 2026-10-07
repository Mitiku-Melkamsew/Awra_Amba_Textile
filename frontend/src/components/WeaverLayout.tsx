import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/weaver",          label: "My Zigs",   icon: "🧵", amharic: "የኔ ዝግ", end: true },
  { to: "/weaver/payments", label: "Payments",  icon: "💳", amharic: "ክፍያ" },
];

export function WeaverLayout() {
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="app-shell">
      {/* ── Weaver Sidebar ── */}
      <aside className="sidebar weaver-sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-brand-eyebrow">አውራ አምባ</p>
          <p className="sidebar-brand-name">Weaver Portal</p>
        </div>

        <nav className="sidebar-nav" aria-label="Weaver navigation">
          <p className="sidebar-nav-label">My Account</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            >
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              <span>{link.amharic} / {link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar" style={{ background: "#1D8B58" }}>
              {initials}
            </div>
            <span className="sidebar-user-name">{user?.username}</span>
          </div>
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