import { Link } from "react-router-dom";

export function TransactionNewPage() {
  return (
    <section>
      <p>
        <Link to="/admin/transactions">← Transactions</Link>
      </p>
      <p className="eyebrow">Step 1 of 4</p>
      <h2>Record a transaction</h2>
      <p className="muted">Is this a purchase or a sale?</p>

      <div className="weaver-grid" style={{ marginTop: "1rem" }}>
        <Link to="/admin/transactions/new/buy" className="weaver-card">
          <h3>Buy / ግዛት</h3>
          <p className="muted">Add stock — yarn from supplier, fabric from weaver</p>
        </Link>
        <Link to="/admin/transactions/new/sell" className="weaver-card">
          <h3>Sell / ሽያጭ</h3>
          <p className="muted">Remove stock — sell to merchant</p>
        </Link>
      </div>
    </section>
  );
}