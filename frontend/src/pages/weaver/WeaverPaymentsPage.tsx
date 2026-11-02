import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reportsApi, weaverPortalApi } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

interface PaymentRow {
  paymentId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
}

export function WeaverPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    weaverPortalApi
      .payments()
      .then(setPayments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalEarnings = payments.reduce(
    (acc, p) => acc + (parseFloat(p.amount) || 0),
    0
  );

  return (
    <div className="page">
      <Link to="/weaver" className="back-link">
        ← Back to My Work Orders / ወደ ዝግ ዝርዝር
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow" style={{ background: "#D1FAE5", color: "#065F46" }}>
            የተከፈለ ሂሳብ / Payment History
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">My Settled Payments</h1>
            <span className="badge badge-green">{payments.length} Settlements</span>
          </div>
          <p className="page-subtitle">
            All confirmed batch payroll distributions and downloadable official HISAB receipts.
          </p>
        </div>

        {payments.length > 0 && (
          <div className="card card-sm" style={{ padding: "0.6rem 1rem", background: "#FFFFFF", borderColor: "#A7F3D0" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
              Total Earnings Received
            </span>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--green)" }}>
              {Math.round(totalEarnings).toLocaleString()} ETB
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Payment Reference</th>
              <th>Date Settled</th>
              <th>Payment Method</th>
              <th style={{ textAlign: "right" }}>Amount (ETB)</th>
              <th style={{ textAlign: "right" }}>Official Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <div className="loading"><span>⏳</span> Loading payment records…</div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <span className="empty-icon">💳</span>
                    <p style={{ fontWeight: 600, color: "var(--text)" }}>
                      No payment distributions recorded yet.
                    </p>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      When you return woven fabric and an admin runs batch settlement, your payout will appear here.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--green)" }}>
                    #{payment.paymentId}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {formatDateDDMMYY(payment.paymentDate)}
                  </td>
                  <td>
                    <span className="badge badge-gray">
                      {payment.paymentMethod ?? "Cash / Bank Transfer"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                    {parseFloat(payment.amount || "0").toLocaleString()} ETB
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn-sm primary"
                      style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", border: "none" }}
                      onClick={() => reportsApi.downloadHisabCsv(payment.paymentId)}
                    >
                      ⬇ Download HISAB CSV
                    </button>
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

export default WeaverPaymentsPage;
