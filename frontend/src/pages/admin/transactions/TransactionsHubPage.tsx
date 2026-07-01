import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { transactionsApi, type CommercialTransaction } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { TXN_STATUS_LABELS, TXN_TYPE_LABELS } from "../../../utils/transactionTypes";

function counterpartyLabel(txn: CommercialTransaction): string {
  if (txn.type === "weaver_payout" && txn.weaver) {
    return `${txn.weaver.firstName} ${txn.weaver.lastName}`;
  }
  if (txn.supplier) return txn.supplier.name;
  if (txn.weaver) return `${txn.weaver.firstName} ${txn.weaver.lastName}`;
  if (txn.merchant) return txn.merchant.companyName ?? txn.merchant.contactPhone;
  return "—";
}

export function TransactionsHubPage() {
  const [transactions, setTransactions] = useState<CommercialTransaction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    transactionsApi
      .list()
      .then(setTransactions)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">ግብይት / Transactions</p>
          <h2>Commercial Transactions</h2>
          <p className="muted">
            Record buys, sales, and track payments. Stock updates when delivery is confirmed.
          </p>
        </div>
        <Link to="/admin/transactions/new" className="btn-primary">
          + Record transaction
        </Link>
      </header>

      <div className="weaver-grid" style={{ marginBottom: "1.5rem" }}>
        <Link to="/admin/transactions/new/buy" className="weaver-card">
          <h3>Buy / ግዛት</h3>
          <p className="muted">Yarn from supplier, fabric from weaver</p>
        </Link>
        <Link to="/admin/transactions/new/sell" className="weaver-card">
          <h3>Sell / ሽያጭ</h3>
          <p className="muted">Yarn or fabric to merchant</p>
        </Link>
      </div>

      <div className="card table-card">
        <h3>Recent transactions</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Counterparty</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.transactionId}>
                <td>
                  <Link to={`/admin/transactions/${txn.transactionId}`}>
                    {txn.transactionId}
                  </Link>
                </td>
                <td>{TXN_TYPE_LABELS[txn.type]}</td>
                <td>{counterpartyLabel(txn)}</td>
                <td>{txn.totalAmount}</td>
                <td>{txn.amountPaid}</td>
                <td>
                  <span className={`badge ${txn.status}`}>
                    {TXN_STATUS_LABELS[txn.status] ?? txn.status}
                  </span>
                </td>
                <td>{formatDateDDMMYY(txn.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <p className="muted">No transactions yet. Start with “Record transaction”.</p>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}