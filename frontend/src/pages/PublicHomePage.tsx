import { Link } from "react-router-dom";

export function PublicHomePage() {
  return (
    <div className="public-page">
      <div className="public-hero">
        <p className="eyebrow">አውራ አምባ ቴክስታይል</p>
        <h1>Awra Amba Textile</h1>
        <p className="public-tagline">
          Track work orders, yarn, fabric returns, and payments for weavers and admins.
        </p>
        <div className="public-actions">
          <Link to="/login" className="btn-primary big-btn">
            ግባ / Sign In
          </Link>
          <Link to="/signup" className="btn-secondary big-btn">
            ተመዝገብ / Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}