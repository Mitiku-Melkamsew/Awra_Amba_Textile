import { NavLink, Outlet } from "react-router-dom";
import { AccountMenu } from "./AccountMenu";

const links = [
  { to: "/weaver", label: "Home", amharic: "መነሻ", icon: "🏠", end: true },
  { to: "/weaver/zigs", label: "Zigs", amharic: "ዝግ", icon: "🧵" },
  { to: "/weaver/payments", label: "Payments", amharic: "ክፍያ", icon: "💳" },
  { to: "/weaver/rates", label: "Rates", amharic: "ተመን", icon: "🏷️" },
  { to: "/weaver/calculator", label: "Calculator", amharic: "ስሌት", icon: "🧮" },
];

export function WeaverLayout() {
  return (
    <div className="weaver-shell">
      {/* ── Top Navbar (Web-first) ── */}
      <header className="weaver-navbar">
        <div className="weaver-navbar-inner">
          <NavLink to="/weaver" className="weaver-brand">
            <div className="weaver-brand-mark">
              <span>አ</span>
            </div>
            <div className="weaver-brand-titles">
              <span className="weaver-brand-name">Awra Amba Textile</span>
              <span className="weaver-brand-sub">አውራ አምባ ሸማኔ · Weaver Portal</span>
            </div>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="weaver-nav-links" aria-label="Weaver navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `weaver-nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile & Sign Out */}
          <div className="weaver-nav-actions">
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* ── Main Web Content Area ── */}
      <main className="weaver-main-content">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Navigation Bar (Responsive Mockup Parity) ── */}
      <nav className="weaver-bottom-nav" aria-label="Mobile weaver navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `weaver-bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="weaver-bottom-nav-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default WeaverLayout;
