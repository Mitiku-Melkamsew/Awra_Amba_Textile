import { Link } from "react-router-dom";

export function TransactionNewPage() {
  return (
    <div className="page">
      <Link to="/admin/transactions" className="back-link">
        ← Back to Transactions / ወደ ግብይት
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">ደረጃ 1 ከ 3 / Step 1 of 3</p>
          <h1 className="page-title">Record New Transaction</h1>
          <p className="page-subtitle">
            Choose whether this transaction represents stock inflow (Purchase) or stock outflow (Sale).
          </p>
        </div>
      </div>

      <div className="txn-action-cards" style={{ maxWidth: 720 }}>
        <Link to="/admin/transactions/new/buy" className="txn-action-card">
          <div className="txn-action-icon">⬇️</div>
          <p className="txn-action-title">Buy / ግዛት (Inflow)</p>
          <p className="txn-action-desc">
            Procure yarn cones from raw material suppliers, or purchase finished fabric pieces from weavers. Stock increases on delivery.
          </p>
          <span style={{ marginTop: "1rem", fontSize: "12.5px", fontWeight: 700, color: "var(--accent)" }}>
            Select Purchase →
          </span>
        </Link>

        <Link to="/admin/transactions/new/sell" className="txn-action-card">
          <div className="txn-action-icon">⬆️</div>
          <p className="txn-action-title">Sell / ሽያጭ (Outflow)</p>
          <p className="txn-action-desc">
            Sell wholesale yarn or handwoven finished textile products to retail merchants. Stock decreases on delivery.
          </p>
          <span style={{ marginTop: "1rem", fontSize: "12.5px", fontWeight: 700, color: "var(--accent)" }}>
            Select Sale →
          </span>
        </Link>
      </div>
    </div>
  );
}

export default TransactionNewPage;
