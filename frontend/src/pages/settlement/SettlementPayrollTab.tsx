import { Link } from "react-router-dom";
import { reportsApi } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";
import { WeaverBreakdownRow } from "./WeaverBreakdownRow";
import type { BatchPreview, CommittedPayment, Step } from "./useSettlementManager";

export interface SettlementPayrollTabProps {
  step: Step;
  cutoffDate: string;
  setCutoffDate: (val: string) => void;
  exceptionZigIds: string[];
  setExceptionZigIds: (ids: string[]) => void;
  preview: BatchPreview | null;
  loading: boolean;
  committedPreviewId: string;
  committedTotal: number;
  committedWeaverCount: number;
  isBatchPaid: boolean;
  payments: CommittedPayment[];
  expandedWeaverId: number | null;
  setExpandedWeaverId: (id: number | null) => void;
  handlePreview: () => Promise<void>;
  toggleExceptionZig: (zigId: string) => void;
  handleCommit: () => Promise<void>;
  onOpenPayoutModal: () => void;
  onOpenCancelModal: (payment: CommittedPayment) => void;
  resetBatch: () => void;
}

export function SettlementPayrollTab({
  step,
  cutoffDate,
  setCutoffDate,
  exceptionZigIds,
  setExceptionZigIds,
  preview,
  loading,
  committedPreviewId,
  committedTotal,
  committedWeaverCount,
  isBatchPaid,
  payments,
  expandedWeaverId,
  setExpandedWeaverId,
  handlePreview,
  toggleExceptionZig,
  handleCommit,
  onOpenPayoutModal,
  onOpenCancelModal,
  resetBatch,
}: SettlementPayrollTabProps) {
  return (
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
            <label className="form-label" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>
              <span>Cutoff Date (የማጣሪያ ቀን)</span>
              <span style={{ fontWeight: 400, color: "var(--color-text-muted, #64748b)", fontSize: "11.5px" }}> — optional</span>
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => {
                setCutoffDate(e.target.value);
                setExceptionZigIds([]);
              }}
              disabled={loading || step === "committed"}
              className="input"
              style={{ width: "100%", height: "42px" }}
            />
            <span style={{ display: "block", fontSize: "11.5px", color: "var(--color-text-muted, #64748b)", marginTop: "0.35rem" }}>
              Only zigs returned on or before this date are included. If cash is limited, choose an earlier cutoff.
            </span>
          </div>

          <div className="button-row" style={{ flex: "2 1 auto", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handlePreview()}
              disabled={loading || step === "committed"}
            >
              {loading && step === "idle" ? "Calculating Preview…" : "1. Preview Payroll / አዘጋጅ"}
            </button>

            {preview && (
              <button
                type="button"
                className="btn btn-primary"
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
                    className="btn btn-primary"
                    style={{ background: "#059669", borderColor: "#059669" }}
                    onClick={onOpenPayoutModal}
                  >
                    💳 Disburse Batch Payment / ክፍያ ፈጽም
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetBatch}
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
              background: "var(--color-amber-50, #FFFBEB)",
              border: "1px solid var(--color-amber-200, #FDE68A)",
              borderRadius: "var(--radius-sm, 8px)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-amber-800, #92400E)", marginBottom: "0.5rem" }}>
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
                    background: "var(--color-surface, #FFFFFF)",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-amber-300, #FCD34D)",
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
              borderBottom: "1.5px solid var(--color-border-subtle, #e2e8f0)",
            }}
          >
            <div>
              <h3 className="section-title" style={{ margin: 0, fontSize: "18px" }}>
                Master Payroll Preview (In-Memory)
              </h3>
              <p style={{ margin: "0.25rem 0 0", fontSize: "13px", color: "var(--color-text-muted, #64748b)" }}>
                Total Artisans: <strong>{preview.weaverCount}</strong> | Grand Payout:{" "}
                <strong style={{ color: "var(--color-primary, #c2410c)" }}>
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
                {preview.weavers.map((w: any) => (
                  <WeaverBreakdownRow
                    key={w.userId}
                    weaver={w}
                    isExpanded={expandedWeaverId === w.userId}
                    onToggleExpand={() =>
                      setExpandedWeaverId(expandedWeaverId === w.userId ? null : w.userId)
                    }
                  />
                ))}
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
            border: isBatchPaid
              ? "1.5px solid var(--color-success, #16a34a)"
              : "1.5px solid var(--color-amber-400, #F59E0B)",
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
              borderBottom: "1px solid var(--color-border-subtle, #e2e8f0)",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h3 className="section-title" style={{ margin: 0 }}>
                  Batch #{committedPreviewId} Summary
                </h3>
                {isBatchPaid ? (
                  <span className="badge badge-success">✓ Fully Disbursed / የተከፈለ</span>
                ) : (
                  <span className="badge badge-warning">⏳ Unpaid — Ready for Disbursement / ክፍያ ይጠብቃል</span>
                )}
              </div>
              <p style={{ margin: "0.35rem 0 0", fontSize: "13px", color: "var(--color-text-muted, #64748b)" }}>
                {committedWeaverCount} artisans included. Total payroll:{" "}
                <strong>{Math.round(committedTotal).toLocaleString()} ETB</strong>.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {committedPreviewId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => reportsApi.downloadBatchHisabCsv(committedPreviewId)}
                >
                  ⬇ Batch CSV
                </button>
              )}
              {!isBatchPaid && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: "#059669", borderColor: "#059669" }}
                  onClick={onOpenPayoutModal}
                >
                  💳 Disburse Batch Payment / ክፍያ ፈጽም
                </button>
              )}
            </div>
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
                {payments.map((p) => {
                  const isPaid = isBatchPaid || p.status === "PAID" || p.status === "paid";
                  const id = p.settlementId;
                  return (
                    <tr key={p.settlementId}>
                      <td>
                        <code style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary, #c2410c)" }}>
                          #{id}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.weaverName}</td>
                      <td>
                        {p.status === "cancelled" ? (
                          <span className="badge badge-danger">Cancelled (Disputed)</span>
                        ) : isPaid ? (
                          <span className="badge badge-success">✓ Disbursed</span>
                        ) : (
                          <span className="badge badge-warning">⏳ Pending Payout</span>
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: p.status === "cancelled" ? "var(--color-text-muted, #64748b)" : "var(--color-success, #16a34a)",
                          textDecoration: p.status === "cancelled" ? "line-through" : "none",
                        }}
                      >
                        {Math.round(p.amount).toLocaleString()} ETB
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "12px" }}
                            onClick={() => reportsApi.downloadHisabCsv(id, "settlement")}
                          >
                            CSV
                          </button>
                          <Link
                            to={`/admin/reports/hisab/settlement/${id}`}
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "12px", textDecoration: "none" }}
                            target="_blank"
                          >
                            Statement
                          </Link>
                          {!isPaid && p.status !== "cancelled" && (
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "12px" }}
                              onClick={() => onOpenCancelModal(p)}
                            >
                              ✕ Cancel (Dispute)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
