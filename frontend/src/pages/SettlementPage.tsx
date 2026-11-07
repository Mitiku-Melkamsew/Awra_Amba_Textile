import { useState } from "react";
import { Link } from "react-router-dom";
import { calculationsApi, reportsApi } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";

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
      netCredit: number;
      deductionPerPiece: number;
      bonusAmount: number;
    }>;
  }>;
  weaverCount: number;
  grandTotal: number;
  amharicAmountInWords: string;
  cutoffDate?: string | null;
}

interface CommittedPayment {
  paymentId: number;
  weaverId: number;
  weaverName: string;
  amount: number;
  status?: string;
  reconciledZigIds: string[];
}

type Step = "idle" | "previewed" | "committed";

export function SettlementPage() {
  const [step, setStep] = useState<Step>("idle");
  const [cutoffDate, setCutoffDate] = useState("");
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [committedPreviewId, setCommittedPreviewId] = useState("");
  const [committedTotal, setCommittedTotal] = useState(0);
  const [committedWeaverCount, setCommittedWeaverCount] = useState(0);
  const [isBatchPaid, setIsBatchPaid] = useState(false);
  const [payments, setPayments] = useState<CommittedPayment[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("cash");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  async function handlePreview() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const p = await calculationsApi.batchPreview({
        cutoffDate: cutoffDate || undefined,
      });
      setPreview(p);
      setStep("previewed");
      setMessage(
        "Master payroll generated successfully. Review the calculations below before committing the batch.",
      );
    } catch (err) {
      setPreview(null);
      setError(
        err instanceof Error ? err.message : "Preview generation failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!preview?.previewId || preview.weaverCount === 0) return;
    if (
      !confirm(
        `Confirm and commit batch settlement for ${preview.weaverCount} weavers totaling ${Math.round(preview.grandTotal).toLocaleString()} ETB under batch #${preview.previewId}? (You can record cash payout now or later).`,
      )
    )
      return;

    setLoading(true);
    setError("");
    const currentPreviewId = preview.previewId;
    try {
      const result = await calculationsApi.batchCommit(currentPreviewId);
      setPayments(result.payments);
      setCommittedPreviewId(currentPreviewId);
      setCommittedTotal(result.grandTotal);
      setCommittedWeaverCount(result.weaverCount);
      setIsBatchPaid(result.amountPaid >= result.grandTotal - 0.01 && result.grandTotal > 0);
      setStep("committed");
      setMessage(
        `Batch #${currentPreviewId} committed successfully for ${result.weaverCount} weavers (${Math.round(result.grandTotal).toLocaleString()} ETB). Ready for cash payout disbursement.`,
      );
      setPreview(null);
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

      // Refresh batch payment status
      if (payoutRes.payments) {
        setPayments((prev) =>
          prev.map((p, idx) => ({
            ...p,
            paymentId: payoutRes.payments[idx]?.settlementPaymentId ?? p.paymentId,
            status: "paid",
          })),
        );
      }
    } catch (err: any) {
      setPayoutError(err.message || "Failed to disburse batch payment");
    } finally {
      setPayoutLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Payroll & Settlement</p>
          <h1 className="page-title">Weaver Payroll & Batch Settlement</h1>
          <p className="page-subtitle">
            Consolidate returned fabric, apply standardized quality deductions, commit batches, and disburse official HISAB payrolls.
          </p>
        </div>
        <Link to="/admin/settlement/history" className="btn-ghost">
          <span>📜</span> Settlement History / ታሪክ
        </Link>
      </div>

      {/* Stepper */}
      <div className="settlement-steps">
        <div className={`step-item ${step === "idle" ? "active" : "done"}`}>
          <span className="step-number">{step === "idle" ? "1" : "✓"}</span>
          <span className="step-label">1. Set Cutoff & Generate</span>
        </div>
        <div className="step-divider" />
        <div
          className={`step-item ${step === "previewed" ? "active" : step === "committed" ? "done" : ""}`}
        >
          <span className="step-number">
            {step === "committed" ? "✓" : "2"}
          </span>
          <span className="step-label">2. Review Master Payroll</span>
        </div>
        <div className="step-divider" />
        <div
          className={`step-item ${step === "committed" ? "done active" : ""}`}
        >
          <span className="step-number">
            {step === "committed" ? "✓" : "3"}
          </span>
          <span className="step-label">3. Commit & Disburse Payment</span>
        </div>
      </div>

      {/* Control Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 280px" }}>
            <label style={{ display: "block", marginBottom: "0.35rem" }}>
              <span>Cutoff Date (የማጣሪያ ቀን)</span>
              <span
                style={{
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  fontSize: "11.5px",
                }}
              >
                {" "}
                — optional
              </span>
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
              disabled={loading || step === "committed"}
              style={{ width: "100%", height: "42px" }}
            />
            <span
              style={{
                display: "block",
                fontSize: "11.5px",
                color: "var(--text-muted)",
                marginTop: "0.35rem",
              }}
            >
              Only work orders returned on or before this date will be included. Leave empty for all pending.
            </span>
          </div>

          <div
            className="button-row"
            style={{ flex: "2 1 auto", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              className="btn-primary"
              onClick={handlePreview}
              disabled={loading || step === "committed"}
            >
              {loading && step === "idle"
                ? "Generating Master Payroll…"
                : "1. Generate Preview / አዘጋጅ"}
            </button>

            {preview && (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() =>
                    calculationsApi.downloadPreviewCsv(preview.previewId)
                  }
                >
                  ⬇ Download Master CSV
                </button>
                <Link
                  to={`/admin/settlement/preview/${preview.previewId}`}
                  className="btn-ghost"
                  target="_blank"
                >
                  🖨 Open Master Document
                </Link>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCommit}
                  disabled={
                    loading ||
                    preview.weavers.some((weaver) => weaver.isBlocked)
                  }
                >
                  {loading && step === "previewed"
                    ? "Committing Batch…"
                    : "2. Confirm & Commit Batch / አጽድቅ"}
                </button>
              </>
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
                  Start Next Payroll
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() =>
                    reportsApi.downloadBatchHisabCsv(committedPreviewId)
                  }
                >
                  ⬇ Download Final Master CSV
                </button>
                <Link
                  to={`/admin/settlement/preview/${committedPreviewId}`}
                  className="btn-ghost"
                  target="_blank"
                >
                  🖨 Open Master Document
                </Link>
              </>
            )}
          </div>
        </div>

        {message && (
          <div className="success-msg" style={{ marginTop: "1rem" }}>
            <span>✅</span> {message}
          </div>
        )}
        {error && (
          <div className="error-msg" style={{ marginTop: "1rem" }}>
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      {/* Preview Summary & Table */}
      {preview && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1.25rem",
              paddingBottom: "1rem",
              borderBottom: "1.5px solid var(--border)",
            }}
          >
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h3
                  className="section-title"
                  style={{ margin: 0, fontSize: "18px" }}
                >
                  Payroll Master Preview
                </h3>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    background: "var(--bg-subtle)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  #{preview.previewId}
                </span>
                {preview.cutoffDate && (
                  <span className="badge badge-gray">
                    Cutoff: {formatDateDDMMYY(preview.cutoffDate)}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                Total Artisans: <strong>{preview.weaverCount}</strong> | Grand
                Payout:{" "}
                <strong style={{ color: "var(--accent)" }}>
                  {Math.round(preview.grandTotal).toLocaleString()} ETB
                </strong>
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Weaver</th>
                  <th>Work Orders (ዝግ)</th>
                  <th style={{ textAlign: "right" }}>Returns</th>
                  <th style={{ textAlign: "right" }}>Yarn Deductions</th>
                  <th style={{ textAlign: "right" }}>Net Payable (ETB)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.weavers.map((w) => (
                  <tr key={w.weaverId}>
                    <td style={{ fontWeight: 600 }}>{w.weaverName}</td>
                    <td>{w.zigIds.join(", ")}</td>
                    <td style={{ textAlign: "right" }}>{w.returnCount} pcs</td>
                    <td style={{ textAlign: "right" }}>{w.yarnCount} units</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "var(--green)",
                      }}
                    >
                      {Math.round(w.netSettlement).toLocaleString()} ETB
                    </td>
                    <td>
                      {w.isBlocked ? (
                        <span className="badge badge-red">Blocked</span>
                      ) : (
                        <span className="badge badge-green">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Committed Batch Status Card */}
      {step === "committed" && committedPreviewId && (
        <div className="card" style={{ marginBottom: "1.5rem", border: isBatchPaid ? "1.5px solid var(--green)" : "1.5px solid #F59E0B" }}>
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
                {committedWeaverCount} artisans included. Total payroll: <strong>{Math.round(committedTotal).toLocaleString()} ETB</strong>.
              </p>
            </div>

            {!isBatchPaid && (
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#059669", borderColor: "#059669", padding: "0.6rem 1.25rem", fontSize: "14px", fontWeight: 700 }}
                onClick={() => setShowPayoutModal(true)}
              >
                💳 Disburse Payment Now / ክፍያ ፈጽም
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
                      {isBatchPaid ? (
                        <span className="badge badge-green">✓ Disbursed</span>
                      ) : (
                        <span className="badge badge-yellow">⏳ Pending Payout</span>
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: isBatchPaid ? "var(--green)" : "var(--text)",
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
                          Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal Dialog */}
      {showPayoutModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: "480px", width: "100%", background: "#FFFFFF", borderRadius: "12px", boxShadow: "var(--shadow-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
                💳 Disburse Batch Payment / ክፍያ ፈጽም
              </h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {payoutError && <div className="error-msg" style={{ marginBottom: "1rem" }}><span>⚠️</span> {payoutError}</div>}

            <form onSubmit={handleDisbursePayout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "8px", fontSize: "13px" }}>
                <div>Batch Reference: <strong>#{committedPreviewId}</strong></div>
                <div>Artisans Count: <strong>{committedWeaverCount} weavers</strong></div>
                <div>Total Payout: <strong>{Math.round(committedTotal).toLocaleString()} ETB</strong></div>
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
                  placeholder="e.g. CBE Batch Ref or Cash Payroll Voucher #12"
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
