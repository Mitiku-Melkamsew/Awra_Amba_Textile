import type { ProductionStats, ProductionStatusTab } from "./types";

interface ProductionKpiCardsProps {
  stats: ProductionStats;
  statusTab?: ProductionStatusTab;
  onStatusTabChange?: (tab: ProductionStatusTab) => void;
}

export function ProductionKpiCards({
  stats,
  statusTab,
  onStatusTabChange,
}: ProductionKpiCardsProps) {
  const handleToggle = (tab: ProductionStatusTab) => {
    if (!onStatusTabChange) return;
    onStatusTabChange(statusTab === tab ? "all" : tab);
  };

  const yarnPieces = stats.ongoingYarnPieces ?? stats.ongoingYarnKg;

  return (
    <div className="reports-kpi-grid">
      {/* Active WIP Card */}
      <div
        role="button"
        tabIndex={0}
        className={`reports-kpi-card ${onStatusTabChange ? "clickable" : ""} ${
          statusTab === "ongoing" ? "active-filter" : ""
        }`}
        onClick={() => handleToggle("ongoing")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle("ongoing");
          }
        }}
        title={
          statusTab === "ongoing"
            ? "Click to view all zigs"
            : "Click to filter ongoing WIP zigs"
        }
      >
        <span className="reports-kpi-label">Active WIP (Ongoing)</span>
        <div className="reports-kpi-num blue">{stats.ongoingCount}</div>
        <span className="reports-kpi-sub">
          {yarnPieces.toLocaleString()} pcs yarn currently on looms
        </span>
      </div>

      {/* Returned Pending Settlement Card */}
      <div
        role="button"
        tabIndex={0}
        className={`reports-kpi-card reports-kpi-peach ${
          onStatusTabChange ? "clickable" : ""
        } ${statusTab === "returned" ? "active-filter" : ""}`}
        onClick={() => handleToggle("returned")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle("returned");
          }
        }}
        title={
          statusTab === "returned"
            ? "Click to view all zigs"
            : "Click to filter returned zigs ready to settle"
        }
      >
        <span className="reports-kpi-label">Returned (Ready to Settle)</span>
        <div className="reports-kpi-num rust">{stats.returnedCount}</div>
        <span className="reports-kpi-sub">
          {stats.pendingLiability.toLocaleString()} ETB pending weaver pay
        </span>
      </div>

      {/* Reconciled / Settled Card */}
      <div
        role="button"
        tabIndex={0}
        className={`reports-kpi-card ${onStatusTabChange ? "clickable" : ""} ${
          statusTab === "reconciled" ? "active-filter" : ""
        }`}
        onClick={() => handleToggle("reconciled")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle("reconciled");
          }
        }}
        title={
          statusTab === "reconciled"
            ? "Click to view all zigs"
            : "Click to filter settled zigs"
        }
      >
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
