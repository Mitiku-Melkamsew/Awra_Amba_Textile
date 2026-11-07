import { useEffect, useState } from "react";
import { auditService } from "../../infrastructure/services";
import type { AuditLog } from "../../domain/models";

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await auditService.listLogs({
        entityName: selectedEntity || undefined,
        action: selectedAction || undefined,
      });
      setLogs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [selectedEntity, selectedAction]);

  return (
    <div className="audit-logs-page">
      <header className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h2>System Audit & Activity Logs</h2>
        <p className="subtitle">
          Traceable tamper-evident log of production, inventory, financial settlement, and administrative events.
        </p>
      </header>

      {error && (
        <div className="alert alert-error" style={{ padding: "1rem", background: "#fee2e2", color: "#b91c1c", marginBottom: "1rem", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      <div className="filters-bar" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          style={{ padding: "0.5rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="">All Entities</option>
          <option value="WorkOrder">WorkOrder</option>
          <option value="SettlementBatch">SettlementBatch</option>
          <option value="DirectTransaction">DirectTransaction</option>
          <option value="YarnPurchase">YarnPurchase</option>
          <option value="User">User</option>
          <option value="FabricPrice">FabricPrice</option>
        </select>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          style={{ padding: "0.5rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="PAYMENT">PAYMENT</option>
          <option value="CANCEL">CANCEL</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading audit records...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Timestamp</th>
                <th style={{ padding: "0.75rem 1rem" }}>User</th>
                <th style={{ padding: "0.75rem 1rem" }}>Action</th>
                <th style={{ padding: "0.75rem 1rem" }}>Entity</th>
                <th style={{ padding: "0.75rem 1rem" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.auditLogId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                      {log.user?.fullName ?? log.user?.username ?? `User #${log.userId ?? "System"}`}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background:
                            log.action === "CREATE"
                              ? "#dcfce7"
                              : log.action === "DELETE" || log.action === "CANCEL"
                              ? "#fee2e2"
                              : "#e0f2fe",
                          color:
                            log.action === "CREATE"
                              ? "#15803d"
                              : log.action === "DELETE" || log.action === "CANCEL"
                              ? "#b91c1c"
                              : "#0369a1",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>
                      <strong>{log.entityName}</strong> {log.entityId && `(#${log.entityId})`}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#64748b" }}>
                      <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
