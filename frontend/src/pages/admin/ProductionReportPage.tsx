import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { settlementsApi } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

interface ZigLedgerItem {
  zigId: string;
  weaverUserId: number;
  weaverName: string;
  weaverPhone?: string | null;
  status: string;
  dateIssued: string;
  dateReturned?: string | null;
  fabricName: string;
  standardWeightG: number;
  warpColor?: string;
  weftColor?: string;
  design?: string;
  netPayable: number;
  yarn: {
    issuedQuantity: number;
    totalCost: number;
  };
  fabric: {
    receivedQuantity: number;
    totalWeight: number;
    averageWeight: number;
    grossFabricValue: number;
    deductionAmount: number;
  };
  settlement: {
    settlementId: number;
    batchId: number;
    status: string;
    amount: number;
  } | null;
  isSettled: boolean;
}

export function ProductionReportPage() {
  const [data, setData] = useState<ZigLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "ongoing" | "returned" | "reconciled">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    settlementsApi
      .zigsLedger()
      .then((res: any) => {
        setData(Array.isArray(res) ? res : []);
      })
      .catch((err: any) => {
        setError(err instanceof Error ? err.message : "Failed to load production ledger");
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Tab filter
      if (statusTab === "ongoing") {
        if (item.status !== "assigned" && item.status !== "in_progress") return false;
      } else if (statusTab === "returned") {
        if (item.status !== "returned") return false;
      } else if (statusTab === "reconciled") {
        if (item.status !== "reconciled") return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesZig = item.zigId.toLowerCase().includes(q);
        const matchesWeaver = (item.weaverName || "").toLowerCase().includes(q);
        const matchesFabric = (item.fabricName || "").toLowerCase().includes(q);
        if (!matchesZig && !matchesWeaver && !matchesFabric) return false;
      }

      return true;
    });
  }, [data, statusTab, search]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    const ongoingZigs = data.filter((d) => d.status === "assigned" || d.status === "in_progress");
    const returnedZigs = data.filter((d) => d.status === "returned");
    const reconciledZigs = data.filter((d) => d.status === "reconciled");

    const ongoingYarnKg = ongoingZigs.reduce((acc, d) => acc + (d.yarn?.issuedQuantity || 0), 0);
    const pendingLiability = returnedZigs.reduce((acc, d) => acc + (d.netPayable > 0 ? d.netPayable : 0), 0);
    const reconciledTotal = reconciledZigs.reduce((acc, d) => acc + (d.netPayable > 0 ? d.netPayable : 0), 0);

    const compliantReturned = returnedZigs.filter(
      (d) => d.fabric.averageWeight >= d.standardWeightG,
    ).length;
    const qualityRate = returnedZigs.length > 0 ? Math.round((compliantReturned / returnedZigs.length) * 100) : 100;

    return {
      ongoingCount: ongoingZigs.length,
      ongoingYarnKg,
      returnedCount: returnedZigs.length,
      pendingLiability,
      reconciledCount: reconciledZigs.length,
      reconciledTotal,
      qualityRate,
    };
  }, [data]);

  function exportCsv() {
    if (filteredData.length === 0) return;

    const headers = [
      "Zig ID",
      "Weaver Name",
      "Weaver Phone",
      "Status",
      "Date Issued",
      "Date Returned",
      "Fabric",
      "Yarn Issued (kg)",
      "Yarn Cost (ETB)",
      "Fabric Pcs Returned",
      "Total Weight (g)",
      "Avg Weight (g)",
      "Standard Weight (g)",
      "Gross Fabric (ETB)",
      "Deductions (ETB)",
      "Net Payable (ETB)",
      "Settlement Batch #",
    ];

    const rows = filteredData.map((d) => [
      `"${d.zigId}"`,
      `"${d.weaverName || ""}"`,
      `"${d.weaverPhone || ""}"`,
      `"${d.status}"`,
      `"${d.dateIssued ? formatDateDDMMYY(d.dateIssued) : ""}"`,
      `"${d.dateReturned ? formatDateDDMMYY(d.dateReturned) : ""}"`,
      `"${d.fabricName || ""}"`,
      d.yarn?.issuedQuantity || 0,
      d.yarn?.totalCost || 0,
      d.fabric?.receivedQuantity || 0,
      d.fabric?.totalWeight || 0,
      d.fabric?.averageWeight || 0,
      d.standardWeightG || 0,
      d.fabric?.grossFabricValue || 0,
      d.fabric?.deductionAmount || 0,
      d.netPayable || 0,
      d.settlement?.batchId ?? "",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Production_Ledger_${statusTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <p className="eyebrow">የምርት ክትትል / Production & WIP Ledger</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="page-title">Work-in-Progress & Production Report</h1>
            <span className="badge badge-gray">{data.length} Total Zigs</span>
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
            style={{
              padding: "0.6rem 1.1rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: filteredData.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>📥</span> Export CSV Ledger
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Ongoing WIP Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Active WIP (Ongoing)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0369a1", margin: "0.3rem 0" }}>
            {stats.ongoingCount}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            {stats.ongoingYarnKg.toLocaleString()} kg yarn currently on looms
          </div>
        </div>

        {/* Returned Pending Settlement Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Returned (Pending HISAB)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>
            {stats.returnedCount}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            {stats.pendingLiability.toLocaleString()} ETB pending weaver pay
          </div>
        </div>

        {/* Reconciled / Settled Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Reconciled (Settled)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#15803d", margin: "0.3rem 0" }}>
            {stats.reconciledCount}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            {stats.reconciledTotal.toLocaleString()} ETB paid out
          </div>
        </div>

        {/* Quality Compliance Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Weight Compliance
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", margin: "0.3rem 0" }}>
            {stats.qualityRate}%
          </div>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Meeting or exceeding fabric spec weight
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
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
            onClick={() => setStatusTab("all")}
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
            All Zigs ({data.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("ongoing")}
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
            onClick={() => setStatusTab("returned")}
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
            onClick={() => setStatusTab("reconciled")}
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
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.5rem 0.85rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "0.88rem",
            minWidth: 280,
          }}
        />
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Production Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Zig ID</th>
              <th>Artisan Weaver</th>
              <th>Fabric Spec</th>
              <th>Status</th>
              <th>Yarn Issued</th>
              <th>Fabric Returns</th>
              <th style={{ textAlign: "right" }}>Net Balance</th>
              <th>Dates</th>
              <th>Settlement</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "3rem" }}>
                  ⏳ Loading production ledger…
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                  No work orders found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredData.map((d) => {
                const isUnderweight = d.fabric.averageWeight > 0 && d.fabric.averageWeight < d.standardWeightG;

                return (
                  <tr key={d.zigId}>
                    <td>
                      <Link
                        to={`/admin/zigs/${d.zigId}`}
                        style={{ fontWeight: 700, color: "var(--brand, #c2410c)", textDecoration: "none" }}
                      >
                        {d.zigId}
                      </Link>
                    </td>

                    <td>
                      <Link
                        to={`/admin/weavers/${d.weaverUserId}`}
                        style={{ fontWeight: 600, color: "#0f172a", textDecoration: "none" }}
                      >
                        {d.weaverName}
                      </Link>
                      {d.weaverPhone && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.weaverPhone}</div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "#334155" }}>{d.fabricName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {[d.warpColor, d.weftColor, d.design].filter(Boolean).join(" · ")}
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          background:
                            d.status === "in_progress"
                              ? "#e0f2fe"
                              : d.status === "returned"
                              ? "#fef3c7"
                              : d.status === "reconciled"
                              ? "#dcfce7"
                              : d.status === "cancelled"
                              ? "#fee2e2"
                              : "#f1f5f9",
                          color:
                            d.status === "in_progress"
                              ? "#0369a1"
                              : d.status === "returned"
                              ? "#b45309"
                              : d.status === "reconciled"
                              ? "#15803d"
                              : d.status === "cancelled"
                              ? "#b91c1c"
                              : "#475569",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      >
                        {d.status.replace("_", " ")}
                      </span>
                    </td>

                    <td>
                      <div>{d.yarn.issuedQuantity} kg</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {d.yarn.totalCost.toLocaleString()} ETB
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>{d.fabric.receivedQuantity}</strong> pcs ({d.fabric.totalWeight.toLocaleString()} g)
                      </div>
                      {d.fabric.receivedQuantity > 0 && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: isUnderweight ? "#dc2626" : "#15803d",
                            fontWeight: 600,
                          }}
                        >
                          Avg {d.fabric.averageWeight} g {isUnderweight ? `(std ${d.standardWeightG}g)` : "✓"}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontWeight: 800,
                          color: d.netPayable >= 0 ? "#15803d" : "#b45309",
                        }}
                      >
                        {d.netPayable >= 0 ? `+${d.netPayable.toLocaleString()}` : d.netPayable.toLocaleString()} ETB
                      </span>
                      {d.fabric.deductionAmount > 0 && (
                        <div style={{ fontSize: "0.72rem", color: "#dc2626" }}>
                          -{d.fabric.deductionAmount.toLocaleString()} ded.
                        </div>
                      )}
                    </td>

                    <td style={{ fontSize: "0.82rem", color: "#475569" }}>
                      <div>Issued {formatDateDDMMYY(d.dateIssued)}</div>
                      {d.dateReturned && (
                        <div style={{ color: "#059669", fontWeight: 500 }}>
                          Ret. {formatDateDDMMYY(d.dateReturned)}
                        </div>
                      )}
                    </td>

                    <td>
                      {d.settlement ? (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          Batch #{d.settlement.batchId}
                        </span>
                      ) : d.status === "returned" ? (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "2px 7px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          Ready to settle
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductionReportPage;
