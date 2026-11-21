import { useEffect, useState, useMemo } from "react";
import { auditService } from "../../../infrastructure/services";
import type { AuditLog } from "../../../domain/models";
import type { LogItem, LogDetailItem } from "./types";

export const INITIAL_LOGS: LogItem[] = [
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

export function formatAuditLogItem(item: AuditLog): LogItem {
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

export function useAuditLogsManager() {
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
  const [whatFilter, setWhatFilter] = useState("All areas");
  const [whoFilter, setWhoFilter] = useState("Everyone");
  const [periodFilter, setPeriodFilter] = useState("Last 30 days");
  const [expandedId, setExpandedId] = useState<string | number | null>(2);
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
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const whoOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.who));
    return ["Everyone", ...Array.from(set)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter((log) => {
      if (
        whatFilter !== "All areas" &&
        !log.area.toLowerCase().includes(whatFilter.toLowerCase()) &&
        !log.whatHappenedSub.toLowerCase().includes(whatFilter.toLowerCase())
      ) {
        return false;
      }
      if (whoFilter !== "Everyone" && log.who !== whoFilter) {
        return false;
      }
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

  return {
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
  };
}
