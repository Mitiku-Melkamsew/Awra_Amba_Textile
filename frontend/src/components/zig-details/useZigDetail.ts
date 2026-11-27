import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  catalogApi,
  workOrdersApi,
  yarnGivenApi,
  type WorkOrderDetail,
} from "../../api";
import { fabricVariantName } from "../../utils/variantNames";
import {
  createYarnLineDraft,
  parseYarnLines,
  yarnRowToLineDraft,
  type YarnLineDraft,
  type YarnLinePayload,
  type YarnVariantOption,
} from "../../utils/yarnLines";

export interface UseZigDetailProps {
  order: WorkOrderDetail;
  readOnly?: boolean;
  onRefresh: () => void;
}

export function useZigDetail({
  order,
  readOnly = false,
  onRefresh,
}: UseZigDetailProps) {
  // Yarn options & states
  const [yarnVariants, setYarnVariants] = useState<YarnVariantOption[]>([]);
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([
    createYarnLineDraft(),
  ]);
  const [giveYarnOpen, setGiveYarnOpen] = useState(false);
  const [editingYarnId, setEditingYarnId] = useState<number | null>(null);
  const [editingYarnLines, setEditingYarnLines] = useState<YarnLineDraft[]>([]);
  const [editingYarnRemark, setEditingYarnRemark] = useState("");

  // Fabric return record / edit section state
  const [searchParams] = useSearchParams();
  const shouldOpenReturn =
    searchParams.get("action") === "return" || searchParams.get("return") === "1";
  const [recordReturnOpen, setRecordReturnOpen] = useState(shouldOpenReturn);
  const [editingFabricReturn, setEditingFabricReturn] = useState<any | null>(null);

  useEffect(() => {
    if (shouldOpenReturn) {
      setRecordReturnOpen(true);
    }
  }, [shouldOpenReturn]);

  // Cancel Confirmation Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Global feedback
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const statusNorm = (order.status || "assigned").toLowerCase();

  const canEdit =
    !readOnly &&
    (statusNorm === "assigned" ||
      statusNorm === "in_progress" ||
      statusNorm === "returned");

  const canRecordFabric =
    !readOnly &&
    (statusNorm === "assigned" ||
      statusNorm === "in_progress" ||
      statusNorm === "returned");

  const canMarkReturned =
    !readOnly &&
    statusNorm !== "returned" &&
    statusNorm !== "reconciled" &&
    statusNorm !== "cancelled";

  const canCancel =
    !readOnly && statusNorm !== "reconciled" && statusNorm !== "cancelled";

  useEffect(() => {
    if (!canEdit) return;
    catalogApi.yarnVariants().then((variants) => {
      setYarnVariants(variants as YarnVariantOption[]);
      setYarnLines([createYarnLineDraft()]);
    });
  }, [canEdit]);

  function startEditYarn(yarnGivenId: number) {
    const row = order.yarnGiven.find((r) => r.yarnGivenId === yarnGivenId);
    if (!row) return;
    setEditingYarnId(yarnGivenId);
    setEditingYarnLines([yarnRowToLineDraft(row as any)]);
    setEditingYarnRemark((row as any).remark || "");
    setGiveYarnOpen(false);
    setError("");
  }

  function cancelEditYarn() {
    setEditingYarnId(null);
    setEditingYarnLines([]);
    setEditingYarnRemark("");
  }

  async function handleYarnEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingYarnId == null) return;
    const row = order.yarnGiven.find((r) => r.yarnGivenId === editingYarnId);
    if (!row) return;

    setError("");
    setMessage("");

    const line = editingYarnLines[0];
    if (!line) {
      setError("Please specify yarn details.");
      return;
    }

    const qty = parseFloat(line.quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    try {
      await yarnGivenApi.update(editingYarnId, {
        quantity: qty,
        unitPrice: line.unitPrice
          ? parseFloat(line.unitPrice)
          : row.unitPrice
          ? Number(row.unitPrice)
          : 0,
        remark: editingYarnRemark.trim() || undefined,
      });
      setMessage("Yarn delivery updated.");
      cancelEditYarn();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update yarn");
    }
  }

  async function handleYarnSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    let lines: YarnLinePayload[];
    try {
      lines = parseYarnLines(yarnLines);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid yarn lines entered"
      );
      return;
    }

    try {
      await yarnGivenApi.create({
        zigId: order.zigId,
        lines: lines.map((l) => ({
          yarnVariantId: Number(l.yarnVariantId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice || 0),
        })),
      });
      setMessage(`Recorded ${lines.length} yarn delivery(s).`);
      setYarnLines([createYarnLineDraft()]);
      setGiveYarnOpen(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record yarn");
    }
  }

  async function handleMarkReturned() {
    setError("");
    setMessage("");
    try {
      await workOrdersApi.markReturned(order.zigId);
      setMessage("Work order marked as returned.");
      onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark as returned"
      );
    }
  }

  async function handleConfirmCancelZig() {
    setError("");
    setMessage("");
    setCancelling(true);
    try {
      await workOrdersApi.cancel(order.zigId);
      setMessage("Work order cancelled successfully.");
      setIsCancelModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel zig");
    } finally {
      setCancelling(false);
    }
  }

  // Metadata calculations
  const totalYarnGiven = useMemo(
    () => order.yarnGiven.reduce((acc, yg) => acc + Number(yg.quantity || 0), 0),
    [order.yarnGiven]
  );
  const totalYarnCost = useMemo(
    () =>
      order.yarnGiven.reduce(
        (acc, yg) =>
          acc + Number(yg.quantity || 0) * Number(yg.unitPrice || 0),
        0
      ),
    [order.yarnGiven]
  );
  const totalFabricReturned = useMemo(
    () =>
      order.fabricReturns.reduce(
        (acc, fr) => acc + Number(fr.quantityReturned || 0),
        0
      ),
    [order.fabricReturns]
  );
  const totalGrossFabric = useMemo(
    () =>
      order.fabricReturns.reduce((acc, fr: any) => {
        const g =
          fr.grossFabricValue !== undefined
            ? Number(fr.grossFabricValue)
            : Number(fr.quantityReturned || 0) * Number(fr.unitPrice || 0);
        return acc + g;
      }, 0),
    [order.fabricReturns]
  );
  const totalDeductions = useMemo(
    () =>
      order.fabricReturns.reduce(
        (acc, fr: any) => acc + Number(fr.deductionAmount || 0),
        0
      ),
    [order.fabricReturns]
  );
  const totalNetFabric = totalGrossFabric - totalDeductions;
  const netPayable =
    order.netPayable !== undefined
      ? Number(order.netPayable)
      : totalNetFabric - totalYarnCost;

  const fabricDisplayName = useMemo(() => {
    if (order.fabricVariant) {
      return fabricVariantName(order.fabricVariant, " · ");
    }
    return order.fabric?.name || "Medebegna · Biret · Geberdin";
  }, [order.fabricVariant, order.fabric]);

  const weaverDisplayName =
    order.weaver.fullName || `Weaver #${order.weaverUserId}`;

  const currentStepIndex = useMemo(() => {
    if (statusNorm === "cancelled") return -1;
    if (statusNorm === "reconciled") return 3;
    if (statusNorm === "returned") return 2;
    if (statusNorm === "in_progress") return 1;
    return 0; // assigned
  }, [statusNorm]);

  return {
    yarnVariants,
    yarnLines,
    setYarnLines,
    giveYarnOpen,
    setGiveYarnOpen,
    editingYarnId,
    editingYarnLines,
    setEditingYarnLines,
    editingYarnRemark,
    setEditingYarnRemark,
    recordReturnOpen,
    setRecordReturnOpen,
    editingFabricReturn,
    setEditingFabricReturn,
    isCancelModalOpen,
    setIsCancelModalOpen,
    cancelling,
    error,
    setError,
    message,
    setMessage,
    statusNorm,
    canEdit,
    canRecordFabric,
    canMarkReturned,
    canCancel,
    startEditYarn,
    cancelEditYarn,
    handleYarnEditSubmit,
    handleYarnSubmit,
    handleMarkReturned,
    handleConfirmCancelZig,
    totalYarnGiven,
    totalYarnCost,
    totalFabricReturned,
    totalGrossFabric,
    totalDeductions,
    totalNetFabric,
    netPayable,
    fabricDisplayName,
    weaverDisplayName,
    currentStepIndex,
  };
}
