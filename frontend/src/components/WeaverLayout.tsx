import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/weaver", label: "የኔ ዝግ / My Zigs", end: true },
  { to: "/weaver/payments", label: "ክፍያ / Payments" },
];

export function WeaverLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout weaver-layout">
      <aside className="sidebar weaver-sidebar">
        <div className="brand">
          <p className="eyebrow">Awra Amba</p>
          <h1>Weaver Portal</h1>
        </div>
        <nav>
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
        <div className="sidebar-footer">
          <p className="weaver-user">{user?.username}</p>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="content weaver-content">
        <Outlet />
      </main>
    </div>
  );
}