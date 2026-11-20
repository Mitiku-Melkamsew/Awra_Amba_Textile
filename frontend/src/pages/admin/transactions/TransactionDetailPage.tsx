import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { transactionsApi } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";

function lineName(line: any): string {
  if (line.fabricVariant) {
    const f = line.fabricVariant;
    const fabricName = f.fabric?.name || "medebegna";
    const warp = f.warpColor?.name || f.color?.name || "";
    const weft = f.weftColor?.name || "";
    const design = f.design?.name || "";
    const parts = [fabricName, warp, weft, design].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : f.sku || "Fabric";
  }
  if (line.yarnVariant) {
    const y = line.yarnVariant;
    const yarnName = y.yarn?.name || "Yarn";
    const color = y.color?.name || "";
    const parts = [yarnName, color, y.sku].filter(Boolean);
    return parts.join(" · ");
  }
  return line.description || "Item";
}

function counterpartyTitle(txn: any): { label: string; name: string; phone?: string } {
  if (txn.merchant) {
    return {
      label: "Merchant · ገዢ ነጋዴ",
      name: txn.merchant.companyName || txn.merchant.fullName || `Merchant #${txn.merchant.userId}`,
      phone: txn.merchant.contactPhone || txn.merchant.phone,
    };
  }
  if (txn.weaver) {
    return {
      label: "Weaver · ሸማኔ",
      name: txn.weaver.fullName || `Weaver #${txn.weaver.userId}`,
      phone: txn.weaver.phone,
    };
  }
  if (txn.supplier) {
    return {
      label: "Supplier · አቅራቢ",
      name: txn.supplier.name || "Supplier",
      phone: txn.supplier.contactPhone,
    };
  }
  return { label: "Counterparty", name: "—" };
}

function getTypeBadge(type: string) {
  switch (type) {
    case "fabric_sale_to_merchant":
      return { label: "Sell fabric", bg: "#e0f2fe", text: "#0369a1" };
    case "fabric_purchase_from_weaver":
      return { label: "Buy fabric", bg: "#f0fdf4", text: "#166534" };
    case "yarn_sale_to_weaver":
      return { label: "Sell yarn", bg: "#eff6ff", text: "#1d4ed8" };
    case "yarn_purchase":
      return { label: "Buy yarn", bg: "#f1f5f9", text: "#334155" };
    default:
      return { label: type || "Transaction", bg: "#f1f5f9", text: "#475569" };
  }
}

export function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [txn, setTxn] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const load = useCallback(async () => {
    if (!transactionId) return;
    const res = await transactionsApi.get(transactionId);
    setTxn(res);
    const total = Number(res?.totalAmount || 0);
    const paid = Number(res?.amountPaid ?? 0);
    const bal = Math.max(0, total - paid);
    setPayAmount(bal > 0 ? String(bal) : "");
  }, [transactionId]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const total = Number(txn?.totalAmount || 0);
  const paid = Number(txn?.amountPaid ?? 0);
  const balance = Math.max(0, total - paid);
  const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : (paid > 0 ? 100 : 0);

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
      setMessage("Payment installment recorded successfully.");
      setTimeout(() => setMessage(""), 5000);
      await load();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Payment recording failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmCancel() {
    if (!transactionId) return;
    setBusy(true);
    try {
      await transactionsApi.cancel(transactionId);
      setMessage("Transaction has been cancelled and inventory adjusted.");
      setShowCancelModal(false);
      await load();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  if (!txn && !error) {
    return (
      <div style={{ width: "100%", padding: "2rem", textAlign: "center", color: "#64748b" }}>
        Loading transaction #{transactionId}…
      </div>
    );
  }

  if (!txn) {
    return (
      <div style={{ width: "100%", padding: "2rem" }}>
        <div style={{ background: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
        <Link to="/admin/transactions" style={{ color: "#c2410c", fontWeight: 600 }}>
          ← Back to Transactions
        </Link>
      </div>
    );
  }

  const cp = counterpartyTitle(txn);
  const typeBadge = getTypeBadge(txn.type);

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem 3rem" }}>
      {/* Back link */}
      <div style={{ marginBottom: "0.75rem" }}>
        <Link
          to="/admin/transactions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "#c2410c",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          <span>&lt;</span> Transactions
        </Link>
      </div>

      {/* Title & Metadata Row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Transaction [{txn.transactionId}]
        </h1>

        <span
          style={{
            background: typeBadge.bg,
            color: typeBadge.text,
            fontSize: "13px",
            fontWeight: 600,
            padding: "0.25rem 0.65rem",
            borderRadius: "999px",
          }}
        >
          {typeBadge.label}
        </span>

        {txn.status === "paid" ? (
          <span style={{ background: "#dcfce7", color: "#166534", fontSize: "13px", fontWeight: 600, padding: "0.25rem 0.65rem", borderRadius: "999px" }}>
            ✓ Paid
          </span>
        ) : txn.status === "partly_paid" ? (
          <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "13px", fontWeight: 600, padding: "0.25rem 0.65rem", borderRadius: "999px" }}>
            Partly paid
          </span>
        ) : txn.status === "cancelled" ? (
          <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "13px", fontWeight: 600, padding: "0.25rem 0.65rem", borderRadius: "999px" }}>
            Cancelled
          </span>
        ) : (
          <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "13px", fontWeight: 600, padding: "0.25rem 0.65rem", borderRadius: "999px" }}>
            Unpaid
          </span>
        )}

        <span style={{ fontSize: "13.5px", color: "#64748b", marginLeft: "0.5rem" }}>
          [{formatDateDDMMYY(txn.transactionDate || txn.createdAt)}] · recorded by [admin]
        </span>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>✓</span> {message}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* 2-Column Split Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 380px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Counterparty, Items, Notes, Cancel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Counterparty Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.35rem" }}>
              {cp.label}
            </div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
              [{cp.name}] {cp.phone ? `· [${cp.phone}]` : ""}
            </div>
          </div>

          {/* Items Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Items
            </h3>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12.5px" }}>
                  <th style={{ padding: "0.6rem 0", fontWeight: 600 }}>Item</th>
                  <th style={{ padding: "0.6rem 0.5rem", fontWeight: 600, textAlign: "center" }}>Ordered</th>
                  <th style={{ padding: "0.6rem 0.5rem", fontWeight: 600, textAlign: "center" }}>Delivered</th>
                  <th style={{ padding: "0.6rem 0.5rem", fontWeight: 600, textAlign: "right" }}>Unit price</th>
                  <th style={{ padding: "0.6rem 0", fontWeight: 600, textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(txn.lines || []).map((line: any) => {
                  const unitPrice = Number(line.unitPrice || 0);
                  const qty = Number(line.quantity || 0);
                  const subtotal = Number(line.lineTotal || qty * unitPrice);

                  return (
                    <tr key={line.lineId || Math.random()} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "#0f172a" }}>
                        {lineName(line)}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#334155" }}>
                        {qty}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", color: "#334155" }}>
                        {qty}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", color: "#334155" }}>
                        [{unitPrice.toLocaleString()}]
                      </td>
                      <td style={{ padding: "0.75rem 0", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        [{subtotal.toLocaleString()}]
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr style={{ borderTop: "2px solid #0f172a" }}>
                  <td colSpan={4} style={{ padding: "0.85rem 0", fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>
                    Total
                  </td>
                  <td style={{ padding: "0.85rem 0", textAlign: "right", fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>
                    [{total.toLocaleString()}] ETB
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 700, color: "#64748b" }}>
              Notes
            </h3>
            <div style={{ fontSize: "14px", color: txn.notes ? "#0f172a" : "#94a3b8" }}>
              {txn.notes ? `[${txn.notes}]` : "No notes recorded."}
            </div>
          </div>

          {/* Cancel this transaction standout link */}
          {txn.status !== "cancelled" && (
            <div style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#dc2626",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                Cancel this transaction...
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Payment & Payment History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Payment Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.25rem", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
              Payment
            </h3>
            <div style={{ fontSize: "13.5px", color: "#64748b", marginBottom: "0.85rem" }}>
              Paid [{paid.toLocaleString()}] of [{total.toLocaleString()}] ETB
            </div>

            {/* Green Progress Bar */}
            <div
              style={{
                background: "#e2e8f0",
                height: "8px",
                borderRadius: "999px",
                overflow: "hidden",
                marginBottom: "0.6rem",
              }}
            >
              <div
                style={{
                  background: "#059669",
                  height: "100%",
                  width: `${percentPaid}%`,
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13.5px", marginBottom: "1.25rem" }}>
              <span style={{ color: "#64748b" }}>{percentPaid}% paid</span>
              <span style={{ color: "#c2410c", fontWeight: 700 }}>Balance [{balance.toLocaleString()}] ETB</span>
            </div>

            {/* Form */}
            {txn.status === "cancelled" ? (
              <div style={{ padding: "0.85rem", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", fontSize: "13px", textAlign: "center" }}>
                Transaction is cancelled. Payments are closed.
              </div>
            ) : balance <= 0 ? (
              <div style={{ padding: "0.85rem", background: "#f0fdf4", color: "#166534", borderRadius: "8px", fontSize: "13.5px", textAlign: "center", fontWeight: 700 }}>
                ✓ Fully paid
              </div>
            ) : (
              <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      Amount (ETB)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Amount"
                      required
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      Method
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        background: "#ffffff",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank transfer">Bank transfer</option>
                      <option value="Telebirr">Telebirr</option>
                      <option value="CBE Birr">CBE Birr</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    background: "#c2410c",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.7rem",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: busy ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(194, 65, 12, 0.2)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!busy) e.currentTarget.style.background = "#9a3412";
                  }}
                  onMouseOut={(e) => {
                    if (!busy) e.currentTarget.style.background = "#c2410c";
                  }}
                >
                  {busy ? "Recording…" : "Record payment"}
                </button>

                <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
                  Defaults to the full balance. You can pay less now and the rest later.
                </div>
              </form>
            )}
          </div>

          {/* Payment History Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Payment history
            </h3>

            {(txn.payments || []).length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: "13.5px" }}>
                No payments recorded yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {txn.payments.map((p: any) => (
                  <div
                    key={p.paymentId || Math.random()}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "0.85rem",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                        [{Number(p.amount || 0).toLocaleString()}] ETB · {p.paymentMethod || "Cash"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "0.15rem" }}>
                        [{formatDateDDMMYY(p.paymentDate || p.createdAt)}] · by [admin]
                      </div>
                    </div>

                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                      }}
                    >
                      ✓ Recorded
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "18px", fontWeight: 800, color: "#991b1b" }}>
              Cancel Transaction [{txn.transactionId}]?
            </h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              Are you sure you want to cancel this transaction? Inventory stocks will be restored to their previous state, and this transaction will be marked as cancelled.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={busy}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#475569",
                }}
              >
                Keep transaction
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={busy}
                style={{
                  background: "#dc2626",
                  border: "none",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                {busy ? "Cancelling…" : "Yes, cancel transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionDetailPage;
