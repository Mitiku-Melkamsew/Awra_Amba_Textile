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
      <div className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Settlement</p>
          <h1 className="page-title">Settlement History</h1>
          <p className="page-subtitle">Every confirmed batch settlement, newest first.</p>
        </div>
        <Link to="/admin/settlement" className="btn-ghost">
          ← Back to settlement
        </Link>
      </div>

      {error && <div className="error-msg"><span>⚠️</span> {error}</div>}
      {!rows && !error && <p className="muted">Loading…</p>}

      {rows && rows.length === 0 && (
        <div className="empty-state">
          <p>No batch settlement has been confirmed yet.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Confirmed on</th>
                  <th>Reference</th>
                  <th>Cutoff</th>
                  <th style={{ textAlign: "right" }}>Weavers</th>
                  <th style={{ textAlign: "right" }}>Total paid (ETB)</th>
                  <th>Method</th>
                  <th>Confirmed by</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.previewId}>
                    <td>{row.committedAt ? formatDateDDMMYY(row.committedAt) : "—"}</td>
                    <td><code>{row.previewId}</code></td>
                    <td>{row.cutoffDate ? formatDateDDMMYY(row.cutoffDate) : "—"}</td>
                    <td style={{ textAlign: "right" }}>{row.weaverCount}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {Math.round(row.paidTotal).toLocaleString()}
                    </td>
                    <td>{row.paymentMethod ?? "—"}</td>
                    <td>{row.confirmedBy}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Link
                        to={`/admin/settlement/preview/${row.previewId}`}
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: "0.2rem 0.5rem" }}
                      >
                        View
                      </Link>{" "}
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: "0.2rem 0.5rem" }}
                        onClick={() => reportsApi.downloadBatchHisabCsv(row.previewId)}
                      >
                        CSV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
