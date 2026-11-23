import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDateDDMMYY } from "../../utils/formatDate";
import type { CommittedSettlementSummary } from "../../api";

export interface SettlementRunsTabProps {
  batches: CommittedSettlementSummary[];
  loading: boolean;
}

export function SettlementRunsTab({ batches, loading }: SettlementRunsTabProps) {
  const [unpaidOnly, setUnpaidOnly] = useState(false);

  const filteredBatches = useMemo(() => {
    if (!unpaidOnly) return batches;
    return batches.filter((b) => b.status === "unpaid" || b.status === "partial");
  }, [batches, unpaidOnly]);

  return (
    <div>
      {/* ── Filters Row (Right-aligned Unpaid only checkbox) ── */}
      <div className="settlement-toolbar-right">
        <label className="settlement-checkbox-label">
          <input
            type="checkbox"
            checked={unpaidOnly}
            onChange={(e) => setUnpaidOnly(e.target.checked)}
            className="settlement-checkbox"
          />
          Unpaid only
        </label>
      </div>

      {/* ── Runs Table ── */}
      <div className="settlement-table-container">
        <table className="settlement-table">
          <thead>
            <tr>
              <th className="settlement-th">Confirmed</th>
              <th className="settlement-th">Reference</th>
              <th className="settlement-th">Cutoff</th>
              <th className="settlement-th text-center">Weavers</th>
              <th className="settlement-th text-right">Total</th>
              <th className="settlement-th text-center">Status</th>
              <th className="settlement-th text-right"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="settlement-loading-state">
                  ⏳ Loading settlement runs…
                </td>
              </tr>
            ) : filteredBatches.length === 0 ? (
              <tr>
                <td colSpan={7} className="settlement-empty-state">
                  {unpaidOnly ? "No unpaid runs found." : "No settlement runs recorded yet."}
                </td>
              </tr>
            ) : (
              filteredBatches.map((b) => {
                const isPaid = b.status === "paid";
                const isCancelled = (b.status as string) === "cancelled";

                return (
                  <tr key={b.previewId} className="settlement-tr">
                    <td className="settlement-td" style={{ color: "#64748B", fontSize: "0.9rem" }}>
                      {b.committedAt || b.createdAt ? formatDateDDMMYY(b.committedAt || b.createdAt) : "—"}
                    </td>

                    <td className="settlement-td">
                      <strong style={{ color: "#0F172A", fontWeight: 700 }}>
                        BATCH #{b.previewId}
                      </strong>
                    </td>

                    <td className="settlement-td" style={{ color: "#334155", fontSize: "0.9rem" }}>
                      {b.cutoffDate ? formatDateDDMMYY(b.cutoffDate) : "—"}
                    </td>

                    <td className="settlement-td text-center" style={{ color: "#334155", fontWeight: 500 }}>
                      {b.weaverCount}
                    </td>

                    <td className="settlement-td text-right">
                      <strong style={{ color: "#0F172A", fontWeight: 700 }}>
                        {Math.round(b.grandTotal).toLocaleString()} ETB
                      </strong>
                    </td>

                    <td className="settlement-td text-center">
                      {isPaid ? (
                        <span className="badge-settled">✓ Paid</span>
                      ) : isCancelled ? (
                        <span className="badge-cancelled">Cancelled</span>
                      ) : (
                        <span className="badge-unpaid">Unpaid</span>
                      )}
                    </td>

                    <td className="settlement-td text-right">
                      <Link
                        to={`/admin/settlement/runs/${b.previewId}`}
                        className="btn btn-secondary settlement-btn-open-run"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
