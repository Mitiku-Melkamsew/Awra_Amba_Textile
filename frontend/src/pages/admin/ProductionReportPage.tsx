import { Link } from "react-router-dom";
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
    <div className="page">
      <Link to="/admin/reports" className="back-link">
        ← Back to Financial Overview
      </Link>

      <div className="page-header" style={{ marginBottom: "1.25rem" }}>
        <div>
          <p className="eyebrow">የምርት ክትትል / Production & WIP Ledger</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="page-title">Work-in-Progress & Production Report</h1>
            <span className="badge badge--neutral">{data.length} Total Zigs</span>
          </div>
          <p className="page-subtitle">
            Lifecycle monitoring for all active weaving zigs, issued yarns, fabric returns, and quality compliance outside the payment flow.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredData.length === 0}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="tab-bar">
        <Link
          to="/admin/reports"
          className="tab-pill"
          style={{ textDecoration: "none" }}
        >
          Financial Overview
        </Link>
        <span className="tab-pill active">
          Production & WIP Ledger
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Aggregated KPI Cards */}
      <ProductionKpiCards stats={stats} />

      {/* Status Filter Tabs & Search Bar */}
      <ProductionReportToolbar
        statusTab={statusTab}
        onStatusTabChange={setStatusTab}
        search={search}
        onSearchChange={setSearch}
        totalCount={data.length}
        stats={stats}
      />

      {/* Ledger Table */}
      <ProductionReportTable data={filteredData} loading={loading} />
    </div>
  );
}

export default ProductionReportPage;
