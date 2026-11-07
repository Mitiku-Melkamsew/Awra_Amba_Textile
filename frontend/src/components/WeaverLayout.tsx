import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/weaver",            label: "My Work Orders", icon: "🧵", amharic: "የኔ ዝግ", end: true },
  { to: "/weaver/rates",       label: "Piece Rates & Prices", icon: "🏷️", amharic: "የሥራ ተመን" },
  { to: "/weaver/calculator",  label: "Wage Calculator", icon: "🧮", amharic: "የገቢ ስሌት" },
  { to: "/weaver/payments",   label: "Settled Payments", icon: "💳", amharic: "ክፍያ" },
];

export function WeaverLayout() {
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "WV";

  return (
    <div className="app-shell">
      {/* ── Weaver Sidebar ── */}
      <aside className="sidebar weaver-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
            🪢
          </div>
          <div className="sidebar-brand-info">
            <p className="sidebar-brand-eyebrow">አውራ አምባ ቴክስታይል</p>
            <p className="sidebar-brand-name">Weaver Workspace</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Weaver navigation">
          <p className="sidebar-nav-label">My Account / የኔ ሂሳብ</p>
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
          <div className="sidebar-status-pill weaver">
            <span className="status-indicator-dot" /> Active Artisan
          </div>
          <div className="sidebar-user">
            <div className="sidebar-user-avatar" style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
              {initials}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.username ?? "Weaver"}</span>
              <span className="sidebar-user-role" style={{ color: "#6EE7B7" }}>Cooperative Artisan</span>
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
      <main className="main-content" style={{ background: "#F4FDF8" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default WeaverLayout;
