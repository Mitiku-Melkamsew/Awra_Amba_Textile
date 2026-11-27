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
}: ProductionReportToolbarProps) {
  return (
    <div className="production-toolbar">
      {/* Search Input */}
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

      {/* Active Filter Pill & Reset */}
      {statusTab !== "all" && (
        <div className="production-active-filter-bar">
          <div className="production-active-filter-info">
            <span>Filter:</span>
            <span className="production-active-filter-tag">
              {statusTab === "ongoing" && "Ongoing WIP"}
              {statusTab === "returned" && "Returned (Ready to settle)"}
              {statusTab === "reconciled" && "Reconciled"}
            </span>
          </div>
          <button
            type="button"
            className="production-active-filter-clear"
            onClick={() => onStatusTabChange("all")}
          >
            Show all zigs
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductionReportToolbar;
