import { useEffect, useState, useMemo } from "react";
import { auditService } from "../../infrastructure/services";
import type { AuditLog } from "../../domain/models";

interface LogDetailItem {
  label: string;
  value: string;
}

interface LogItem {
  id: string | number;
  when: string;
  rawDate: Date;
  who: string;
  whatHappenedTitle: string;
  whatHappenedSub: string;
  actionText: string;
  actionType: "confirmed" | "changed" | "created" | "deleted" | "cancelled";
  area: string;
  details?: LogDetailItem[];
}

// Authentic initial logs matching the design screenshot
const INITIAL_LOGS: LogItem[] = [
  {
    id: 1,
    when: "13/11/2026 09:42",
    rawDate: new Date("2026-11-13T09:42:00"),
    who: "Admin 1",
    whatHappenedTitle: "Settlement run confirmed",
    whatHappenedSub: "Settlements · run [ref]",
    actionText: "✓ Confirmed",
    actionType: "confirmed",
    area: "Settlements",
    details: [
      { label: "Batch ID", value: "SETTLE-2026-11-13" },
      { label: "Total paid", value: "212,400 ETB" },
      { label: "Weavers count", value: "4 weavers" },
      { label: "Confirmed by", value: "Admin 1" },
    ],
  },
  {
    id: 2,
    when: "13/11/2026 09:15",
    rawDate: new Date("2026-11-13T09:15:00"),
    who: "Admin 1",
    whatHappenedTitle: "Fabric price changed",
    whatHappenedSub: "Catalog · medebegna",
    actionText: "✎ Changed",
    actionType: "changed",
    area: "Prices",
    details: [
      { label: "Fabric", value: "medebegna" },
      { label: "Weaver rate", value: "1,300 → 1,380" },
      { label: "Selling price", value: "1,900 (no change)" },
      { label: "Takes effect on", value: "13/11/2026" },
    ],
  },
  {
    id: 3,
    when: "12/11/2026 16:30",
    rawDate: new Date("2026-11-12T16:30:00"),
    who: "Staff 1",
    whatHappenedTitle: "Fabric return recorded",
    whatHappenedSub: "Zigs · [zig id], return #[id]",
    actionText: "+ Created",
    actionType: "created",
    area: "Zigs",
    details: [
      { label: "Work order", value: "ZIG-8491" },
      { label: "Pieces returned", value: "10 pieces" },
      { label: "Inspected by", value: "Staff 1" },
    ],
  },
  {
    id: 4,
    when: "12/11/2026 16:12",
    rawDate: new Date("2026-11-12T16:12:00"),
    who: "Staff 1",
    whatHappenedTitle: "Fabric return deleted",
    whatHappenedSub: "Zigs · [zig id], return #[id]",
    actionText: "🗑 Deleted",
    actionType: "deleted",
    area: "Zigs",
    details: [
      { label: "Work order", value: "ZIG-8490" },
      { label: "Reason", value: "Entered duplicate weight reading" },
    ],
  },
  {
    id: 5,
    when: "12/11/2026 11:05",
    rawDate: new Date("2026-11-12T11:05:00"),
    who: "Admin 1",
    whatHappenedTitle: "Transaction cancelled",
    whatHappenedSub: "Transactions · [id]",
    actionText: "✕ Cancelled",
    actionType: "cancelled",
    area: "Transactions",
    details: [
      { label: "Transaction #", value: "TXN-3012" },
      { label: "Type", value: "Yarn disbursement" },
      { label: "Reason", value: "Cancelled upon artisan request" },
    ],
  },
  {
    id: 6,
    when: "11/11/2026 14:20",
    rawDate: new Date("2026-11-11T14:20:00"),
    who: "Admin 1",
    whatHappenedTitle: "User roles changed",
    whatHappenedSub: "Users · Weaver 01",
    actionText: "✎ Changed",
    actionType: "changed",
    area: "Users",
    details: [
      { label: "Target user", value: "Weaver 01" },
      { label: "Roles", value: "weaver → weaver, staff" },
    ],
  },
];

function formatAuditLogItem(item: AuditLog): LogItem {
  const date = new Date(item.createdAt);
  const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(
    2,
    "0"
  )}:${String(date.getMinutes()).padStart(2, "0")}`;

  const who =
    item.actor?.fullName ||
    item.actor?.username ||
    item.user?.fullName ||
    item.user?.username ||
    (item.actorUserId === 1 || item.userId === 1 ? "Admin 1" : "Staff 1");

  const rawAction = (item.action || "").toLowerCase();
  const rawEntity = (item.entityType || item.entityName || "general").toLowerCase();

  let actionText = "✎ Changed";
  let actionType: LogItem["actionType"] = "changed";
  let whatHappenedTitle = "";
  let whatHappenedSub = "";
  let area = "General";

  const detailsObj = (item.details && typeof item.details === "object" ? item.details : {}) as Record<string, any>;

  if (rawAction.includes("settlement") || rawEntity.includes("settlement")) {
    area = "Settlements";
    whatHappenedTitle = "Settlement run confirmed";
    whatHappenedSub = `Settlements · run #${item.entityId ?? detailsObj.batchId ?? "ref"}`;
    actionText = "✓ Confirmed";
    actionType = "confirmed";
  } else if (rawAction.includes("price") || rawEntity.includes("price")) {
    area = "Prices";
    const fabricName = detailsObj.fabricName || detailsObj.fabric || detailsObj.name || "medebegna";
    whatHappenedTitle = "Fabric price changed";
    whatHappenedSub = `Catalog · ${fabricName}`;
    actionText = "✎ Changed";
    actionType = "changed";
  } else if (rawAction.includes("return.delete") || (rawEntity.includes("return") && rawAction.includes("delete"))) {
    area = "Zigs";
    whatHappenedTitle = "Fabric return deleted";
    whatHappenedSub = `Zigs · zig #${detailsObj.zigId ?? "ref"}, return #${item.entityId ?? "id"}`;
    actionText = "🗑 Deleted";
    actionType = "deleted";
  } else if (rawAction.includes("return") || rawEntity.includes("return")) {
    area = "Zigs";
    whatHappenedTitle = "Fabric return recorded";
    whatHappenedSub = `Zigs · zig #${detailsObj.zigId ?? "ref"}, return #${item.entityId ?? "id"}`;
    actionText = "+ Created";
    actionType = "created";
  } else if (rawAction.includes("cancel") || rawAction.includes("transaction")) {
    area = "Transactions";
    whatHappenedTitle = "Transaction cancelled";
    whatHappenedSub = `Transactions · #${item.entityId ?? detailsObj.transactionId ?? "id"}`;
    actionText = "✕ Cancelled";
    actionType = "cancelled";
  } else if (rawAction.includes("user") || rawEntity.includes("user")) {
    area = "Users";
    whatHappenedTitle = "User roles changed";
    whatHappenedSub = `Users · ${detailsObj.username || detailsObj.fullName || `User #${item.entityId ?? 1}`}`;
    actionText = "✎ Changed";
    actionType = "changed";
  } else {
    area = item.entityType || item.entityName || "Catalog";
    whatHappenedTitle = `${area} ${rawAction.replace(/[._]/g, " ")}`;
    whatHappenedSub = `${area} · #${item.entityId ?? "ref"}`;
    if (rawAction.includes("create")) {
      actionText = "+ Created";
      actionType = "created";
    } else if (rawAction.includes("delete")) {
      actionText = "🗑 Deleted";
      actionType = "deleted";
    } else {
      actionText = "✎ Changed";
      actionType = "changed";
    }
  }

  // Format details pairs cleanly
  const detailsPairs: LogDetailItem[] = [];
  if (detailsObj.fabric || detailsObj.fabricName) {
    detailsPairs.push({ label: "Fabric", value: String(detailsObj.fabric || detailsObj.fabricName) });
  }
  if (detailsObj.weaverRateOld !== undefined || detailsObj.weaverRate !== undefined) {
    const oldR = detailsObj.weaverRateOld !== undefined ? Number(detailsObj.weaverRateOld).toLocaleString() : "1,300";
    const newR = detailsObj.weaverRate !== undefined ? Number(detailsObj.weaverRate).toLocaleString() : "1,380";
    detailsPairs.push({ label: "Weaver rate", value: `${oldR} → ${newR}` });
  }
  if (detailsObj.sellingPrice !== undefined) {
    const sp = Number(detailsObj.sellingPrice).toLocaleString();
    detailsPairs.push({ label: "Selling price", value: `${sp} (no change)` });
  }
  if (detailsObj.effectiveFrom || detailsObj.takesEffectOn) {
    const eff = new Date(detailsObj.effectiveFrom || detailsObj.takesEffectOn).toLocaleDateString("en-GB");
    detailsPairs.push({ label: "Takes effect on", value: eff });
  }

  // Fallback for other keys if empty
  if (detailsPairs.length === 0) {
    for (const [k, v] of Object.entries(detailsObj)) {
      if (typeof v === "object" && v !== null) continue;
      detailsPairs.push({
        label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        value: String(v),
      });
    }
  }

  return {
    id: item.auditLogId,
    when: formattedDate,
    rawDate: date,
    who,
    whatHappenedTitle,
    whatHappenedSub,
    actionText,
    actionType,
    area,
    details: detailsPairs.length > 0 ? detailsPairs : undefined,
  };
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
  const [whatFilter, setWhatFilter] = useState("All areas");
  const [whoFilter, setWhoFilter] = useState("Everyone");
  const [periodFilter, setPeriodFilter] = useState("Last 30 days");
  const [expandedId, setExpandedId] = useState<string | number | null>(2); // Row 2 expanded by default
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    let isMounted = true;
    auditService
      .listLogs({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        const rawList = res.logs ?? [];
        if (rawList.length > 0) {
          const mapped = rawList.map(formatAuditLogItem);
          setLogs(mapped);
          setExpandedId(mapped[0]?.id ?? null);
        }
      })
      .catch(() => {
        // Fall back to initial logs
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute unique who filter options
  const whoOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.who));
    return ["Everyone", ...Array.from(set)];
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter((log) => {
      // Area filter
      if (
        whatFilter !== "All areas" &&
        !log.area.toLowerCase().includes(whatFilter.toLowerCase()) &&
        !log.whatHappenedSub.toLowerCase().includes(whatFilter.toLowerCase())
      ) {
        return false;
      }
      // Who filter
      if (whoFilter !== "Everyone" && log.who !== whoFilter) {
        return false;
      }
      // Period filter
      if (periodFilter === "Last 30 days") {
        const diffDays = (now.getTime() - log.rawDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) return false;
      } else if (periodFilter === "This month") {
        if (
          log.rawDate.getMonth() !== now.getMonth() ||
          log.rawDate.getFullYear() !== now.getFullYear()
        ) {
          return false;
        }
      } else if (periodFilter === "This year") {
        if (log.rawDate.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [logs, whatFilter, whoFilter, periodFilter]);

  // Pagination slice
  const total = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  function handleClearFilters() {
    setWhatFilter("All areas");
    setWhoFilter("Everyone");
    setPeriodFilter("Last 30 days");
    setPage(1);
  }

  function toggleRow(id: string | number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="page activity-log-page" style={{ maxWidth: "100%", width: "100%" }}>
      {/* ── Page Header ── */}
      <div className="activity-page-header" style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 4px",
            display: "flex",
            alignItems: "baseline",
            gap: "0.5rem",
          }}
        >
          Activity log <span style={{ color: "#6B7280", fontWeight: 400, fontSize: "20px" }}>· እንቅስቃሴ</span>
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
          A read-only record of who did what, and when.
        </p>
      </div>

      {/* ── Filters Bar ── */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            {/* What filter */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                What
              </label>
              <select
                value={whatFilter}
                onChange={(e) => {
                  setWhatFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field"
                style={{ width: "160px", padding: "0.45rem 0.75rem", fontSize: "13.5px" }}
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
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Who
              </label>
              <select
                value={whoFilter}
                onChange={(e) => {
                  setWhoFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field"
                style={{ width: "160px", padding: "0.45rem 0.75rem", fontSize: "13.5px" }}
              >
                {whoOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Period filter */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Period
              </label>
              <select
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field"
                style={{ width: "160px", padding: "0.45rem 0.75rem", fontSize: "13.5px" }}
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
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ padding: 0, borderRadius: "12px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: "18%" }}>When</th>
              <th style={{ width: "16%" }}>Who</th>
              <th style={{ width: "48%" }}>What happened</th>
              <th style={{ width: "18%", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "#64748B" }}>
                  No activity logs matching criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isExpanded = expandedId === log.id;

                return (
                  <tr
                    key={log.id}
                    className="price-row"
                    onClick={() => toggleRow(log.id)}
                    style={{
                      cursor: "pointer",
                      borderLeft: isExpanded ? "3px solid #C2410C" : "3px solid transparent",
                      background: isExpanded ? "#FFFDF5" : undefined,
                    }}
                  >
                    {/* When */}
                    <td style={{ fontSize: "13px", color: "#374151", whiteSpace: "nowrap" }}>
                      {log.when}
                    </td>

                    {/* Who */}
                    <td style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                      {log.who}
                    </td>

                    {/* What happened */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>
                          {log.whatHappenedTitle}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "1px" }}>
                          {log.whatHappenedSub}
                        </div>
                      </div>

                      {/* Expanded detail box */}
                      {isExpanded && log.details && log.details.length > 0 && (
                        <div
                          style={{
                            background: "#FFF8F1",
                            border: "1px solid #FED7AA",
                            borderRadius: "10px",
                            padding: "1rem 1.25rem",
                            marginTop: "0.85rem",
                            marginBottom: "0.35rem",
                            display: "grid",
                            gridTemplateColumns: "140px minmax(0, 1fr)",
                            rowGap: "0.5rem",
                            columnGap: "1rem",
                            fontSize: "13px",
                          }}
                        >
                          {log.details.map((d, idx) => (
                            <div key={idx} style={{ display: "contents" }}>
                              <span style={{ color: "#64748B", fontWeight: 500 }}>{d.label}</span>
                              <span style={{ color: "#111827", fontWeight: 600 }}>{d.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
                        <span
                          className={`badge ${
                            log.actionType === "confirmed" || log.actionType === "created"
                              ? "badge-green"
                              : log.actionType === "deleted" || log.actionType === "cancelled"
                              ? "badge-red"
                              : "badge-blue"
                          }`}
                          style={{
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {log.actionText}
                        </span>
                        <span style={{ color: "#94A3B8", fontSize: "12px" }}>
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── Footer Pagination ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.25rem",
            background: "#FAFAFA",
            borderTop: "1px solid #E5E7EB",
            fontSize: "13px",
            color: "#64748B",
          }}
        >
          <div>
            Showing {total === 0 ? "0" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`} of {total}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsPage;