import { Link, useParams } from "react-router-dom";

export function TransactionTypePage() {
  const { direction } = useParams<{ direction: string }>();
  const isBuy = direction === "buy";

  return (
    <div className="page">
      <Link to="/admin/transactions/new" className="back-link">
        ← Back to Step 1
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">ደረጃ 2 ከ 3 / Step 2 of 3</p>
          <h1 className="page-title">
            {isBuy ? "Purchase Category / የግዛት ዓይነት" : "Sales Category / የሽያጭ ዓይነት"}
          </h1>
          <p className="page-subtitle">
            Choose what type of inventory goods you are {isBuy ? "purchasing" : "selling"}.
          </p>
        </div>
      </div>

      <div className="txn-action-cards" style={{ maxWidth: 720 }}>
        <Link
          to={`/admin/transactions/new/${direction}/yarn`}
          className="txn-action-card"
        >
          <div className="txn-action-icon">🧶</div>
          <p className="txn-action-title">Yarn Cones / ጥጥ</p>
          <p className="txn-action-desc">
            {isBuy
              ? "Procure raw yarn cones (cotton, acrylic) from spinning mills and suppliers."
              : "Sell raw or dyed yarn cones to commercial merchants and third parties."}
          </p>
          <span style={{ marginTop: "1rem", fontSize: "12.5px", fontWeight: 700, color: "var(--accent)" }}>
            Continue with Yarn →
          </span>
        </Link>

        <Link
          to={`/admin/transactions/new/${direction}/fabric`}
          className="txn-action-card"
        >
          <div className="txn-action-icon">🪢</div>
          <p className="txn-action-title">Woven Fabric / ጨርቅ</p>
          <p className="txn-action-desc">
            {isBuy
              ? "Purchase handwoven fabric pieces (Gabi, Netela, Bedspreads) from weavers."
              : "Sell wholesale finished woven textiles and traditional garments to merchants."}
          </p>
          <span style={{ marginTop: "1rem", fontSize: "12.5px", fontWeight: 700, color: "var(--accent)" }}>
            Continue with Fabric →
          </span>
        </Link>
      </div>
    </div>
  );
}

export default TransactionTypePage;
