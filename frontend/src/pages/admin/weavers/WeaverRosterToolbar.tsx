export interface WeaverRosterToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  sort: "name" | "id";
  setSort: (val: "name" | "id") => void;
  statusFilter: "active" | "all" | "deactivated";
  setStatusFilter: (val: "active" | "all" | "deactivated") => void;
  count: number;
}

export function WeaverRosterToolbar({
  search,
  setSearch,
  sort,
  setSort,
  statusFilter,
  setStatusFilter,
  count,
}: WeaverRosterToolbarProps) {
  return (
    <div className="weavers-toolbar">
      {/* ── Search Input (Expands to take all remaining space) ── */}
      <div className="weavers-search-wrap">
        <span className="weavers-search-icon" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search by name, phone or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="weavers-search-input"
        />
      </div>

      {/* ── Right-most Controls (Sort, Filter, Count) ── */}
      <div className="weavers-controls-right">
        {/* Sort Segmented Control Pill */}
        <div className="weavers-segmented-control">
          <button
            type="button"
            onClick={() => setSort("name")}
            className={`weavers-segmented-btn ${sort === "name" ? "active" : ""}`}
          >
            Sort A–Z
          </button>
          <button
            type="button"
            onClick={() => setSort("id")}
            className={`weavers-segmented-btn ${sort === "id" ? "active" : ""}`}
          >
            Sort by ID
          </button>
        </div>

        {/* Compact Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="weavers-status-select"
        >
          <option value="active">Active Only</option>
          <option value="all">All</option>
          <option value="deactivated">Deactivated</option>
        </select>

        {/* Weavers count */}
        <span className="weavers-count-badge">
          {count} weavers
        </span>
      </div>
    </div>
  );
}

export default WeaverRosterToolbar;
