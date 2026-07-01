import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/weaver", label: "የኔ ዝግ / My Zigs", end: true },
  { to: "/weaver/payments", label: "ክፍያ / Payments" },
];

export function WeaverLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout layout-top-nav weaver-layout">
      <header className="topbar weaver-topbar">
        <div className="brand">
          <p className="eyebrow">Awra Amba</p>
          <h1>Weaver Portal</h1>
        </div>
        <nav className="top-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span className="weaver-user">{user?.username}</span>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="content weaver-content">
        <Outlet />
      </main>
    </div>
  );
}