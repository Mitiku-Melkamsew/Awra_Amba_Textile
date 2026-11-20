import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { calculationsApi } from "../../api";
import type { OutOfCutoffZig, PendingSettlementsSummary, ZigLedgerItem } from "../../domain/models";

export interface BatchPreview {
  previewId: string;
  weavers: Array<{
    userId: number;
    weaverName: string;
    zigIds: string[];
    returnCount: number;
    yarnCount: number;
    netSettlement: number;
    isBlocked: boolean;
    blockReasons: string[];
    lineItems: Array<{
      returnId: number;
      zigId: string;
      fabricId?: number;
      quantityReturned?: number;
      excludedQuantity?: number;
      quantity: number;
      totalWeight: number;
      avgWeight: number;
      unitPrice: number;
      deductionPerPiece: number;
      grossValue: number;
      deductionAmount: number;
      netCredit: number;
      remark: string;
    }>;
    yarnDebits: Array<{
      yarnGivenId: number;
      zigId: string;
      cost: number;
    }>;
    zigDetails?: Array<{
      zigId: string;
      groupedReturns: Array<{
        fabricType: string;
        quantityReturned: number;
        avgWeight: number;
        unitPrice: number;
        deductionPerPiece: number;
        adjustedPrice: number;
        lineSubtotal: number;
      }>;
      yarnQty: number;
      yarnTotal: number;
      yarnAvgPrice: number;
      fabricTotal: number;
      netProfit: number;
    }>;
  }>;
  weaverCount: number;
  grandTotal: number;
  amharicAmountInWords: string;
  cutoffDate?: string | null;
  outOfCutoffZigs?: OutOfCutoffZig[];
}

export interface CommittedPayment {
  settlementId: number;
  weaverUserId: number;
  weaverName: string;
  amount: number;
  status?: string;
}

export type Step = "idle" | "previewed" | "committed";
export type TabView = "payroll" | "ledger";

export function useSettlementManager() {
  const [activeTab, setActiveTab] = useState<TabView>("payroll");
  const [step, setStep] = useState<Step>("idle");
  const [cutoffDate, setCutoffDate] = useState("");
  const [exceptionZigIds, setExceptionZigIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [committedPreviewId, setCommittedPreviewId] = useState("");
  const [committedTotal, setCommittedTotal] = useState(0);
  const [committedWeaverCount, setCommittedWeaverCount] = useState(0);
  const [isBatchPaid, setIsBatchPaid] = useState(false);
  const [payments, setPayments] = useState<CommittedPayment[]>([]);
  const [expandedWeaverId, setExpandedWeaverId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Real-time Pending Summary
  const [pendingSummary, setPendingSummary] = useState<PendingSettlementsSummary | null>(null);

  // Master Zigs Ledger State
  const [ledgerStatus, setLedgerStatus] = useState("all");
  const [ledgerData, setLedgerData] = useState<ZigLedgerItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Dispute Cancellation Modal
  const [cancellingPayment, setCancellingPayment] = useState<CommittedPayment | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("cash");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  async function loadPendingSummary() {
    try {
      const summary = await calculationsApi.pendingSummary();
      setPendingSummary(summary);
    } catch {
      // Non-fatal if summary fails to load
    }
  }

  async function loadZigsLedger(status: string) {
    setLedgerLoading(true);
    try {
      const data = await calculationsApi.zigsLedger(status);
      setLedgerData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load zigs ledger");
    } finally {
      setLedgerLoading(false);
    }
  }

  useEffect(() => {
    loadPendingSummary();
  }, []);

  useEffect(() => {
    if (activeTab === "ledger") {
      loadZigsLedger(ledgerStatus);
    }
  }, [activeTab, ledgerStatus]);

  async function handlePreview(currentExceptions = exceptionZigIds) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const p: any = await calculationsApi.batchPreview({
        cutoffDate: cutoffDate || undefined,
        includeZigIds: currentExceptions.length > 0 ? currentExceptions : undefined,
      });
      setPreview(p);
      setStep("previewed");
      setMessage("Master payroll preview calculated in-memory. Review lines before committing.");
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Preview generation failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleExceptionZig(zigId: string) {
    const updated = exceptionZigIds.includes(zigId)
      ? exceptionZigIds.filter((id) => id !== zigId)
      : [...exceptionZigIds, zigId];
    setExceptionZigIds(updated);
    if (step === "previewed" || cutoffDate) {
      handlePreview(updated);
    }
  }

  async function handleCommit() {
    if (!preview || preview.weaverCount === 0) return;
    if (
      !confirm(
        `Confirm and commit batch settlement for ${preview.weaverCount} weavers totaling ${Math.round(
          preview.grandTotal
        ).toLocaleString()} ETB?`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await calculationsApi.batchCommit({
        cutoffDate: cutoffDate || undefined,
        includeZigIds: exceptionZigIds.length > 0 ? exceptionZigIds : undefined,
        expectedNetSettlement: preview.grandTotal,
      });
      setPayments(result.payments);
      setCommittedPreviewId(result.previewId);
      setCommittedTotal(result.grandTotal);
      setCommittedWeaverCount(result.weaverCount);
      setIsBatchPaid(result.amountPaid >= result.grandTotal - 0.01 && result.grandTotal > 0);
      setStep("committed");
      setMessage(
        `Batch #${result.previewId} committed successfully for ${result.weaverCount} weavers (${Math.round(
          result.grandTotal
        ).toLocaleString()} ETB). Ready for payout disbursement.`
      );
      setPreview(null);
      loadPendingSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisbursePayout(e: FormEvent) {
    e.preventDefault();
    if (!committedPreviewId) return;

    setPayoutLoading(true);
    setPayoutError("");
    try {
      const payoutRes = await calculationsApi.payBatch(committedPreviewId, {
        paymentMethod: payoutMethod,
        notes: payoutNotes || undefined,
      });

      const totalAmount = Number(payoutRes?.totalAmount ?? committedTotal);
      const amountPaid = Number(payoutRes?.amountPaid ?? 0);
      const fullyPaid =
        payoutRes?.status === "paid" || amountPaid >= totalAmount - 0.01;

      setIsBatchPaid(fullyPaid);
      setShowPayoutModal(false);
      setMessage(
        `✓ Payout of ${Math.round(amountPaid || committedTotal).toLocaleString()} ETB disbursed successfully for Batch #${committedPreviewId}!`
      );

      if (payoutRes?.payments) {
        const bySettlement = new Map<number, any>(
          (payoutRes.payments as any[]).map((payment) => [
            Number(payment.settlementId),
            payment,
          ])
        );
        setPayments((prev) =>
          prev.map((p) => {
            const settlementId = Number(p.settlementId);
            const paid = bySettlement.get(settlementId);
            return {
              ...p,
              status: paid || fullyPaid ? "paid" : p.status,
            };
          })
        );
      }
      loadPendingSummary();
    } catch (err: any) {
      setPayoutError(err.message || "Failed to disburse batch payment");
    } finally {
      setPayoutLoading(false);
    }
  }

  async function handleConfirmCancelSettlement(e: FormEvent) {
    e.preventDefault();
    if (!cancellingPayment || !cancellationReason.trim()) return;

    setCancelLoading(true);
    try {
      await calculationsApi.cancelSettlement(
        cancellingPayment.settlementId,
        cancellationReason.trim()
      );

      setMessage(
        `Settlement for ${cancellingPayment.weaverName} cancelled successfully. Work orders returned to unsettled pool.`
      );
      setPayments((prev) =>
        prev.map((p) =>
          p.settlementId === cancellingPayment.settlementId
            ? { ...p, status: "cancelled" }
            : p
        )
      );
      setCancellingPayment(null);
      setCancellationReason("");
      loadPendingSummary();
    } catch (err: any) {
      setError(err.message || "Failed to cancel settlement");
    } finally {
      setCancelLoading(false);
    }
  }

  function resetBatch() {
    setStep("idle");
    setCutoffDate("");
    setExceptionZigIds([]);
    setPreview(null);
    setCommittedPreviewId("");
    setCommittedTotal(0);
    setCommittedWeaverCount(0);
    setIsBatchPaid(false);
    setPayments([]);
    setMessage("");
    setError("");
  }

  return {
    activeTab,
    setActiveTab,
    step,
    setStep,
    cutoffDate,
    setCutoffDate,
    exceptionZigIds,
    setExceptionZigIds,
    preview,
    committedPreviewId,
    committedTotal,
    committedWeaverCount,
    isBatchPaid,
    payments,
    expandedWeaverId,
    setExpandedWeaverId,
    message,
    setMessage,
    error,
    setError,
    loading,
    pendingSummary,
    ledgerStatus,
    setLedgerStatus,
    ledgerData,
    ledgerLoading,
    cancellingPayment,
    setCancellingPayment,
    cancellationReason,
    setCancellationReason,
    cancelLoading,
    showPayoutModal,
    setShowPayoutModal,
    payoutMethod,
    setPayoutMethod,
    payoutNotes,
    setPayoutNotes,
    payoutLoading,
    payoutError,
    handlePreview,
    toggleExceptionZig,
    handleCommit,
    handleDisbursePayout,
    handleConfirmCancelSettlement,
    resetBatch,
  };
}
