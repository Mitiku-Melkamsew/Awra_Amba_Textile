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
    <div
      className="toolbar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "nowrap",
        overflowX: "auto",
        marginBottom: "1.25rem",
      }}
    >
      {/* Search Box - constrained so controls stay on one line */}
      <div style={{ flex: "0 1 320px", minWidth: 200, maxWidth: 360, position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "0.85rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted, #64748B)",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
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
          placeholder="Search by name, phone or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ paddingLeft: "2.4rem", width: "100%" }}
        />
      </div>

      {/* Sort buttons */}
      <button
        type="button"
        onClick={() => setSort("name")}
        className={sort === "name" ? "btn btn-secondary btn-sm" : "btn btn-ghost btn-sm"}
        style={{
          border: sort === "name" ? "1.5px solid var(--accent, #EA580C)" : "1px solid var(--border)",
          color: sort === "name" ? "var(--brand, #C2410C)" : "var(--text-muted)",
          fontWeight: sort === "name" ? 700 : 500,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Sort A–Z
      </button>

      <button
        type="button"
        onClick={() => setSort("id")}
        className={sort === "id" ? "btn btn-secondary btn-sm" : "btn btn-ghost btn-sm"}
        style={{
          border: sort === "id" ? "1.5px solid var(--accent, #EA580C)" : "1px solid var(--border)",
          color: sort === "id" ? "var(--brand, #C2410C)" : "var(--text-muted)",
          fontWeight: sort === "id" ? 700 : 500,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Sort by ID
      </button>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as any)}
        className="select"
        style={{
          minHeight: 38,
          fontSize: "13.5px",
          fontWeight: 600,
          color: "var(--text)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <option value="active">Active Only</option>
        <option value="all">All Statuses</option>
        <option value="deactivated">Deactivated</option>
      </select>

      {/* Total weavers count */}
      <span
        style={{
          fontSize: "13px",
          color: "var(--text-muted, #64748B)",
          fontWeight: 500,
          whiteSpace: "nowrap",
          marginLeft: "auto",
          flexShrink: 0,
        }}
      >
        {count} weavers
      </span>
    </div>
  );
}
