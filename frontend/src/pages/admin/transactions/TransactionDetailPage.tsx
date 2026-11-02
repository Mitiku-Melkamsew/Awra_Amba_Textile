import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { transactionsApi, type CommercialTransaction } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { TXN_STATUS_LABELS, TXN_TYPE_LABELS } from "../../../utils/transactionTypes";

function lineLabel(line: CommercialTransaction["lines"][0]): string {
  if (line.yarnVariant) {
    const v = line.yarnVariant;
    return [v.yarnType?.materialName, v.color?.name, v.supplier?.name, v.sku]
      .filter(Boolean)
      .join(" · ");
  }
  if (line.fabricVariant) {
    const v = line.fabricVariant;
    return [v.product.name, v.sku].filter(Boolean).join(" · ");
  }
  return line.description ?? "Line";
}

export function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [txn, setTxn] = useState<CommercialTransaction | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!transactionId) return;
    setTxn(await transactionsApi.get(transactionId));
  }, [transactionId]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const balance =
    txn ? Math.max(0, Number(txn.totalAmount) - Number(txn.amountPaid)) : 0;
  const isStockTxn = txn && txn.type !== "weaver_payout";
  const fullyDelivered =
    txn &&
    isStockTxn &&
    txn.lines.every((l) => Number(l.deliveredQuantity) >= Number(l.quantity));

  async function handleDeliver() {
    if (!transactionId) return;
    setBusy(true);
    setError("");
    try {
      await transactionsApi.deliver(transactionId);
      setMessage("Delivery confirmed. Inventory snapshots updated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePayment(event: FormEvent) {
    event.preventDefault();
    if (!transactionId || !payAmount) return;
    setBusy(true);
    setError("");
    try {
      await transactionsApi.addPayment(transactionId, {
        amount: Number(payAmount),
        paymentMethod: payMethod || undefined,
        notes: payNotes || undefined,
      });
      setMessage("Payment installment recorded.");
      setPayAmount("");
      setPayMethod("");
      setPayNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment recording failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!transactionId || !confirm("Are you sure you want to cancel this transaction?")) return;
    setBusy(true);
    try {
      await transactionsApi.cancel(transactionId);
      setMessage("Transaction cancelled.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  if (!txn && !error) {
    return (
      <div className="page">
        <div className="loading"><span>⏳</span> Loading transaction #{transactionId}…</div>
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="page">
        <div className="error-msg"><span>⚠️</span> {error}</div>
        <Link to="/admin/transactions" className="back-link">Back to Transactions</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/admin/transactions" className="back-link">
        ← Back to Transactions / ወደ ግብይት
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">{TXN_TYPE_LABELS[txn.type]}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Transaction #{txn.transactionId}</h1>
            <span className={`badge ${txn.status}`}>
              {TXN_STATUS_LABELS[txn.status] ?? txn.status}
            </span>
          </div>
          <p className="page-subtitle">
            Created on {formatDateDDMMYY(txn.createdAt)}
            {txn.deliveredAt && ` · Delivered on ${formatDateDDMMYY(txn.deliveredAt)}`}
            {txn.notes && ` · Note: "${txn.notes}"`}
          </p>
        </div>

        {txn.status !== "completed" && txn.status !== "cancelled" && (
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={handleCancel}
            disabled={busy}
          >
            Cancel Transaction
          </button>
        )}
      </div>

      {message && <div className="success-msg" style={{ marginBottom: "1rem" }}><span>✅</span> {message}</div>}
      {error && <div className="error-msg" style={{ marginBottom: "1rem" }}><span>⚠️</span> {error}</div>}

      {/* Financial Overview Cards */}
      <div className="stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card">
          <span className="stat-card-label">Total Commercial Amount</span>
          <div className="stat-card-value">
            {parseFloat(txn.totalAmount || "0").toLocaleString()} ETB
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Amount Paid to Date</span>
          <div className="stat-card-value" style={{ color: "var(--green)" }}>
            {parseFloat(txn.amountPaid || "0").toLocaleString()} ETB
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Remaining Balance Due</span>
          <div className="stat-card-value" style={{ color: balance > 0 ? "var(--accent)" : "var(--green)" }}>
            {balance.toLocaleString()} ETB
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.5rem", marginTop: "0.5rem" }}>
        {/* Left Column: Lines and Delivery */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Lines Table Card */}
          <div className="card">
            <h3 className="section-title" style={{ margin: "0 0 1rem" }}>
              <span>📦</span> Line Items ({txn.lines.length})
            </h3>
            <div className="table-wrap" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Ordered</th>
                    {isStockTxn && <th>Delivered</th>}
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {txn.lines.map((line) => {
                    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
                    return (
                      <tr key={line.lineId}>
                        <td style={{ fontWeight: 600 }}>{lineLabel(line)}</td>
                        <td>{line.quantity}</td>
                        {isStockTxn && (
                          <td>
                            <span style={{ fontWeight: 600, color: Number(line.deliveredQuantity) >= Number(line.quantity) ? "var(--green)" : "var(--accent)" }}>
                              {line.deliveredQuantity} / {line.quantity}
                            </span>
                          </td>
                        )}
                        <td style={{ textAlign: "right" }}>{line.unitPrice} ETB</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {lineSubtotal.toLocaleString()} ETB
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Confirmation */}
          {isStockTxn && txn.status !== "cancelled" && txn.status !== "completed" && (
            <div className="card" style={{ background: fullyDelivered ? "var(--green-bg)" : "var(--surface)", border: fullyDelivered ? "1px solid var(--green-border)" : "1px solid var(--border)" }}>
              <h3 className="section-title" style={{ margin: "0 0 0.5rem" }}>
                <span>🚚</span> Physical Goods Delivery
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 1rem" }}>
                Confirming physical delivery immediately updates on-hand inventory snapshots in the Stock module.
              </p>
              {!fullyDelivered ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleDeliver}
                  disabled={busy}
                >
                  ✓ Confirm Delivery & Adjust Stock / ዕቃውን ተረከብ
                </button>
              ) : (
                <span className="badge badge-green" style={{ fontSize: "13px", padding: "0.4rem 0.85rem" }}>
                  ✓ All inventory lines successfully delivered & updated in stock
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Payments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Payment Form */}
          {txn.type !== "weaver_payout" &&
            txn.status !== "cancelled" &&
            txn.status !== "completed" && (
              <form className="card form" onSubmit={handlePayment}>
                <h3 className="section-title" style={{ margin: 0 }}>
                  <span>💳</span> Record Payment Installment
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "-0.5rem" }}>
                  Outstanding balance: <strong>{balance.toLocaleString()} ETB</strong>
                </p>

                <div className="form-row">
                  <label>
                    <span>Amount (ETB)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={balance > 0 ? String(balance) : "Amount"}
                      required
                    />
                  </label>
                  <label>
                    <span>Method / መንገድ</span>
                    <input
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      placeholder="e.g. Telebirr, CBE Bank, Cash"
                    />
                  </label>
                </div>

                <label>
                  <span>Payment Notes (optional)</span>
                  <input
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Check or reference number"
                  />
                </label>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={busy}>
                    + Add Payment Installment
                  </button>
                </div>
              </form>
            )}

          {/* Payment History Card */}
          <div className="card">
            <h3 className="section-title" style={{ margin: "0 0 0.85rem" }}>
              <span>📜</span> Recorded Payments
              <span className="count">{txn.payments.length}</span>
            </h3>

            {txn.payments.length === 0 ? (
              <div className="empty-state" style={{ padding: "1.5rem" }}>
                <span className="empty-icon" style={{ fontSize: "1.5rem" }}>💸</span>
                <span style={{ fontSize: "13px" }}>No payments recorded yet.</span>
              </div>
            ) : (
              <ul className="record-list">
                {txn.payments.map((p) => (
                  <li key={p.installmentId} className="record-item">
                    <div className="record-main">
                      <div className="record-title" style={{ color: "var(--green)" }}>
                        +{parseFloat(p.amount).toLocaleString()} ETB
                        {p.paymentMethod && ` (${p.paymentMethod})`}
                      </div>
                      <div className="record-meta">
                        {formatDateDDMMYY(p.paymentDate)}
                        {p.notes && ` · "${p.notes}"`}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailPage;
