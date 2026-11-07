import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { transactionsApi, type CommercialTransaction } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { TXN_STATUS_LABELS, TXN_TYPE_LABELS } from "../../../utils/transactionTypes";

function counterpartyLabel(txn: any): string {
  if (txn.supplier) return `🏢 ${txn.supplier.name} (Supplier)`;
  if (txn.weaver) {
    const name =
      txn.weaver.fullName ??
      `${txn.weaver.firstName ?? ""} ${txn.weaver.lastName ?? ""}`.trim();
    return `🧑‍🤝‍🧑 ${name || "Weaver #" + (txn.weaver.userId ?? txn.weaver.weaverId)} (Weaver)`;
  }
  if (txn.merchant) {
    const name =
      txn.merchant.companyName ??
      txn.merchant.fullName ??
      txn.merchant.contactPhone ??
      txn.merchant.phone;
    return `🏬 ${name || "Merchant #" + (txn.merchant.userId ?? txn.merchant.merchantId)} (Merchant)`;
  }
  return "—";
}

function itemsSummary(txn: any): string {
  const lines = txn.lines ?? txn.items ?? [];
  if (lines.length === 0) return "—";
  if (lines.length === 1) {
    const l = lines[0];
    const name =
      l.yarnVariant?.yarn?.name ??
      l.yarnVariant?.sku ??
      l.fabricVariant?.fabric?.name ??
      l.fabricVariant?.sku ??
      l.description ??
      "Item";
    return `${l.quantity} × ${name}`;
  }
  const totalQty = lines.reduce((s: number, l: any) => s + Number(l.quantity || 0), 0);
  return `${lines.length} items (${totalQty} total)`;
}

const balanceColor = (total: string, paid: string) => {
  const t = parseFloat(total);
  const p = parseFloat(paid);
  if (isNaN(t) || isNaN(p)) return undefined;
  if (p >= t) return "var(--green)";
  if (p > 0) return "var(--accent)";
  return undefined;
};

function isPaymentEligible(txn: any): boolean {
  if (txn.type === "weaver_payout") return false;
  const status = String(txn.status ?? txn.paymentStatus ?? "").toLowerCase();
  if (status === "paid" || status === "completed" || status === "cancelled") return false;
  const total = parseFloat(String(txn.totalAmount || "0"));
  const paid = parseFloat(String(txn.amountPaid ?? txn.paidAmount ?? "0"));
  const balance = Math.max(0, total - paid);
  return balance > 0.001;
}

export function TransactionsHubPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<CommercialTransaction[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Payment Recording Modal State (Mobile-like functionality)
  const [paymentModalTxn, setPaymentModalTxn] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [customPayMethod, setCustomPayMethod] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");

  const loadTransactions = useCallback(() => {
    transactionsApi
      .list()
      .then(setTransactions)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const typeCounts = useMemo(() => {
    return {
      all: transactions.length,
      yarn_purchase: transactions.filter((t: any) => t.type === "yarn_purchase").length,
      fabric_purchase: transactions.filter(
        (t: any) => t.type === "fabric_purchase" || t.type === "fabric_purchase_from_weaver"
      ).length,
      fabric_sale: transactions.filter(
        (t: any) => t.type === "fabric_sale" || t.type === "fabric_sale_to_merchant"
      ).length,
      yarn_sale: transactions.filter(
        (t: any) => t.type === "yarn_sale" || t.type === "yarn_sale_to_weaver"
      ).length,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      const id = t.transactionId ?? String(t.directTransactionId ?? "");
      const matchesType =
        typeFilter === "all" ||
        t.type === typeFilter ||
        (typeFilter === "fabric_purchase" && t.type === "fabric_purchase_from_weaver") ||
        (typeFilter === "yarn_sale" && t.type === "yarn_sale_to_weaver") ||
        (typeFilter === "fabric_sale" && t.type === "fabric_sale_to_merchant");

      const matchesStatus =
        statusFilter === "all" ||
        t.status === statusFilter ||
        t.paymentStatus === statusFilter;
      const q = search.toLowerCase().trim();
      const typeStr = t.type
        ? TXN_TYPE_LABELS[t.type] || t.type
        : t.transactionType || "";
      const matchesSearch =
        !q ||
        id.toLowerCase().includes(q) ||
        counterpartyLabel(t).toLowerCase().includes(q) ||
        typeStr.toLowerCase().includes(q) ||
        itemsSummary(t).toLowerCase().includes(q);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [transactions, typeFilter, statusFilter, search]);

  const openPaymentModal = (txn: any) => {
    const total = parseFloat(String(txn.totalAmount || "0"));
    const paid = parseFloat(String(txn.amountPaid ?? txn.paidAmount ?? "0"));
    const balance = Math.max(0, total - paid);

    setPaymentModalTxn(txn);
    setPayAmount(balance > 0 ? String(balance) : "");
    setPayMethod("Cash");
    setCustomPayMethod("");
    setPayNotes("");
    setPayError("");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalTxn) return;

    const id = paymentModalTxn.transactionId ?? String(paymentModalTxn.directTransactionId);
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError("Please enter a valid positive payment amount.");
      return;
    }

    const method = payMethod === "Other" ? (customPayMethod.trim() || "Other") : payMethod;

    setPayBusy(true);
    setPayError("");
    try {
      await transactionsApi.addPayment(id, {
        amount: amt,
        paymentMethod: method,
        notes: payNotes.trim() || undefined,
      });

      setSuccessMessage(
        `Payment of ${amt.toLocaleString()} ETB successfully recorded for transaction #${id}.`
      );
      setTimeout(() => setSuccessMessage(""), 5000);
      setPaymentModalTxn(null);
      loadTransactions();
    } catch (err: any) {
      setPayError(err.message || "Failed to record payment. Please try again.");
    } finally {
      setPayBusy(false);
    }
  };

  const modalBalance = paymentModalTxn
    ? Math.max(
        0,
        parseFloat(String(paymentModalTxn.totalAmount || "0")) -
          parseFloat(String(paymentModalTxn.amountPaid ?? paymentModalTxn.paidAmount ?? "0"))
      )
    : 0;

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
            Procure raw yarn, purchase artisan fabric, or record bulk commercial sales. Click any transaction to view details.
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

      {/* Transaction Type Filter Pills */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <button
          type="button"
          className={typeFilter === "all" ? "tab-pill active" : "tab-pill"}
          onClick={() => setTypeFilter("all")}
        >
          All Transactions ({typeCounts.all})
        </button>
        <button
          type="button"
          className={typeFilter === "yarn_purchase" ? "tab-pill active" : "tab-pill"}
          onClick={() => setTypeFilter("yarn_purchase")}
        >
          🧶 Yarn Purchases ({typeCounts.yarn_purchase})
        </button>
        <button
          type="button"
          className={typeFilter === "fabric_purchase" ? "tab-pill active" : "tab-pill"}
          onClick={() => setTypeFilter("fabric_purchase")}
        >
          🪢 Fabric Purchases ({typeCounts.fabric_purchase})
        </button>
        <button
          type="button"
          className={typeFilter === "fabric_sale" ? "tab-pill active" : "tab-pill"}
          onClick={() => setTypeFilter("fabric_sale")}
        >
          🏬 Fabric Sales ({typeCounts.fabric_sale})
        </button>
        <button
          type="button"
          className={typeFilter === "yarn_sale" ? "tab-pill active" : "tab-pill"}
          onClick={() => setTypeFilter("yarn_sale")}
        >
          🧵 Yarn Sales ({typeCounts.yarn_sale})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <input
          className="search-input"
          placeholder="🔍 Search transactions by ID, party, or items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {["all", "unpaid", "partially_paid", "paid", "cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              className={statusFilter === st ? "tab-pill active" : "tab-pill"}
              onClick={() => setStatusFilter(st)}
              style={{ fontSize: "12px", padding: "0.35rem 0.75rem" }}
            >
              {st === "all" ? "All Statuses" : TXN_STATUS_LABELS[st] ?? st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {successMessage && (
        <div className="success-msg" style={{ marginBottom: "1rem" }}>
          <span>✅</span> {successMessage}
        </div>
      )}

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
              <th>Items / ዕቃ</th>
              <th>Counterparty</th>
              <th style={{ textAlign: "right" }}>Total Amount</th>
              <th style={{ textAlign: "right" }}>Amount Paid</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <span className="empty-icon">🔄</span>
                    <p style={{ fontWeight: 600, color: "var(--text)" }}>
                      {search || statusFilter !== "all" || typeFilter !== "all"
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
              filteredTransactions.map((txn: any) => {
                const id = txn.transactionId ?? String(txn.directTransactionId ?? "");
                const typeLabel = txn.type
                  ? TXN_TYPE_LABELS[txn.type] || txn.type
                  : txn.transactionType || "Transaction";
                const status = txn.status ?? txn.paymentStatus ?? "unpaid";
                const totalAmt = String(txn.totalAmount || "0");
                const paidAmt = String(txn.amountPaid ?? txn.paidAmount ?? "0");
                const canPay = isPaymentEligible(txn);

                return (
                  <tr
                    key={id}
                    className="clickable-row"
                    onClick={() => navigate(`/admin/transactions/${id}`)}
                    title="Click row to view full transaction details"
                  >
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "var(--accent)",
                        }}
                      >
                        {id}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{typeLabel}</td>
                    <td style={{ fontSize: "12.5px" }}>{itemsSummary(txn)}</td>
                    <td>{counterpartyLabel(txn)}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                      }}
                    >
                      {parseFloat(totalAmt).toLocaleString()} ETB
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        color: balanceColor(totalAmt, paidAmt),
                      }}
                    >
                      {parseFloat(paidAmt).toLocaleString()} ETB
                    </td>
                    <td>
                      <span className={`badge ${status}`}>
                        {TXN_STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>
                      {formatDateDDMMYY(txn.transactionDate ?? txn.createdAt)}
                    </td>
                    <td
                      style={{ textAlign: "right", whiteSpace: "nowrap" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canPay ? (
                        <button
                          type="button"
                          className="btn-sm primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentModal(txn);
                          }}
                          title="Record installment payment (mobile functionality)"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <span>💳</span> Record Payment
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            fontWeight: 500,
                          }}
                        >
                          View Details →
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal Dialog */}
      {paymentModalTxn && (
        <div
          className="modal-overlay"
          onClick={() => !payBusy && setPaymentModalTxn(null)}
        >
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3 className="modal-title">
                <span>💳</span> Record Payment / ክፍያ መዝግብ
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !payBusy && setPaymentModalTxn(null)}
                disabled={payBusy}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                {/* Transaction Summary Card */}
                <div
                  style={{
                    background: "var(--bg-subtle)",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "var(--accent)",
                      }}
                    >
                      #{paymentModalTxn.transactionId ?? paymentModalTxn.directTransactionId}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {paymentModalTxn.type
                        ? TXN_TYPE_LABELS[paymentModalTxn.type] || paymentModalTxn.type
                        : paymentModalTxn.transactionType || "Transaction"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "0.75rem",
                    }}
                  >
                    Counterparty: {counterpartyLabel(paymentModalTxn)}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.5rem",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--text-muted)" }}>Total:</div>
                      <div style={{ fontWeight: 700 }}>
                        {parseFloat(
                          String(paymentModalTxn.totalAmount || "0")
                        ).toLocaleString()}{" "}
                        ETB
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)" }}>Paid:</div>
                      <div style={{ fontWeight: 700, color: "var(--green)" }}>
                        {parseFloat(
                          String(
                            paymentModalTxn.amountPaid ??
                              paymentModalTxn.paidAmount ??
                              "0"
                          )
                        ).toLocaleString()}{" "}
                        ETB
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)" }}>Balance Due:</div>
                      <div style={{ fontWeight: 700, color: "var(--accent)" }}>
                        {modalBalance.toLocaleString()} ETB
                      </div>
                    </div>
                  </div>
                </div>

                {payError && (
                  <div className="error-msg">
                    <span>⚠️</span> {payError}
                  </div>
                )}

                <label>
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Payment Amount (ETB) / የክፍያ መጠን *</span>
                    {modalBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setPayAmount(String(modalBalance))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent)",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: 600,
                          padding: 0,
                        }}
                      >
                        Pay Full Balance ({modalBalance.toLocaleString()} ETB)
                      </button>
                    )}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={modalBalance > 0 ? modalBalance : undefined}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={`e.g. ${modalBalance > 0 ? modalBalance : 500}`}
                    required
                    autoFocus
                  />
                </label>

                <label>
                  <span>Payment Method / የክፍያ መንገድ *</span>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    style={{ height: 42 }}
                  >
                    <option value="Cash">Cash (ጥሬ ገንዘብ)</option>
                    <option value="Telebirr">Telebirr (ቴሌብር)</option>
                    <option value="CBE Bank">
                      Commercial Bank of Ethiopia (CBE / ንግድ ባንክ)
                    </option>
                    <option value="Awash Bank">Awash Bank (አዋሽ ባንክ)</option>
                    <option value="Bank of Abyssinia">
                      Bank of Abyssinia (አቢሲኒያ ባንክ)
                    </option>
                    <option value="Check">Check / ቼክ</option>
                    <option value="Other">Other / ሌላ</option>
                  </select>
                </label>

                {payMethod === "Other" && (
                  <label>
                    <span>Specify Payment Method *</span>
                    <input
                      value={customPayMethod}
                      onChange={(e) => setCustomPayMethod(e.target.value)}
                      placeholder="e.g. Dashen Bank, Coop Bank"
                      required
                    />
                  </label>
                )}

                <label>
                  <span>Reference / Notes (optional)</span>
                  <input
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="e.g. Deposit slip #, mobile transfer ref..."
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setPaymentModalTxn(null)}
                  disabled={payBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={payBusy || !payAmount || Number(payAmount) <= 0}
                >
                  {payBusy ? "Recording…" : "✓ Record Payment / ክፍያ መዝግብ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionsHubPage;