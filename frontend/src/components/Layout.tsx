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
    <div className="layout layout-top-nav">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">Awra Amba</p>
          <h1>Textile Admin</h1>
        </div>
        <nav className="top-nav">
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
        <div className="topbar-user">
          <span>{user?.username}</span>
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}