import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Clean stroke icons matching the design
function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function SettlementIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PricesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function QualityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell">
      {/* ── Admin Sidebar ── */}
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden="true">
            <span style={{ fontSize: "19px", fontWeight: "bold" }}>አ</span>
          </div>
          <div className="sidebar-brand-info">
            <p className="sidebar-brand-name">Awra Amba</p>
            <p className="sidebar-brand-eyebrow">Textile</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {/* Dashboard */}
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            end
          >
            <span className="nav-icon" aria-hidden="true"><DashboardIcon /></span>
            <span>Dashboard</span>
          </NavLink>

          {/* DAILY WORK */}
          <p className="sidebar-nav-label">DAILY WORK</p>
          <NavLink
            to="/admin/weavers"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><UsersIcon /></span>
            <span>Weavers & zigs</span>
          </NavLink>
          <NavLink
            to="/admin/transactions"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><TransactionsIcon /></span>
            <span>Transactions</span>
          </NavLink>
          <NavLink
            to="/admin/stock"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><StockIcon /></span>
            <span>Stock</span>
          </NavLink>

          {/* MONEY */}
          <p className="sidebar-nav-label">MONEY</p>
          <NavLink
            to="/admin/settlement"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><SettlementIcon /></span>
            <span>Settlement</span>
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><ReportsIcon /></span>
            <span>Reports</span>
          </NavLink>

          {/* SETUP */}
          <p className="sidebar-nav-label">SETUP</p>
          <NavLink
            to="/admin/catalog"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><CatalogIcon /></span>
            <span>Catalog</span>
          </NavLink>
          <NavLink
            to="/admin/prices"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><PricesIcon /></span>
            <span>Prices</span>
          </NavLink>
          <NavLink
            to="/admin/quality-rules"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><QualityIcon /></span>
            <span>Quality rules</span>
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><UserIcon /></span>
            <span>Users</span>
          </NavLink>

          {/* RECORDS */}
          <p className="sidebar-nav-label">RECORDS</p>
          <NavLink
            to="/admin/audit-logs"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon" aria-hidden="true"><ActivityIcon /></span>
            <span>Activity log</span>
          </NavLink>
        </nav>

        {/* Bottom User info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user?.username ?? "Admin 1"}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="sidebar-signout-btn"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
