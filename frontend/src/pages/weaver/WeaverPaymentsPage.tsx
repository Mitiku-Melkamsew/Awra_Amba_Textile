import { useEffect, useState } from "react";
import { weaverPortalService, type WeaverPaymentRecord } from "../../infrastructure/services";
import { formatDateDDMMYY } from "../../utils/formatDate";
import { toTitleCase } from "../../utils/formatters";

export function WeaverPaymentsPage() {
  const [payments, setPayments] = useState<WeaverPaymentRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    weaverPortalService
      .listPayments()
      .then(setPayments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const totalEarnings = payments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );

  const handleDownloadReceipt = async (paymentId: number) => {
    setError("");
    try {
      await weaverPortalService.downloadPaymentReceiptCsv(paymentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download receipt");
    }
  };

  return (
    <div>
      {/* ── Page Header (Image 3) ── */}
      <div className="weaver-page-header">
        <h1 className="weaver-page-title">Payments · የተከፈለ ሂሳብ</h1>
        <p className="weaver-page-subtitle">Your settled payments</p>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1.25rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Total Received Highlight Card (Image 3) ── */}
      <div className="weaver-payments-hero">
        <div className="weaver-payments-hero-label">Total received</div>
        <div className="weaver-payments-hero-total">
          {Math.round(totalEarnings).toLocaleString()} ETB
        </div>
      </div>

      {/* ── Payment Cards List (Image 3) ── */}
      {loading ? (
        <div className="loading" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <span>⏳</span> Loading payment records…
        </div>
      ) : payments.length === 0 ? (
        <div className="weaver-stat-card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>💳</span>
          <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "var(--text)" }}>No payments recorded yet.</p>
          <span style={{ fontSize: "0.85rem" }}>
            When you return woven fabric and an admin confirms batch settlement, your payout and receipt will appear here.
          </span>
        </div>
      ) : (
        <div>
          {payments.map((p) => {
            const amountNum = Number(p.amount || 0);
            const dateStr = p.paymentDate ? formatDateDDMMYY(p.paymentDate) : "—";
            const methodStr = toTitleCase(p.paymentMethod || "Cash");

            return (
              <div key={p.paymentId} className="weaver-payment-card">
                <div>
                  <div className="weaver-payment-amount">
                    {Math.round(amountNum).toLocaleString()} ETB
                  </div>
                  <div className="weaver-payment-sub">
                    {dateStr} · {methodStr}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(p.paymentId)}
                  className="weaver-receipt-btn"
                >
                  <span>⬇</span>
                  <span>Receipt</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WeaverPaymentsPage;
