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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.25rem",
      }}
    >
      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "0.35rem", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
        <button
          type="button"
          onClick={() => onStatusTabChange("all")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "7px",
            border: "none",
            background: statusTab === "all" ? "#ffffff" : "transparent",
            color: statusTab === "all" ? "#0f172a" : "#64748b",
            fontWeight: statusTab === "all" ? 700 : 500,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: statusTab === "all" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          All Zigs ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onStatusTabChange("ongoing")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "7px",
            border: "none",
            background: statusTab === "ongoing" ? "#ffffff" : "transparent",
            color: statusTab === "ongoing" ? "#0369a1" : "#64748b",
            fontWeight: statusTab === "ongoing" ? 700 : 500,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: statusTab === "ongoing" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          Ongoing WIP ({stats.ongoingCount})
        </button>
        <button
          type="button"
          onClick={() => onStatusTabChange("returned")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "7px",
            border: "none",
            background: statusTab === "returned" ? "#ffffff" : "transparent",
            color: statusTab === "returned" ? "#b45309" : "#64748b",
            fontWeight: statusTab === "returned" ? 700 : 500,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: statusTab === "returned" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          Returned ({stats.returnedCount})
        </button>
        <button
          type="button"
          onClick={() => onStatusTabChange("reconciled")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "7px",
            border: "none",
            background: statusTab === "reconciled" ? "#ffffff" : "transparent",
            color: statusTab === "reconciled" ? "#15803d" : "#64748b",
            fontWeight: statusTab === "reconciled" ? 700 : 500,
            fontSize: "0.85rem",
            cursor: "pointer",
            boxShadow: statusTab === "reconciled" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >
          Reconciled ({stats.reconciledCount})
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="🔍 Search by Zig ID, Weaver, or Fabric…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          padding: "0.5rem 0.85rem",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          fontSize: "0.88rem",
          minWidth: 280,
        }}
      />
    </div>
  );
}
