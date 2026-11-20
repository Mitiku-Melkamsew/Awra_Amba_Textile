import { Link } from "react-router-dom";
import type { PendingSettlementsSummary } from "../../domain/models";
import type { TabView } from "./useSettlementManager";

export interface SettlementHeaderProps {
  pendingSummary: PendingSettlementsSummary | null;
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  message: string;
  error: string;
}

export function SettlementHeader({
  pendingSummary,
  activeTab,
  onTabChange,
  message,
  error,
}: SettlementHeaderProps) {
  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Payroll & Settlement</p>
          <h1 className="page-title">Weaver Payroll & Production Settlement</h1>
          <p className="page-subtitle">
            Consolidate returned fabric, apply standardized quality weight deductions, debit yarn materials, and disburse official HISAB payrolls.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/admin/reports/production" className="btn btn-ghost">
            <span>🏭</span> Production & WIP / የምርት ክትትል
          </Link>
          <Link to="/admin/settlement/history" className="btn btn-ghost">
            <span>📜</span> Batch History / ታሪክ
          </Link>
        </div>
      </div>

      {/* Real-time Pending Liability Banner */}
      {pendingSummary && (
        <div
          style={{
            background: "linear-gradient(135deg, var(--color-blue-50, #EFF6FF) 0%, var(--color-blue-100, #DBEAFE) 100%)",
            border: "1px solid var(--color-blue-200, #BFDBFE)",
            borderRadius: "var(--radius-md, 10px)",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-blue-800, #1E40AF)", textTransform: "uppercase" }}>
              ⚡ Real-Time Unsettled Weaver Liability (ያልተከፈለ ተከፋይ ድምር)
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-blue-900, #1E3A8A)", marginTop: "0.15rem" }}>
              {(pendingSummary.pendingLiability ?? pendingSummary.totalPendingAmount ?? 0).toLocaleString()} ETB
            </div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "13px", color: "var(--color-blue-900, #1E3A8A)" }}>
            {pendingSummary.weaverCount !== undefined && (
              <div>
                Ready Artisans: <strong>{pendingSummary.weaverCount}</strong>
              </div>
            )}
            <div>
              Returned Zigs Awaiting Pay: <strong>{pendingSummary.unsettledZigCount ?? pendingSummary.zigCount ?? 0}</strong>
            </div>
            {pendingSummary.totalPieceCount !== undefined && (
              <div>
                Total Fabric Pieces: <strong>{pendingSummary.totalPieceCount} pcs</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          borderBottom: "1.5px solid var(--color-border-subtle, #e2e8f0)",
          paddingBottom: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange("payroll")}
          className={`btn ${activeTab === "payroll" ? "btn-primary" : "btn-ghost"}`}
          style={{
            padding: "0.5rem 1.25rem",
            fontWeight: 700,
          }}
        >
          💼 Payroll Batch Workspace / የክፍያ ማዘጋጃ
        </button>
        <button
          type="button"
          onClick={() => onTabChange("ledger")}
          className={`btn ${activeTab === "ledger" ? "btn-primary" : "btn-ghost"}`}
          style={{
            padding: "0.5rem 1.25rem",
            fontWeight: 700,
          }}
        >
          📄 Master Zigs Ledger / የስራ ትዕዛዞች ሰነድ
        </button>
      </div>

      {message && (
        <div
          className="alert alert-success"
          style={{
            background: "var(--color-success-subtle, #dcfce7)",
            border: "1px solid var(--color-success-border, #86efac)",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            color: "var(--color-success, #15803d)",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>✅</span> {message}
        </div>
      )}
      {error && (
        <div
          className="alert alert-danger"
          style={{
            background: "var(--color-danger-subtle, #fee2e2)",
            border: "1px solid var(--color-danger-border, #fca5a5)",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            color: "var(--color-danger, #b91c1c)",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span>⚠️</span> {error}
        </div>
      )}
    </>
  );
}
