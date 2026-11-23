import type { ProductionStatusTab, ProductionStats } from "./types";

interface ProductionReportToolbarProps {
  statusTab: ProductionStatusTab;
  onStatusTabChange: (tab: ProductionStatusTab) => void;
  search: string;
  onSearchChange: (val: string) => void;
  totalCount: number;
  stats: ProductionStats;
}

export function ProductionReportToolbar({
  statusTab,
  onStatusTabChange,
  search,
  onSearchChange,
  totalCount,
  stats,
}: ProductionReportToolbarProps) {
  return (
    <div className="production-toolbar">
      {/* Search Input (Takes Remaining Space on Left) */}
      <div className="production-search-wrap">
        <span className="production-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by Zig ID, weaver, fabric, or yarn..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="production-search-input"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="production-search-clear"
            title="Clear search"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Segmented Status Toggle (Grouped on Right) */}
      <div className="production-segmented-control">
        <button
          type="button"
          onClick={() => onStatusTabChange("all")}
          className={`production-segmented-btn ${statusTab === "all" ? "active" : ""}`}
        >
          All Zigs ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onStatusTabChange("ongoing")}
          className={`production-segmented-btn ${statusTab === "ongoing" ? "active" : ""}`}
        >
          Ongoing WIP ({stats.ongoingCount})
        </button>
        <button
          type="button"
          onClick={() => onStatusTabChange("returned")}
          className={`production-segmented-btn ${statusTab === "returned" ? "active" : ""}`}
        >
          Returned ({stats.returnedCount})
        </button>
        <button
          type="button"
          onClick={() => onStatusTabChange("reconciled")}
          className={`production-segmented-btn ${statusTab === "reconciled" ? "active" : ""}`}
        >
          Reconciled ({stats.reconciledCount})
        </button>
      </div>
    </div>
  );
}

export default ProductionReportToolbar;
