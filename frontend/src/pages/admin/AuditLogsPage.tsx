import { useAuditLogsManager } from "./audit/useAuditLogsManager";
import { AuditLogFilters } from "./audit/AuditLogFilters";
import { AuditLogTable } from "./audit/AuditLogTable";

export function AuditLogsPage() {
  const {
    whatFilter,
    setWhatFilter,
    whoFilter,
    setWhoFilter,
    periodFilter,
    setPeriodFilter,
    whoOptions,
    paginatedLogs,
    expandedId,
    toggleRow,
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    handleClearFilters,
  } = useAuditLogsManager();

  return (
    <div className="page activity-log-page">
      {/* ── Page Header ── */}
      <div className="activity-page-header">
        <h1 className="activity-page-title">
          Activity log <span className="activity-page-title-amharic">· እንቅስቃሴ</span>
        </h1>
        <p className="activity-page-subtitle">
          A read-only record of who did what, and when.
        </p>
      </div>

      {/* ── Filters Bar ── */}
      <AuditLogFilters
        whatFilter={whatFilter}
        setWhatFilter={setWhatFilter}
        whoFilter={whoFilter}
        setWhoFilter={setWhoFilter}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
        whoOptions={whoOptions}
        setPage={setPage}
        onClearFilters={handleClearFilters}
      />

      {/* ── Table Card ── */}
      <AuditLogTable
        logs={paginatedLogs}
        expandedId={expandedId}
        toggleRow={toggleRow}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />
    </div>
  );
}

export default AuditLogsPage;
