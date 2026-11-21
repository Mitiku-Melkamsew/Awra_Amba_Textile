export interface AuditLogFiltersProps {
  whatFilter: string;
  setWhatFilter: (val: string) => void;
  whoFilter: string;
  setWhoFilter: (val: string) => void;
  periodFilter: string;
  setPeriodFilter: (val: string) => void;
  whoOptions: string[];
  setPage: (p: number) => void;
  onClearFilters: () => void;
}

export function AuditLogFilters({
  whatFilter,
  setWhatFilter,
  whoFilter,
  setWhoFilter,
  periodFilter,
  setPeriodFilter,
  whoOptions,
  setPage,
  onClearFilters,
}: AuditLogFiltersProps) {
  return (
    <div className="activity-filters-card">
      <div className="activity-filter-inputs">
        {/* What filter */}
        <div className="activity-filter-field">
          <label className="filter-field-label">What</label>
          <select
            value={whatFilter}
            onChange={(e) => {
              setWhatFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="All areas">All areas</option>
            <option value="Settlements">Settlements</option>
            <option value="Prices">Prices</option>
            <option value="Zigs">Zigs</option>
            <option value="Transactions">Transactions</option>
            <option value="Users">Users</option>
            <option value="Catalog">Catalog</option>
          </select>
        </div>

        {/* Who filter */}
        <div className="activity-filter-field">
          <label className="filter-field-label">Who</label>
          <select
            value={whoFilter}
            onChange={(e) => {
              setWhoFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            {whoOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Period filter */}
        <div className="activity-filter-field">
          <label className="filter-field-label">Period</label>
          <select
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="Last 30 days">Last 30 days</option>
            <option value="This month">This month</option>
            <option value="This year">This year</option>
            <option value="All time">All time</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={onClearFilters}
      >
        Clear filters
      </button>
    </div>
  );
}
