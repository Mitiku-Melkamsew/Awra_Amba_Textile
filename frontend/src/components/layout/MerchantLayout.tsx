import { NavLink, Outlet } from "react-router-dom";
import { AccountMenu } from "./AccountMenu";

export function MerchantLayout() {
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
          </nav>

          <AccountMenu />
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
