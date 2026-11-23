import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function MerchantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  const displayName = user?.fullName || user?.username || "Merchant 1";
  const initial = displayName.charAt(0).toUpperCase() || "M";

  return (
    <div className="merchant-shell">
      {/* ── Top Navbar (Matching Image 6) ── */}
      <header className="merchant-navbar">
        <div className="merchant-navbar-inner">
          <NavLink to="/merchant" className="merchant-brand">
            <div className="merchant-brand-mark">
              <span>አ</span>
            </div>
            <div className="merchant-brand-titles">
              <span className="merchant-brand-name">Awra Amba Textile</span>
              <span className="merchant-brand-sub">አውራ አምባ ቴክስቲል ማህበር</span>
            </div>
          </NavLink>

          <nav className="merchant-nav-links" aria-label="Merchant navigation">
            <NavLink
              to="/merchant"
              end
              className={({ isActive }) =>
                `merchant-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>🧣</span>
              <span>Fabrics / ጨርቆች</span>
            </NavLink>
            <NavLink
              to="/merchant/prices"
              className={({ isActive }) =>
                `merchant-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>🏷️</span>
              <span>Prices / ዋጋ ዝርዝር</span>
            </NavLink>
          </nav>

          <div className="merchant-user-info">
            <div className="merchant-user-avatar">{initial}</div>
            <div className="merchant-user-meta">
              <span className="merchant-user-name">{displayName}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="merchant-signout-btn"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default MerchantLayout;
