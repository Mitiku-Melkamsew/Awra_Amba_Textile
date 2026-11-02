import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { transactionsApi, type CommercialTransaction } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { TXN_STATUS_LABELS, TXN_TYPE_LABELS } from "../../../utils/transactionTypes";

function counterpartyLabel(txn: CommercialTransaction): string {
  if (txn.type === "weaver_payout" && txn.weaver) {
    return `${txn.weaver.firstName} ${txn.weaver.lastName} (Weaver)`;
  }
  if (txn.supplier) return `${txn.supplier.name} (Supplier)`;
  if (txn.weaver) return `${txn.weaver.firstName} ${txn.weaver.lastName} (Weaver)`;
  if (txn.merchant) return `${txn.merchant.companyName ?? txn.merchant.contactPhone} (Merchant)`;
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    transactionsApi
      .list()
      .then(setTransactions)
      .catch((err) => setError(err.message));
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.transactionId.toLowerCase().includes(q) ||
        counterpartyLabel(t).toLowerCase().includes(q) ||
        (TXN_TYPE_LABELS[t.type] && TXN_TYPE_LABELS[t.type].toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [transactions, statusFilter, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ግብይት / Commercial Flow</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Commercial Transactions</h1>
            <span className="badge badge-gray">{transactions.length} Total</span>
          </div>
          <p className="page-subtitle">
            Procure raw yarn, purchase artisan fabric, or record bulk commercial sales.
          </p>
        </div>
        <Link to="/admin/transactions/new" className="btn-primary">
          <span>+</span> New Transaction / አዲስ ግብይት
        </Link>
      </div>

      {/* Quick action cards */}
      <div className="txn-action-cards">
        <Link to="/admin/transactions/new/buy" className="txn-action-card">
          <div className="txn-action-icon">⬇️</div>
          <p className="txn-action-title">Buy / ግዛት (Inflow)</p>
          <p className="txn-action-desc">
            Procure yarn cones from raw material suppliers or buy finished fabric from weavers.
          </p>
        </Link>
        <Link to="/admin/transactions/new/sell" className="txn-action-card">
          <div className="txn-action-icon">⬆️</div>
          <p className="txn-action-title">Sell / ሽያጭ (Outflow)</p>
          <p className="txn-action-desc">
            Sell wholesale yarn or handwoven finished textile products to retail merchants.
          </p>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <input
          className="search-input"
          placeholder="🔍 Search transactions by ID, party, or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {["all", "pending", "in_progress", "completed"].map((st) => (
            <button
              key={st}
              type="button"
              className={statusFilter === st ? "tab-pill active" : "tab-pill"}
              onClick={() => setStatusFilter(st)}
              style={{ fontSize: "12px", padding: "0.35rem 0.75rem" }}
            >
              {st === "all" ? "All Statuses" : TXN_STATUS_LABELS[st] ?? st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Transactions table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Type / ዓይነት</th>
              <th>Counterparty</th>
              <th style={{ textAlign: "right" }}>Total Amount</th>
              <th style={{ textAlign: "right" }}>Amount Paid</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <span className="empty-icon">🔄</span>
                    <p style={{ fontWeight: 600, color: "var(--text)" }}>
                      {search || statusFilter !== "all"
                        ? "No transactions match your search or filter."
                        : "No transactions recorded yet."}
                    </p>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Use the Buy or Sell action cards above to record your first transaction.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr key={txn.transactionId}>
                  <td>
                    <Link
                      to={`/admin/transactions/${txn.transactionId}`}
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "var(--accent)",
                      }}
                    >
                      {txn.transactionId}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 600 }}>{TXN_TYPE_LABELS[txn.type]}</td>
                  <td>{counterpartyLabel(txn)}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                    {parseFloat(txn.totalAmount || "0").toLocaleString()} ETB
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 700,
                      color: balanceColor(txn.totalAmount, txn.amountPaid),
                    }}
                  >
                    {parseFloat(txn.amountPaid || "0").toLocaleString()} ETB
                  </td>
                  <td>
                    <span className={`badge ${txn.status}`}>
                      {TXN_STATUS_LABELS[txn.status] ?? txn.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>
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

export default TransactionsHubPage;
