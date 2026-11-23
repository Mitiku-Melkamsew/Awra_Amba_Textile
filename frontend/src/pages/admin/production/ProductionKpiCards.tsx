import type { ProductionStats } from "./types";

interface ProductionKpiCardsProps {
  stats: ProductionStats;
}

export function ProductionKpiCards({ stats }: ProductionKpiCardsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      {/* Ongoing WIP Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
          Active WIP (Ongoing)
        </div>
        <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0369a1", margin: "0.3rem 0" }}>
          {stats.ongoingCount}
        </div>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
          {stats.ongoingYarnKg.toLocaleString()} kg yarn currently on looms
        </div>
      </div>

      {/* Returned Pending Settlement Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
          Returned (Pending HISAB)
        </div>
        <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>
          {stats.returnedCount}
        </div>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
          {stats.pendingLiability.toLocaleString()} ETB pending weaver pay
        </div>
      </div>

      {/* Reconciled / Settled Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
          Reconciled (Settled)
        </div>
        <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#15803d", margin: "0.3rem 0" }}>
          {stats.reconciledCount}
        </div>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
          {stats.reconciledTotal.toLocaleString()} ETB paid out
        </div>
      </div>

      {/* Quality Compliance Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.25rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
          Weight Compliance
        </div>
        <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", margin: "0.3rem 0" }}>
          {stats.qualityRate}%
        </div>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
          Meeting or exceeding fabric spec weight
        </div>
      </div>
    </div>
  );
}
