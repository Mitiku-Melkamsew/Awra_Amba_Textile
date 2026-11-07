import { Link } from "react-router-dom";
import { WeaverRatesTransparency } from "../../components/WeaverRatesTransparency";

export function WeaverRatesPage() {
  return (
    <div className="page">
      <Link to="/weaver" className="back-link">
        ← Back to My Work Orders / ወደ ዝግ ዝርዝር
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow" style={{ background: "#D1FAE5", color: "#065F46" }}>
            የዋጋና ተመን ግልጽነት / Price Transparency
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Weaver Piece Rates & Yarn Prices</h1>
          </div>
          <p className="page-subtitle">
            Official active cooperative weaving piece rates per fabric item (የሸማኔ ተመን) and yarn catalog purchase prices.
          </p>
        </div>
      </div>

      <WeaverRatesTransparency />
    </div>
  );
}

export default WeaverRatesPage;
