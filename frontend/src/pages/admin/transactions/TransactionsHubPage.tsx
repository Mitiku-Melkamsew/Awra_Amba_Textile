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

const balanceColor = (total: string, paid: string) => {
  const t = parseFloat(total);
  const p = parseFloat(paid);
  if (isNaN(t) || isNaN(p)) return undefined;
  if (p >= t) return "var(--green)";
  if (p > 0) return "var(--accent)";
  return undefined;
};

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
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ግብይት / Transactions</p>
          <h1 className="page-title">Commercial Transactions</h1>
          <p className="page-subtitle">Buy, sell, track payments. Stock updates on delivery confirmation.</p>
        </div>
        <Link to="/admin/transactions/new" className="btn-primary">
          + New Transaction
        </Link>
      </div>

      {/* Quick action cards */}
      <div className="txn-action-cards">
        <Link to="/admin/transactions/new/buy" className="txn-action-card">
          <div className="txn-action-icon">⬇️</div>
          <p className="txn-action-title">Buy / ግዛት</p>
          <p className="txn-action-desc">Yarn from supplier · Fabric from weaver</p>
        </Link>
        <Link to="/admin/transactions/new/sell" className="txn-action-card">
          <div className="txn-action-icon">⬆️</div>
          <p className="txn-action-title">Sell / ሽያጭ</p>
          <p className="txn-action-desc">Yarn or fabric to merchant</p>
        </Link>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: "1rem" }}><span>⚠️</span> {error}</div>}

      {/* Transactions table */}
      <div className="table-wrap" style={{ flex: 1 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Counterparty</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th style={{ textAlign: "right" }}>Paid</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <span className="empty-icon">🔄</span>
                    No transactions yet. Use the action cards above to record one.
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn.transactionId}>
                  <td>
                    <Link
                      to={`/admin/transactions/${txn.transactionId}`}
                      style={{ fontFamily: "monospace", fontSize: 12.5 }}
                    >
                      {txn.transactionId}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 500 }}>{TXN_TYPE_LABELS[txn.type]}</td>
                  <td>{counterpartyLabel(txn)}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {txn.totalAmount}
                  </td>
                  <td style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: balanceColor(txn.totalAmount, txn.amountPaid),
                  }}>
                    {txn.amountPaid}
                  </td>
                  <td>
                    <span className={`badge ${txn.status}`}>
                      {TXN_STATUS_LABELS[txn.status] ?? txn.status}
                    </span>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>
                    {formatDateDDMMYY(txn.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}