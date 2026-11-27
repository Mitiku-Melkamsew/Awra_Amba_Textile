import { useProductionReport } from "./production/useProductionReport";
import { ProductionKpiCards } from "./production/ProductionKpiCards";
import { ProductionReportToolbar } from "./production/ProductionReportToolbar";
import { ProductionReportTable } from "./production/ProductionReportTable";

export function ProductionReportPage() {
  const {
    data,
    filteredData,
    loading,
    error,
    statusTab,
    setStatusTab,
    search,
    setSearch,
    stats,
    exportCsv,
  } = useProductionReport();

  return (
    <div className="page reports-page">
      {/* ── Page Header ── */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">
            Production & WIP Ledger <span className="reports-title-amharic">· የምርት ክትትል</span>
          </h1>
          <p className="reports-subtitle">
            Lifecycle monitoring for all active weaving zigs, issued yarns, fabric returns, and quality compliance
          </p>
        </div>

        <div className="reports-header-actions">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredData.length === 0}
            className="btn btn-secondary"
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="settlement-alert-error">
          ⚠️ {error}
        </div>
      )}

      {/* ── Aggregated Interactive KPI Filter Cards ── */}
      <ProductionKpiCards
        stats={stats}
        statusTab={statusTab}
        onStatusTabChange={setStatusTab}
      />

      {/* ── Search Bar & Filter Indicators ── */}
      <ProductionReportToolbar
        statusTab={statusTab}
        onStatusTabChange={setStatusTab}
        search={search}
        onSearchChange={setSearch}
        totalCount={data.length}
        stats={stats}
      />

      {/* ── Ledger Table ── */}
      <ProductionReportTable data={filteredData} loading={loading} />
    </div>
  );
}

export default ProductionReportPage;
