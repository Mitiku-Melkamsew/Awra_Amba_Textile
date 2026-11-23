import type { ProductionStats } from "./types";

interface ProductionKpiCardsProps {
  stats: ProductionStats;
}

export function ProductionKpiCards({ stats }: ProductionKpiCardsProps) {
  return (
    <div className="reports-kpi-grid">
      {/* Active WIP Card */}
      <div className="reports-kpi-card">
        <span className="reports-kpi-label">Active WIP (Ongoing)</span>
        <div className="reports-kpi-num blue">{stats.ongoingCount}</div>
        <span className="reports-kpi-sub">
          {stats.ongoingYarnKg.toLocaleString()} kg yarn currently on looms
        </span>
      </div>

      {/* Returned Pending Settlement Card */}
      <div className="reports-kpi-card reports-kpi-peach">
        <span className="reports-kpi-label">Returned (Ready to Settle)</span>
        <div className="reports-kpi-num rust">{stats.returnedCount}</div>
        <span className="reports-kpi-sub">
          {stats.pendingLiability.toLocaleString()} ETB pending weaver pay
        </span>
      </div>

      {/* Reconciled / Settled Card */}
      <div className="reports-kpi-card">
        <span className="reports-kpi-label">Reconciled (Settled)</span>
        <div className="reports-kpi-num green">{stats.reconciledCount}</div>
        <span className="reports-kpi-sub">
          {stats.reconciledTotal.toLocaleString()} ETB paid out in full
        </span>
      </div>

      {/* Weight Compliance Card */}
      <div className="reports-kpi-card">
        <span className="reports-kpi-label">Weight Compliance</span>
        <div className="reports-kpi-num">{stats.qualityRate}%</div>
        <span className="reports-kpi-sub">
          Meeting or exceeding fabric spec weight
        </span>
      </div>
    </div>
  );
}

export default ProductionKpiCards;
