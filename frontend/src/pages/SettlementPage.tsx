import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { calculationsApi, reportsApi } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";
import type { OutOfCutoffZig, PendingSettlementsSummary, ZigLedgerItem } from "../domain/models";

interface BatchPreview {
  previewId: string;
  weavers: Array<{
    weaverId: number;
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

interface CommittedPayment {
  paymentId: number;
  settlementId?: number;
  weaverId: number;
  weaverName: string;
  amount: number;
  status?: string;
  reconciledZigIds: string[];
}

type Step = "idle" | "previewed" | "committed";
type TabView = "payroll" | "ledger";

export function SettlementPage() {
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
          preview.grandTotal,
        ).toLocaleString()} ETB?`,
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
      });
      setPayments(result.payments);
      setCommittedPreviewId(result.previewId);
      setCommittedTotal(result.grandTotal);
      setCommittedWeaverCount(result.weaverCount);
      setIsBatchPaid(result.amountPaid >= result.grandTotal - 0.01 && result.grandTotal > 0);
      setStep("committed");
      setMessage(
        `Batch #${result.previewId} committed successfully for ${result.weaverCount} weavers (${Math.round(
          result.grandTotal,
        ).toLocaleString()} ETB). Ready for payout disbursement.`,
      );
      setPreview(null);
      loadPendingSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisbursePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!committedPreviewId) return;

    setPayoutLoading(true);
    setPayoutError("");
    try {
      const payoutRes = await calculationsApi.payBatch(committedPreviewId, {
        amount: committedTotal,
        paymentMethod: payoutMethod,
        notes: payoutNotes || undefined,
      });

      setIsBatchPaid(true);
      setShowPayoutModal(false);
      setMessage(
        `✓ Payout of ${Math.round(committedTotal).toLocaleString()} ETB disbursed successfully for Batch #${committedPreviewId}! All work orders are reconciled.`,
      );

      if (payoutRes.payments) {
        setPayments((prev) =>
          prev.map((p, idx) => ({
            ...p,
            paymentId: payoutRes.payments[idx]?.settlementPaymentId ?? p.paymentId,
            status: "paid",
          })),
        );
      }
      loadPendingSummary();
    } catch (err: any) {
      setPayoutError(err.message || "Failed to disburse batch payment");
    } finally {
      setPayoutLoading(false);
    }
  }

  async function handleConfirmCancelSettlement(e: React.FormEvent) {
    e.preventDefault();
    if (!cancellingPayment || !cancellationReason.trim()) return;

    setCancelLoading(true);
    try {
      await calculationsApi.cancelSettlement(
        cancellingPayment.settlementId ?? cancellingPayment.paymentId,
        cancellationReason.trim(),
      );

      setMessage(
        `Settlement for ${cancellingPayment.weaverName} cancelled successfully. Work orders returned to unsettled pool.`,
      );
      setPayments((prev) =>
        prev.map((p) =>
          p.paymentId === cancellingPayment.paymentId ? { ...p, status: "cancelled" } : p,
        ),
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Payroll & Settlement</p>
          <h1 className="page-title">Weaver Payroll & Production Settlement</h1>
          <p className="page-subtitle">
            Consolidate returned fabric, apply standardized quality weight deductions, debit yarn materials, and disburse official HISAB payrolls.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/admin/settlement/history" className="btn-ghost">
            <span>📜</span> Batch History / ታሪክ
          </Link>
        </div>
      </div>

      {/* Real-time Pending Liability Banner */}
      {pendingSummary && (
        <div
          style={{
            background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
            border: "1px solid #BFDBFE",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>
              ⚡ Real-Time Unsettled Weaver Liability (ያልተከፈለ ተከፋይ ድምር)
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1E3A8A", marginTop: "0.15rem" }}>
              {pendingSummary.totalPendingAmount.toLocaleString()} ETB
            </div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "13px", color: "#1E3A8A" }}>
            <div>
              Ready Artisans: <strong>{pendingSummary.weaverCount}</strong>
            </div>
            <div>
              Completed Zigs: <strong>{pendingSummary.zigCount}</strong>
            </div>
            <div>
              Total Fabric Pieces: <strong>{pendingSummary.totalPieceCount} pcs</strong>
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1.5px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "payroll" ? "var(--primary, #0F766E)" : "transparent",
            color: activeTab === "payroll" ? "#FFFFFF" : "var(--text-muted)",
          }}
        >
          💼 Payroll Batch Workspace / የክፍያ ማዘጋጃ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            background: activeTab === "ledger" ? "var(--primary, #0F766E)" : "transparent",
            color: activeTab === "ledger" ? "#FFFFFF" : "var(--text-muted)",
          }}
        >
          📄 Master Zigs Ledger / የስራ ትዕዛዞች ሰነድ
        </button>
      </div>

      {message && (
        <div className="success-msg" style={{ marginBottom: "1rem" }}>
          <span>✅</span> {message}
        </div>
      )}
      {error && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* TAB 1: PAYROLL WORKSPACE */}
      {activeTab === "payroll" && (
        <>
          {/* Stepper */}
          <div className="settlement-steps">
            <div className={`step-item ${step === "idle" ? "active" : "done"}`}>
              <span className="step-number">{step === "idle" ? "1" : "✓"}</span>
              <span className="step-label">1. Set Cutoff & Exceptions</span>
            </div>
            <div className="step-divider" />
            <div className={`step-item ${step === "previewed" ? "active" : step === "committed" ? "done" : ""}`}>
              <span className="step-number">{step === "committed" ? "✓" : "2"}</span>
              <span className="step-label">2. Review Fabric & Yarn Lines</span>
            </div>
            <div className="step-divider" />
            <div className={`step-item ${step === "committed" ? "done active" : ""}`}>
              <span className="step-number">{step === "committed" ? "✓" : "3"}</span>
              <span className="step-label">3. Commit & Pay in One Shot</span>
            </div>
          </div>

          {/* Control Card */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px" }}>
                <label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>
                  <span>Cutoff Date (የማጣሪያ ቀን)</span>
                  <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "11.5px" }}> — optional</span>
                </label>
                <input
                  type="date"
                  value={cutoffDate}
                  onChange={(e) => {
                    setCutoffDate(e.target.value);
                    setExceptionZigIds([]);
                  }}
                  disabled={loading || step === "committed"}
                  style={{ width: "100%", height: "42px" }}
                />
                <span style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                  Only zigs returned on or before this date are included. If cash is limited, choose an earlier cutoff.
                </span>
              </div>

              <div className="button-row" style={{ flex: "2 1 auto", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handlePreview()}
                  disabled={loading || step === "committed"}
                >
                  {loading && step === "idle" ? "Calculating Preview…" : "1. Preview Payroll / አዘጋጅ"}
                </button>

                {preview && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCommit}
                    disabled={loading || preview.weavers.some((w) => w.isBlocked)}
                  >
                    {loading && step === "previewed" ? "Committing…" : "2. Confirm & Commit Batch / አጽድቅ"}
                  </button>
                )}

                {step === "committed" && committedPreviewId && (
                  <>
                    {!isBatchPaid && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ background: "#059669", borderColor: "#059669" }}
                        onClick={() => setShowPayoutModal(true)}
                      >
                        💳 Disburse Batch Payment / ክፍያ ፈጽም
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
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
                      }}
                    >
                      Start Next Batch
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Cutoff Exception Zigs UI */}
            {preview && preview.outOfCutoffZigs && preview.outOfCutoffZigs.length > 0 && (
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "0.85rem 1rem",
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400E", marginBottom: "0.5rem" }}>
                  ⚠️ Zigs Returned After Cutoff ({formatDateDDMMYY(cutoffDate)}) — Select to Include as Exceptions:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {preview.outOfCutoffZigs.map((zig) => (
                    <label
                      key={zig.zigId}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "12.5px",
                        background: "#FFFFFF",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "6px",
                        border: "1px solid #FCD34D",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={exceptionZigIds.includes(zig.zigId)}
                        onChange={() => toggleExceptionZig(zig.zigId)}
                      />
                      <span>
                        <strong>{zig.zigId}</strong> ({zig.weaverName} — {formatDateDDMMYY(zig.firstReturnDate)})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Detail with Accordion for Fabric Lines and Yarn Lines */}
          {preview && (
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1.5px solid var(--border)",
                }}
              >
                <div>
                  <h3 className="section-title" style={{ margin: 0, fontSize: "18px" }}>
                    Master Payroll Preview (In-Memory)
                  </h3>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                    Total Artisans: <strong>{preview.weaverCount}</strong> | Grand Payout:{" "}
                    <strong style={{ color: "var(--accent)" }}>
                      {Math.round(preview.grandTotal).toLocaleString()} ETB
                    </strong>
                    {" "}({preview.amharicAmountInWords})
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Weaver</th>
                      <th>Work Orders (ዝግ)</th>
                      <th style={{ textAlign: "right" }}>Fabric Billable</th>
                      <th style={{ textAlign: "right" }}>Yarn Deductions</th>
                      <th style={{ textAlign: "right" }}>Net Payable (ETB)</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Lines Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.weavers.map((w) => {
                      const isExpanded = expandedWeaverId === w.weaverId;
                      return (
                        <>
                          <tr key={w.weaverId}>
                            <td style={{ fontWeight: 600 }}>{w.weaverName}</td>
                            <td>{w.zigIds.join(", ")}</td>
                            <td style={{ textAlign: "right" }}>{w.returnCount} pcs</td>
                            <td style={{ textAlign: "right" }}>
                              {w.yarnDebits.reduce((sum, y) => sum + y.cost, 0).toLocaleString()} ETB
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green)" }}>
                              {Math.round(w.netSettlement).toLocaleString()} ETB
                            </td>
                            <td>
                              {w.isBlocked ? (
                                <span className="badge badge-red">Blocked</span>
                              ) : (
                                <span className="badge badge-green">Valid</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="btn-sm"
                                onClick={() => setExpandedWeaverId(isExpanded ? null : w.weaverId)}
                              >
                                {isExpanded ? "Hide Lines ▲" : "View Lines ▼"}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Lines View: Fabric Lines and Yarn Lines */}
                          {isExpanded && (
                            <tr key={`${w.weaverId}-expanded`}>
                              <td colSpan={7} style={{ background: "var(--bg-subtle)", padding: "1rem" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                                  {/* Fabric Lines */}
                                  <div>
                                    <h4 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 700 }}>
                                      📦 Fabric Lines / የተረከብነው ጨርቅ (Earnings)
                                    </h4>
                                    <table style={{ background: "#FFFFFF", fontSize: "12.5px" }}>
                                      <thead>
                                        <tr>
                                          <th>Zig ID</th>
                                          <th>Received Pcs</th>
                                          <th>Defective (Returned)</th>
                                          <th>Billable Pcs</th>
                                          <th>Avg Weight (g)</th>
                                          <th>Rate (ETB)</th>
                                          <th>Penalty / Pc</th>
                                          <th>Net Fabric Credit</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {w.lineItems.map((li) => (
                                          <tr key={li.returnId}>
                                            <td>{li.zigId}</td>
                                            <td>{li.quantityReturned ?? li.quantity}</td>
                                            <td>{li.excludedQuantity ?? 0}</td>
                                            <td style={{ fontWeight: 600 }}>{li.quantity}</td>
                                            <td>{li.avgWeight}g</td>
                                            <td>{li.unitPrice}</td>
                                            <td style={{ color: li.deductionPerPiece > 0 ? "red" : "inherit" }}>
                                              {li.deductionPerPiece > 0 ? `-${li.deductionPerPiece}` : "0"}
                                            </td>
                                            <td style={{ fontWeight: 700 }}>{li.netCredit.toLocaleString()} ETB</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Yarn Lines */}
                                  <div>
                                    <h4 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 700 }}>
                                      🧶 Yarn Lines / የተሰጠ ክር ወጪ (Material Debits)
                                    </h4>
                                    {w.yarnDebits.length > 0 ? (
                                      <table style={{ background: "#FFFFFF", fontSize: "12.5px" }}>
                                        <thead>
                                          <tr>
                                            <th>Zig ID</th>
                                            <th>Yarn Debit Ref</th>
                                            <th style={{ textAlign: "right" }}>Total Yarn Cost</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {w.yarnDebits.map((yd, idx) => (
                                            <tr key={idx}>
                                              <td>{yd.zigId}</td>
                                              <td>Yarn Given #{yd.yarnGivenId}</td>
                                              <td style={{ textAlign: "right", color: "red", fontWeight: 600 }}>
                                                -{yd.cost.toLocaleString()} ETB
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                        No yarn debited for this settlement.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Committed Batch Status Card */}
          {step === "committed" && committedPreviewId && (
            <div
              className="card"
              style={{
                marginBottom: "1.5rem",
                border: isBatchPaid ? "1.5px solid var(--green)" : "1.5px solid #F59E0B",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h3 className="section-title" style={{ margin: 0 }}>
                      Batch #{committedPreviewId} Summary
                    </h3>
                    {isBatchPaid ? (
                      <span className="badge badge-green">✓ Fully Disbursed / የተከፈለ</span>
                    ) : (
                      <span className="badge badge-yellow">⏳ Unpaid — Ready for Disbursement / ክፍያ ይጠብቃል</span>
                    )}
                  </div>
                  <p style={{ margin: "0.35rem 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                    {committedWeaverCount} artisans included. Total payroll:{" "}
                    <strong>{Math.round(committedTotal).toLocaleString()} ETB</strong>.
                  </p>
                </div>

                {!isBatchPaid && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: "#059669", borderColor: "#059669" }}
                    onClick={() => setShowPayoutModal(true)}
                  >
                    💳 Disburse Batch Payment / ክፍያ ፈጽም
                  </button>
                )}
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Settlement Ref</th>
                      <th>Artisan Weaver</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Net Payable (ETB)</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.paymentId}>
                        <td>
                          <code style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                            #{p.paymentId}
                          </code>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.weaverName}</td>
                        <td>
                          {p.status === "cancelled" ? (
                            <span className="badge badge-red">Cancelled (Disputed)</span>
                          ) : isBatchPaid ? (
                            <span className="badge badge-green">✓ Disbursed</span>
                          ) : (
                            <span className="badge badge-yellow">⏳ Pending Payout</span>
                          )}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: p.status === "cancelled" ? "var(--text-muted)" : "var(--green)",
                            textDecoration: p.status === "cancelled" ? "line-through" : "none",
                          }}
                        >
                          {Math.round(p.amount).toLocaleString()} ETB
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                            <button
                              type="button"
                              className="btn-sm"
                              onClick={() => reportsApi.downloadHisabCsv(p.paymentId)}
                            >
                              CSV
                            </button>
                            <Link
                              to={`/admin/reports/hisab/${p.paymentId}`}
                              className="btn-sm primary"
                              target="_blank"
                            >
                              Statement
                            </Link>
                            {!isBatchPaid && p.status !== "cancelled" && (
                              <button
                                type="button"
                                className="btn-sm"
                                style={{ color: "#DC2626", borderColor: "#FCA5A5" }}
                                onClick={() => {
                                  setCancellingPayment(p);
                                  setCancellationReason("");
                                }}
                              >
                                ✕ Cancel (Dispute)
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: MASTER ZIGS LEDGER (ALL, ONGOING, RETURNED, RECONCILED) */}
      {activeTab === "ledger" && (
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>
                Master Work Orders (Zigs) Ledger
              </h3>
              <p style={{ margin: "0.25rem 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                Track the production lifecycle, yarn issued, fabric delivered, and payment status of all zigs.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["all", "ongoing", "returned", "reconciled"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLedgerStatus(s)}
                  className={ledgerStatus === s ? "btn-sm primary" : "btn-sm"}
                >
                  {s === "all"
                    ? "All Zigs"
                    : s === "ongoing"
                    ? "Ongoing (WIP)"
                    : s === "returned"
                    ? "Returned (Ready)"
                    : "Settled / Paid"}
                </button>
              ))}
            </div>
          </div>

          {ledgerLoading ? (
            <p className="muted">Loading zigs ledger…</p>
          ) : ledgerData.length === 0 ? (
            <p className="muted">No work orders match the selected filter.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Zig ID</th>
                    <th>Weaver</th>
                    <th>Fabric Specification</th>
                    <th>Status</th>
                    <th>Yarn (Issued / Ret / Net)</th>
                    <th>Fabric (Recv / Def / Billable)</th>
                    <th style={{ textAlign: "right" }}>Settlement Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map((zig) => (
                    <tr key={zig.zigId}>
                      <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{zig.zigId}</td>
                      <td>
                        <strong>{zig.weaverName}</strong>
                        {zig.weaverPhone && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{zig.weaverPhone}</div>
                        )}
                      </td>
                      <td>
                        <strong>{zig.fabricName}</strong> ({zig.standardWeightG}g)
                        {(zig.warpColor || zig.weftColor) && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {zig.warpColor && `Warp: ${zig.warpColor}`} · {zig.weftColor && `Weft: ${zig.weftColor}`}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            zig.status === "reconciled"
                              ? "badge-green"
                              : zig.status === "returned"
                              ? "badge-yellow"
                              : "badge-gray"
                          }`}
                        >
                          {zig.status}
                        </span>
                      </td>
                      <td>
                        <div>
                          {zig.yarn.issuedQuantity} issued / {zig.yarn.returnedQuantity} ret ={" "}
                          <strong>{zig.yarn.netQuantity} net</strong>
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          Cost: {zig.yarn.totalCost.toLocaleString()} ETB
                        </div>
                      </td>
                      <td>
                        <div>
                          {zig.fabric.receivedQuantity} recv / {zig.fabric.defectiveQuantity} def ={" "}
                          <strong>{zig.fabric.billableQuantity} pcs</strong>
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          Avg Weight: {zig.fabric.averageWeight}g
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {zig.settlement ? (
                          <div>
                            <span className="badge badge-green">Batch #{zig.settlement.batchId}</span>
                            <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>
                              {zig.settlement.amount?.toLocaleString()} ETB
                            </div>
                          </div>
                        ) : zig.status === "returned" ? (
                          <span className="badge badge-yellow">Ready to Settle</span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dispute Cancellation Modal */}
      {cancellingPayment && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div className="card" style={{ maxWidth: "440px", width: "100%", background: "#FFFFFF", borderRadius: "10px" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "16px", fontWeight: 700, color: "#DC2626" }}>
              Cancel Settlement for {cancellingPayment.weaverName}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 1rem" }}>
              This will release all fabric returns for this weaver back to the unsettled pool so a corrected settlement can be generated.
            </p>
            <form onSubmit={handleConfirmCancelSettlement}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Cancellation / Dispute Reason (Required):
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Disputed scale calibration on Zig-12; re-measuring weight."
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setCancellingPayment(null)}
                  disabled={cancelLoading}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: "#DC2626", borderColor: "#DC2626" }}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling…" : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal Dialog */}
      {showPayoutModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div className="card" style={{ maxWidth: "480px", width: "100%", background: "#FFFFFF", borderRadius: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>💳 Disburse Batch Payment / ክፍያ ፈጽም</h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {payoutError && (
              <div className="error-msg" style={{ marginBottom: "1rem" }}>
                <span>⚠️</span> {payoutError}
              </div>
            )}

            <form onSubmit={handleDisbursePayout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "8px", fontSize: "13px" }}>
                <div>
                  Batch Reference: <strong>#{committedPreviewId}</strong>
                </div>
                <div>
                  Artisans Count: <strong>{committedWeaverCount} weavers</strong>
                </div>
                <div>
                  Total Payout: <strong>{Math.round(committedTotal).toLocaleString()} ETB</strong>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Payment Method / የክፍያ ዘዴ
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                >
                  <option value="cash">Cash (ጥሬ ገንዘብ)</option>
                  <option value="bank_transfer">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="telebirr">Telebirr (ቴሌብር)</option>
                  <option value="coop_bank">Cooperative Bank (ኅብረት ሥራ ባንክ)</option>
                  <option value="check">Check (ቼክ)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Payment Notes / ማስታወሻ (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash Voucher #45"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowPayoutModal(false)}
                  disabled={payoutLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: "#059669", borderColor: "#059669" }}
                  disabled={payoutLoading}
                >
                  {payoutLoading ? "Disbursing Payment…" : "✓ Confirm Disbursement / አጽድቅ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementPage;
