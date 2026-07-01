import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/admin/weavers", label: "ዛሬ / Weavers" },
  { to: "/admin/stock", label: "ስቶክ / Stock" },
  { to: "/admin/transactions", label: "ግብይት / Transactions" },
  { to: "/admin/catalog", label: "ካታሎግ / Catalog" },
  { to: "/admin/settlement", label: "ሂሳብ / Settlement" },
  { to: "/admin/reports", label: "ሪፖርት / Reports" },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <p className="eyebrow">Awra Amba</p>
          <h1>Textile Admin</h1>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>{user?.username}</p>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}