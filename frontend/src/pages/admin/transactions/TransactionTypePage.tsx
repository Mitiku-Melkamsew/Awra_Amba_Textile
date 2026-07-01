import { Link, useParams } from "react-router-dom";

export function TransactionTypePage() {
  const { direction } = useParams<{ direction: string }>();
  const isBuy = direction === "buy";

  return (
    <section>
      <p>
        <Link to="/admin/transactions">← Transactions</Link>
      </p>
      <p className="eyebrow">Step 2 of 4</p>
      <h2>{isBuy ? "Buy / ግዛት" : "Sell / ሽያጭ"}</h2>
      <p className="muted">Choose what you are {isBuy ? "buying" : "selling"}.</p>

      <div className="weaver-grid" style={{ marginTop: "1rem" }}>
        <Link
          to={`/admin/transactions/new/${direction}/yarn`}
          className="weaver-card"
        >
          <h3>Yarn / ጥጥ</h3>
          <p className="muted">
            {isBuy ? "Purchase yarn from supplier" : "Sell yarn to merchant"}
          </p>
        </Link>
        <Link
          to={`/admin/transactions/new/${direction}/fabric`}
          className="weaver-card"
        >
          <h3>Fabric / ጨርቅ</h3>
          <p className="muted">
            {isBuy ? "Purchase fabric from weaver" : "Sell fabric to merchant"}
          </p>
        </Link>
      </div>
    </section>
  );
}