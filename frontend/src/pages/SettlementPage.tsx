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
  reconciledZigIds: string[];
}

type Step = "idle" | "previewed" | "committed";

export function SettlementPage() {
  const [step, setStep] = useState<Step>("idle");
  const [cutoffDate, setCutoffDate] = useState("");
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [committedPreviewId, setCommittedPreviewId] = useState("");
  const [payments, setPayments] = useState<CommittedPayment[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMessage("Preview ready. Review the consolidated payroll document below before recording.");
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!preview?.previewId || preview.weaverCount === 0) return;
    if (
      !confirm(
        `Record settlements for ${preview.weaverCount} weavers totaling ${Math.round(preview.grandTotal)} ETB using preview ${preview.previewId}?`,
      )
    ) return;

    setLoading(true);
    setError("");
    const currentPreviewId = preview.previewId;
    try {
      const result = await calculationsApi.batchCommit(
        currentPreviewId,
        "Recorded",
        cutoffDate || undefined,
      );
      setPayments(result.payments);
      setCommittedPreviewId(currentPreviewId);
      setStep("committed");
      setMessage(
        `Successfully recorded ${result.weaverCount} payments. Grand total: ${Math.round(result.grandTotal)} ETB`,
      );
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Settlement</p>
          <h1 className="page-title">Weaver Payroll & Settlement</h1>
          <p className="page-subtitle">Generate, review, and record the master payroll for all returned zigs.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="settlement-steps">
        <div className={`step-item ${step === "idle" ? "active" : "done"}`}>
          <span className="step-number">{step === "idle" ? "1" : "✓"}</span>
          <span className="step-label">Generate Payroll</span>
        </div>
        <div className="step-divider" />
        <div className={`step-item ${step === "previewed" ? "active" : step === "committed" ? "done" : ""}`}>
          <span className="step-number">{step === "committed" ? "✓" : "2"}</span>
          <span className="step-label">Review Master Document</span>
        </div>
        <div className="step-divider" />
        <div className={`step-item ${step === "committed" ? "done" : ""}`}>
          <span className="step-number">{step === "committed" ? "✓" : "3"}</span>
          <span className="step-label">Record & Final Report</span>
        </div>
      </div>

      {/* Control Card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "0.875rem" }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: "0.3rem" }}>
              Cutoff Date (የማጣሪያ ቀን) <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>— optional</span>
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
              disabled={loading || step === "committed"}
              style={{ minHeight: 38, padding: "0.4rem 0.6rem", fontSize: 13.5 }}
            />
            <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Only zigs returned on or before this date are included. Leave empty for all completed zigs.
            </span>
          </div>

          <div className="button-row" style={{ alignItems: "center" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handlePreview}
              disabled={loading || step === "committed"}
            >
              {loading && step === "idle" ? "Generating Payroll…" : "1. Generate Preview"}
            </button>

            {preview && (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => calculationsApi.downloadPreviewCsv(preview.previewId)}
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
                  disabled={loading}
                >
                  {loading && step === "previewed" ? "Recording…" : "2. Confirm & Record Payroll"}
                </button>
              </>
            )}

            {step === "committed" && committedPreviewId && (
              <>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => reportsApi.downloadBatchHisabCsv(committedPreviewId)}
                >
                  ⬇ Download Final Master CSV
                </button>
                <Link
                  to={`/admin/settlement/preview/${committedPreviewId}`}
                  className="btn-ghost"
                  target="_blank"
                >
                  🖨 Open Final Master Report
                </Link>
              </>
            )}
          </div>
        </div>

        {message && <div className="success-msg" style={{ marginTop: "0.875rem" }}><span>✅</span> {message}</div>}
        {error && <div className="error-msg" style={{ marginTop: "0.875rem" }}><span>⚠️</span> {error}</div>}
      </div>

      {/* Preview Summary & Table */}
      {preview && (
        <div className="card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
            <div>
              <p className="section-title">
                Payroll Preview
                <code style={{ fontSize: 11.5, background: "var(--bg)", padding: "0.1rem 0.4rem", borderRadius: 4, marginLeft: "0.5rem" }}>
                  {preview.previewId}
                </code>
                {preview.cutoffDate && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                    · Cutoff: {formatDateDDMMYY(preview.cutoffDate)}
                  </span>
                )}
              </p>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>{preview.amharicAmountInWords}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="net-amount">{Math.round(preview.grandTotal)} ETB</div>
              <div className="muted" style={{ fontSize: 12 }}>{preview.weaverCount} weavers covered</div>
            </div>
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>
            {preview.weavers.map((weaver) => (
              <div key={weaver.weaverId} className="settlement-weaver-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p className="settlement-weaver-name">{weaver.weaverName}</p>
                  <span className="settlement-net">{Math.round(weaver.netSettlement)} ETB</span>
                </div>
                <p className="settlement-weaver-meta">
                  Zigs: {weaver.zigIds.join(", ")} &middot; Returns: {weaver.returnCount} &middot; Yarn records: {weaver.yarnCount}
                </p>
                <table style={{ marginTop: "0.5rem" }}>
                  <thead>
                    <tr>
                      <th>Return #</th>
                      <th>Zig</th>
                      <th style={{ textAlign: "right" }}>Deduction</th>
                      <th style={{ textAlign: "right" }}>Net Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weaver.lineItems.map((line) => (
                      <tr key={line.returnId}>
                        <td>{line.returnId}</td>
                        <td>{line.zigId}</td>
                        <td style={{ textAlign: "right", color: line.deductionPerPiece > 0 ? "var(--red)" : undefined }}>
                          {line.deductionPerPiece > 0 ? `-${line.deductionPerPiece}` : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{Math.round(line.netCredit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Committed Payments list */}
      {payments.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
            <p className="section-title" style={{ margin: 0 }}>
              Committed Payments
              <span className="count">{payments.length}</span>
              <span className="muted" style={{ fontSize: 12, marginLeft: "0.5rem" }}>
                {formatDateDDMMYY(new Date())}
              </span>
            </p>
            {committedPreviewId && (
              <div className="button-row">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => reportsApi.downloadBatchHisabCsv(committedPreviewId)}
                >
                  ⬇ Master CSV
                </button>
                <Link to={`/admin/settlement/preview/${committedPreviewId}`} className="btn-ghost" target="_blank">
                  🖨 Master Document
                </Link>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "350px", overflowY: "auto" }}>
            {payments.map((p) => (
              <div key={p.paymentId} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.5rem 0.75rem", background: "var(--bg)", borderRadius: "var(--radius-sm)",
                gap: "1rem", flexWrap: "wrap", fontSize: 13
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.weaverName}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "0.75rem" }}>
                    Zigs: {p.reconciledZigIds.join(", ")}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 600 }}>{Math.round(p.amount)} ETB</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: "0.2rem 0.5rem" }}
                    onClick={() => reportsApi.downloadHisabCsv(p.paymentId)}
                  >
                    CSV
                  </button>
                  <Link to={`/admin/reports/hisab/${p.paymentId}`} className="btn-ghost" style={{ fontSize: 12, padding: "0.2rem 0.5rem" }} target="_blank">
                    Receipt
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}