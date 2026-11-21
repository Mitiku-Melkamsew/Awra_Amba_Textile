import type { LogItem } from "./types";

export interface AuditLogTableProps {
  logs: LogItem[];
  expandedId: string | number | null;
  toggleRow: (id: string | number) => void;
  page: number;
  setPage: (updater: (prev: number) => number) => void;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function AuditLogTable({
  logs,
  expandedId,
  toggleRow,
  page,
  setPage,
  pageSize,
  total,
  totalPages,
}: AuditLogTableProps) {
  return (
    <div className="activity-table-card">
      <table className="activity-table">
        <thead>
          <tr>
            <th style={{ width: "18%" }}>When</th>
            <th style={{ width: "16%" }}>Who</th>
            <th style={{ width: "48%" }}>What happened</th>
            <th style={{ width: "18%", textAlign: "right" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No activity logs matching criteria.
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedId === log.id;

              return (
                <tr
                  key={log.id}
                  className={`activity-row ${isExpanded ? "row-expanded" : ""}`}
                  onClick={() => toggleRow(log.id)}
                >
                  {/* When */}
                  <td className="activity-col-when">{log.when}</td>

                  {/* Who */}
                  <td className="activity-col-who">{log.who}</td>

                  {/* What happened */}
                  <td className="activity-col-what">
                    <div>
                      <div className="what-title">{log.whatHappenedTitle}</div>
                      <div className="what-sub">{log.whatHappenedSub}</div>
                    </div>

                    {/* Expanded detail box */}
                    {isExpanded && log.details && log.details.length > 0 && (
                      <div className="activity-details-panel">
                        <div className="activity-details-box">
                          {log.details.map((d, idx) => (
                            <div key={idx} style={{ display: "contents" }}>
                              <span className="details-pair-key">{d.label}</span>
                              <span className="details-pair-val">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Action */}
                  <td className="activity-col-action">
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem",
                      }}
                    >
                      <span
                        className={`badge ${
                          log.actionType === "confirmed" || log.actionType === "created"
                            ? "badge--success"
                            : log.actionType === "deleted" || log.actionType === "cancelled"
                            ? "badge--danger"
                            : "badge--info"
                        }`}
                      >
                        {log.actionText}
                      </span>
                      <span style={{ color: "var(--text-subtle)", fontSize: "12px" }}>
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* ── Footer Pagination ── */}
      <div className="activity-pagination-bar">
        <div className="pagination-count">
          Showing {total === 0 ? "0" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`} of {total}
        </div>

        <div className="pagination-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
