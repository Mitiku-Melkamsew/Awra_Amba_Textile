import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { calculationsApi } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";
import { MarkRunAsPaidModal } from "./MarkRunAsPaidModal";
import { CancelRunModal } from "./CancelRunModal";

export function SettlementRunDetailPage() {
  const { runId, id } = useParams<{ runId?: string; id?: string }>();
  const batchId = runId || id || "";
  const navigate = useNavigate();

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Mark Paid Modal State
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [paidBy, setPaidBy] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [paidSubmitting, setPaidSubmitting] = useState(false);
  const [paidError, setPaidError] = useState("");

  // Cancel Run Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const loadBatchDetails = useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    calculationsApi
      .getSettlementPreview(batchId)
      .then((res: any) => {
        setBatch(res);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load settlement run");
      })
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => {
    loadBatchDetails();
  }, [loadBatchDetails]);

  // Handle Mark Run as Paid
  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;
    setPaidSubmitting(true);
    setPaidError("");
    try {
      await calculationsApi.payBatch(batchId, {
        paymentMethod: paidBy,
        notes: paymentNote || undefined,
      });
      setShowPaidModal(false);
      setSuccessMsg(`Run BATCH #${batchId} has been marked as paid in full.`);
      loadBatchDetails();
    } catch (err: any) {
      setPaidError(err.message || "Failed to mark run as paid");
    } finally {
      setPaidSubmitting(false);
    }
  };

  // Handle Cancel Run
  const handleCancelRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !cancelReason.trim()) return;
    setCancelSubmitting(true);
    setCancelError("");
    try {
      try {
        await calculationsApi.cancelBatch(batchId, cancelReason.trim());
      } catch (batchErr: any) {
        // Fallback to sequential individual cancellations if needed
        const items = (batch.settlements || batch.weavers || []).filter(
          (s: any) => s.settlementId && s.status !== "cancelled"
        );
        if (items.length > 0) {
          for (const item of items) {
            await calculationsApi.cancelSettlement(item.settlementId, cancelReason.trim());
          }
        } else {
          throw batchErr;
        }
      }
      setShowCancelModal(false);
      setSuccessMsg(`Run BATCH #${batchId} was cancelled and all zigs were released.`);
      loadBatchDetails();
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel run");
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Export CSV
  const handleDownloadCsv = () => {
    if (!batch || !batch.weavers) return;
    const headers = ["Weaver Name", "Net Payable (ETB)"];
    const rows = batch.weavers.map((w: any) => [
      `"${w.weaverName || `Weaver #${w.userId}`}"`,
      Math.round(w.netSettlement || 0),
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Settlement_Run_${batchId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !batch) {
    return (
      <div className="page">
        <Link to="/admin/settlement?tab=runs" className="settlement-back-link">
          ‹ Runs
        </Link>
        <div className="settlement-loading-state">
          ⏳ Loading settlement run…
        </div>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="page">
        <Link to="/admin/settlement?tab=runs" className="settlement-back-link">
          ‹ Runs
        </Link>
        <div className="settlement-alert-error">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const weavers = batch?.weavers || [];
  const grandTotal = Math.round(batch?.grandTotal || 0);
  const isPaid = batch?.status === "paid";
  const isCancelled = batch?.status === "cancelled";
  const isUnpaid = !isPaid && !isCancelled;

  return (
    <div className="page">
      {/* ── Back Navigation Link ── */}
      <Link to="/admin/settlement?tab=runs" className="settlement-back-link">
        ‹ Runs
      </Link>

      {/* ── Success Banner ── */}
      {successMsg && (
        <div className="settlement-alert-success">
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="settlement-alert-dismiss"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="settlement-run-header">
        <div>
          <div className="settlement-run-title-group">
            <h1 className="settlement-run-title">
              Settlement run · BATCH #{batchId}
            </h1>
            {isPaid ? (
              <span className="badge-settled">✓ Paid</span>
            ) : isCancelled ? (
              <span className="badge-cancelled">Cancelled</span>
            ) : (
              <span className="badge-unpaid">Confirmed · unpaid</span>
            )}
          </div>
          <p className="settlement-run-subtitle">
            Cutoff {batch?.cutoffDate ? formatDateDDMMYY(batch.cutoffDate) : "—"} · {weavers.length} weavers
          </p>
        </div>

        <div className="settlement-run-actions">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="btn btn-secondary"
          >
            <span>📥</span> Download CSV
          </button>

          {isUnpaid && (
            <button
              type="button"
              onClick={() => setShowPaidModal(true)}
              className="btn settlement-btn-mark-paid"
            >
              Mark run as paid…
            </button>
          )}
        </div>
      </div>

      {/* ── Top Banner Card ── */}
      <div className="settlement-banner-card">
        <div className="settlement-banner-desc">
          {isCancelled
            ? "This run has been cancelled. All zigs were released back to returned status."
            : "Everyone is paid together, in full"}
        </div>
        <div className="settlement-banner-total-wrap">
          <span className="settlement-banner-total-label">Total to pay</span>
          <strong className="settlement-banner-total-val">
            {isCancelled ? 0 : grandTotal.toLocaleString()} ETB
          </strong>
        </div>
      </div>

      {/* ── Weavers Table ── */}
      <div className="settlement-table-container">
        <table className="settlement-table">
          <thead>
            <tr>
              <th className="settlement-th">Weaver · ሸማኔ</th>
              <th className="settlement-th text-right">Net payable</th>
              <th className="settlement-th text-right"></th>
            </tr>
          </thead>
          <tbody>
            {weavers.map((w: any) => (
              <tr key={w.userId || w.weaverName} className="settlement-tr">
                <td className="settlement-td">
                  <Link
                    to={`/admin/weavers/${w.userId}`}
                    className="settlement-weaver-name-link"
                  >
                    {w.weaverName}
                  </Link>
                </td>

                <td className="settlement-td text-right">
                  <strong>
                    {Math.round(w.netSettlement || 0).toLocaleString()} ETB
                  </strong>
                </td>

                <td className="settlement-td text-right">
                  <button
                    type="button"
                    onClick={() => {
                      if (w.settlementId) {
                        navigate(`/admin/reports/hisab/weaver/${w.settlementId}`);
                      } else {
                        window.print();
                      }
                    }}
                    className="btn btn-secondary settlement-btn-statement"
                  >
                    <span>📥</span> Statement
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="settlement-tfoot-row">
              <td>Total</td>
              <td className="text-right">
                <span className="settlement-tfoot-total">
                  {isCancelled ? 0 : grandTotal.toLocaleString()} ETB
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Found a mistake? Callout Card ── */}
      <div className="settlement-mistake-card">
        <div>
          <div className="settlement-mistake-title">
            Found a mistake?
          </div>
          <div className="settlement-mistake-sub">
            {isCancelled
              ? "This run has been cancelled and its zigs released. You can correct the returns and start a new run."
              : "Cancel this run, correct the returns, then start a new run. A run cannot be cancelled once it is marked as paid."}
          </div>
        </div>

        {isUnpaid && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="settlement-btn-cancel-link"
          >
            Cancel this run…
          </button>
        )}
      </div>

      {/* ── Modals ── */}
      <MarkRunAsPaidModal
        isOpen={showPaidModal}
        onClose={() => setShowPaidModal(false)}
        loading={paidSubmitting}
        error={paidError}
        weaverCount={weavers.length}
        totalAmount={grandTotal}
        paidBy={paidBy}
        setPaidBy={setPaidBy}
        note={paymentNote}
        setNote={setPaymentNote}
        onSubmit={handleMarkPaid}
      />

      <CancelRunModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        loading={cancelSubmitting}
        error={cancelError}
        runReference={`BATCH #${batchId}`}
        settlementCount={weavers.length}
        reason={cancelReason}
        setReason={setCancelReason}
        onSubmit={handleCancelRun}
      />
    </div>
  );
}

export default SettlementRunDetailPage;
