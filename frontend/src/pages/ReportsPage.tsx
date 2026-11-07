import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { paymentsApi, reportsApi } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";

interface Payment {
  paymentId: number;
  amount: string;
  paymentDate: string;
  weaver: { firstName: string; lastName: string };
}

export function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi
      .list()
      .then(setPayments)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase().trim();
    return payments.filter(
      (p) =>
        String(p.paymentId).includes(q) ||
        p.weaver.firstName.toLowerCase().includes(q) ||
        p.weaver.lastName.toLowerCase().includes(q)
    );
  }, [payments, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ሪፖርት / Official Records</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">HISAB Settlement Reports</h1>
            <span className="badge badge-gray">{payments.length} Payments</span>
          </div>
          <p className="page-subtitle">
            Download official CSV export ledgers and generate printable HISAB receipts for committed artisan settlements.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          className="search-input"
          placeholder="🔍 Search payments by weaver name or payment ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Table Card */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Artisan Weaver</th>
              <th>Settlement Date</th>
              <th style={{ textAlign: "right" }}>Amount (ETB)</th>
              <th style={{ textAlign: "right" }}>Official Documents</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <div className="loading"><span>⏳</span> Loading payment records…</div>
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <p style={{ fontWeight: 600, color: "var(--text)" }}>
                      {search ? "No payments match your search criteria." : "No committed payments yet."}
                    </p>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Recorded payments from the Settlement workflow will appear here automatically.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                    #{payment.paymentId}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {payment.weaver.firstName} {payment.weaver.lastName}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {formatDateDDMMYY(payment.paymentDate)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green)" }}>
                    {parseFloat(payment.amount || "0").toLocaleString()} ETB
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => reportsApi.downloadHisabCsv(payment.paymentId)}
                      >
                        ⬇ HISAB CSV
                      </button>
                      <Link
                        to={`/admin/reports/hisab/${payment.paymentId}?print=1`}
                        className="btn-sm primary"
                        target="_blank"
                      >
                        🖨 Printable Receipt
                      </Link>
                    </div>
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

export default ReportsPage;
