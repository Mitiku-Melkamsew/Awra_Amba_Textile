import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { settlementsApi } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import type { ZigLedgerItem, ProductionStatusTab, ProductionStats } from "./types";

export function useProductionReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get("status");
  const initialStatus: ProductionStatusTab =
    urlStatus === "ongoing" || urlStatus === "returned" || urlStatus === "reconciled"
      ? urlStatus
      : "all";

  const [data, setData] = useState<ZigLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusTab, setStatusTabState] = useState<ProductionStatusTab>(initialStatus);
  const [search, setSearch] = useState("");

  // Sync state if urlStatus changes (e.g. dashboard link navigation)
  useEffect(() => {
    if (urlStatus === "ongoing" || urlStatus === "returned" || urlStatus === "reconciled") {
      setStatusTabState(urlStatus);
    } else if (!urlStatus) {
      setStatusTabState("all");
    }
  }, [urlStatus]);

  const setStatusTab = useCallback(
    (tab: ProductionStatusTab) => {
      setStatusTabState(tab);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "all") {
          next.delete("status");
        } else {
          next.set("status", tab);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const fetchLedger = useCallback(() => {
    setLoading(true);
    settlementsApi
      .zigsLedger()
      .then((res: unknown) => {
        setData(Array.isArray(res) ? (res as ZigLedgerItem[]) : []);
        setError("");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load production ledger");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

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
  const stats: ProductionStats = useMemo(() => {
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

  const exportCsv = useCallback(() => {
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
  }, [filteredData, statusTab]);

  return {
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
    refresh: fetchLedger,
  };
}
