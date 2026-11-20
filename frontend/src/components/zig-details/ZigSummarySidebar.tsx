import { Link } from "react-router-dom";
import type { WorkOrderDetail } from "../../api";

export interface ZigSummarySidebarProps {
  order: WorkOrderDetail;
  netPayable: number;
  totalNetFabric: number;
  totalYarnCost: number;
  canRecordFabric: boolean;
  canEdit: boolean;
  canMarkReturned: boolean;
  canCancel: boolean;
  onRecordFabricClick: () => void;
  onGiveYarnClick: () => void;
  onMarkReturnedClick: () => void;
  onOpenCancelModal: () => void;
  weaverDisplayName: string;
  fabricDisplayName: string;
  totalYarnGiven: number;
  totalFabricReturned: number;
  totalGrossFabric: number;
  totalDeductions: number;
}

export function ZigSummarySidebar({
  order,
  netPayable,
  totalNetFabric,
  totalYarnCost,
  canRecordFabric,
  canEdit,
  canMarkReturned,
  canCancel,
  onRecordFabricClick,
  onGiveYarnClick,
  onMarkReturnedClick,
  onOpenCancelModal,
  weaverDisplayName,
  fabricDisplayName,
  totalYarnGiven,
  totalFabricReturned,
  totalGrossFabric,
  totalDeductions,
}: ZigSummarySidebarProps) {
  return (
    <div
      style={{
        background: "var(--color-surface, #ffffff)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        borderRadius: "var(--radius-lg, 14px)",
        padding: "1.5rem",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
      }}
    >
      {/* Prominent Live Net Payable Banner Card */}
      <div
        style={{
          background: netPayable >= 0 ? "var(--color-success-subtle, #f0fdf4)" : "var(--color-amber-50, #fffbeb)",
          border: `1.5px solid ${netPayable >= 0 ? "var(--color-success-border, #86efac)" : "var(--color-amber-200, #fde68a)"}`,
          borderRadius: "var(--radius-md, 12px)",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: netPayable >= 0 ? "var(--color-success, #15803d)" : "var(--color-amber-800, #92400e)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {netPayable >= 0 ? "Net Payable to Weaver" : "Net Debit Balance"}
        </div>
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: netPayable >= 0 ? "var(--color-success, #15803d)" : "var(--color-amber-700, #b45309)",
            margin: "0.3rem 0",
          }}
        >
          {netPayable >= 0 ? `+${netPayable.toLocaleString()} ETB` : `${netPayable.toLocaleString()} ETB`}
        </div>
        <div
          style={{
            fontSize: "0.76rem",
            color: "var(--color-text-muted, #64748b)",
            display: "flex",
            justifyContent: "space-between",
            marginTop: "0.4rem",
            borderTop: "1px dashed rgba(0,0,0,0.08)",
            paddingTop: "0.4rem",
          }}
        >
          <span>Fabric: {totalNetFabric.toLocaleString()} ETB</span>
          <span>Yarn: -{totalYarnCost.toLocaleString()} ETB</span>
        </div>
      </div>

      <h3
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1.15rem",
          fontWeight: 700,
          color: "var(--color-text, #0f172a)",
        }}
      >
        Actions
      </h3>

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {canRecordFabric && (
          <button
            type="button"
            onClick={onRecordFabricClick}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.65rem 1rem", fontSize: "0.92rem" }}
          >
            Record fabric return
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={onGiveYarnClick}
            className="btn btn-secondary"
            style={{ width: "100%", padding: "0.65rem 1rem", fontSize: "0.92rem" }}
          >
            Give yarn
          </button>
        )}

        {canMarkReturned && (
          <button
            type="button"
            onClick={onMarkReturnedClick}
            className="btn btn-secondary"
            style={{ width: "100%", padding: "0.65rem 1rem", fontSize: "0.92rem" }}
          >
            Mark as returned
          </button>
        )}

        {/* Helper Caption */}
        <p
          style={{
            margin: "0.25rem 0 0.5rem 0",
            fontSize: "0.78rem",
            color: "var(--color-text-muted, #64748b)",
            fontStyle: "italic",
            lineHeight: 1.35,
          }}
        >
          Use "Mark as returned" when the weaver has brought back all the fabric.
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--color-border-subtle, #f1f5f9)", margin: "1.25rem 0" }} />

      {/* Metadata Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Weaver</span>
          <Link
            to={`/admin/weavers/${order.weaverUserId}`}
            style={{
              fontWeight: 700,
              color: "var(--color-text, #0f172a)",
              textDecoration: "none",
            }}
          >
            {weaverDisplayName}
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Fabric</span>
          <span style={{ fontWeight: 700, color: "var(--color-text, #0f172a)", textAlign: "right" }}>
            {fabricDisplayName}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Yarn given</span>
          <span style={{ fontWeight: 600, color: "var(--color-text-secondary, #334155)" }}>
            {totalYarnGiven} kg ({totalYarnCost.toLocaleString()} ETB)
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Fabric returned</span>
          <span style={{ fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
            {totalFabricReturned} pieces ({totalGrossFabric.toLocaleString()} ETB gross)
          </span>
        </div>

        {totalDeductions > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>Quality deductions</span>
            <span style={{ fontWeight: 700, color: "var(--color-danger, #dc2626)" }}>
              -{totalDeductions.toLocaleString()} ETB
            </span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Net fabric value</span>
          <span style={{ fontWeight: 700, color: "var(--color-success, #15803d)" }}>
            {totalNetFabric.toLocaleString()} ETB
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--color-border-subtle, #f1f5f9)", margin: "1.25rem 0" }} />

      {/* Danger Zone: Standout Cancel This Zig Action */}
      {canCancel && (
        <div
          style={{
            background: "var(--color-danger-subtle, #fef2f2)",
            border: "1.5px solid var(--color-danger-border, #fecaca)",
            borderRadius: "var(--radius-md, 10px)",
            padding: "1rem",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--color-danger-dark, #991b1b)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "0.35rem",
            }}
          >
            <span>⚠️</span>
            <span>Danger Zone</span>
          </div>
          <p
            style={{
              margin: "0 0 0.85rem 0",
              fontSize: "0.78rem",
              color: "var(--color-danger-dark, #7f1d1d)",
              lineHeight: 1.4,
            }}
          >
            Permanently cancel this zig. Production will be terminated and remaining unreturned yarn will be logged.
          </p>
          <button
            type="button"
            onClick={onOpenCancelModal}
            className="btn btn-danger"
            style={{
              width: "100%",
              padding: "0.55rem 1rem",
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            <span>✕</span> Cancel this zig…
          </button>
        </div>
      )}
    </div>
  );
}
