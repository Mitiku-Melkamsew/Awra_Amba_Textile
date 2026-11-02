import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { calculationsApi, reportsApi } from "../../api";
import type { CommittedSettlementSummary } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

export function SettlementHistoryPage() {
  const [rows, setRows] = useState<CommittedSettlementSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    calculationsApi
      .settlementHistory()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load history"));
  }, []);

  return (
    <div className="page">
      <Link to="/admin/settlement" className="back-link">
        ← Back to Settlement / ወደ ሂሳብ ማጠቃለያ
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Past Settlements</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Settlement History</h1>
            {rows && <span className="badge badge-gray">{rows.length} Batches</span>}
          </div>
          <p className="page-subtitle">Every confirmed batch settlement and official payroll distribution, newest first.</p>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: "1rem" }}><span>⚠️</span> {error}</div>}
      {!rows && !error && <div className="loading"><span>⏳</span> Loading history…</div>}

      {rows && rows.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📜</span>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>No batch settlement has been confirmed yet.</p>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Go to the Settlement page to generate and commit your first artisan payroll.
          </span>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Confirmed Date</th>
                <th>Batch Reference</th>
                <th>Cutoff Date</th>
                <th style={{ textAlign: "right" }}>Weavers Paid</th>
                <th style={{ textAlign: "right" }}>Total Paid (ETB)</th>
                <th>Method</th>
                <th>Confirmed By</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.previewId}>
                  <td style={{ color: "var(--text-muted)" }}>
                    {row.committedAt ? formatDateDDMMYY(row.committedAt) : "—"}
                  </td>
                  <td>
                    <code style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                      {row.previewId}
                    </code>
                  </td>
                  <td>{row.cutoffDate ? formatDateDDMMYY(row.cutoffDate) : "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{row.weaverCount}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green)" }}>
                    {Math.round(row.paidTotal).toLocaleString()} ETB
                  </td>
                  <td>
                    <span className="badge badge-gray">{row.paymentMethod ?? "Standard"}</span>
                  </td>
                  <td>{row.confirmedBy}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                      <Link
                        to={`/admin/settlement/preview/${row.previewId}`}
                        className="btn-sm"
                      >
                        🖨 Document
                      </Link>
                      <button
                        type="button"
                        className="btn-sm primary"
                        onClick={() => reportsApi.downloadBatchHisabCsv(row.previewId)}
                      >
                        ⬇ CSV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SettlementHistoryPage;
