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
      setMessage("Master payroll generated successfully. Review the calculations below before recording.");
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Preview generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!preview?.previewId || preview.weaverCount === 0) return;
    if (
      !confirm(
        `Confirm and record settlements for ${preview.weaverCount} weavers totaling ${Math.round(preview.grandTotal).toLocaleString()} ETB under preview ${preview.previewId}?`,
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
        `Successfully recorded payments for ${result.weaverCount} weavers. Grand total: ${Math.round(result.grandTotal).toLocaleString()} ETB.`,
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
          <p className="eyebrow">ሂሳብ / Payroll & Settlement</p>
          <h1 className="page-title">Weaver Payroll & Batch Settlement</h1>
          <p className="page-subtitle">
            Consolidate returned fabric, apply standardized quality deductions, and issue official HISAB payrolls.
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
        <div className={`step-item ${step === "previewed" ? "active" : step === "committed" ? "done" : ""}`}>
          <span className="step-number">{step === "committed" ? "✓" : "2"}</span>
          <span className="step-label">2. Review Master Payroll</span>
        </div>
        <div className="step-divider" />
        <div className={`step-item ${step === "committed" ? "done active" : ""}`}>
          <span className="step-number">{step === "committed" ? "✓" : "3"}</span>
          <span className="step-label">3. Confirm & Official Report</span>
        </div>
      </div>

      {/* Control Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px" }}>
            <label style={{ display: "block", marginBottom: "0.35rem" }}>
              <span>Cutoff Date (የማጣሪያ ቀን)</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "11.5px" }}> — optional</span>
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
              disabled={loading || step === "committed"}
              style={{ width: "100%", height: "42px" }}
            />
            <span style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginTop: "0.35rem" }}>
              Only work orders returned on or before this date will be included. Leave empty for all pending.
            </span>
          </div>

          <div className="button-row" style={{ flex: "2 1 auto", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handlePreview}
              disabled={loading || step === "committed"}
            >
              {loading && step === "idle" ? "Generating Master Payroll…" : "1. Generate Preview / አዘጋጅ"}
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
                  {loading && step === "previewed" ? "Recording…" : "2. Confirm & Record Payroll / አጽድቅ"}
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

        {message && <div className="success-msg" style={{ marginTop: "1rem" }}><span>✅</span> {message}</div>}
        {error && <div className="error-msg" style={{ marginTop: "1rem" }}><span>⚠️</span> {error}</div>}
      </div>

      {/* Preview Summary & Table */}
      {preview && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1.5px solid var(--border)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 className="section-title" style={{ margin: 0, fontSize: "18px" }}>
                  Payroll Master Preview
                </h3>
                <span style={{ fontFamily: "monospace", fontWeight: 700, background: "var(--bg-subtle)", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "12px" }}>
                  {preview.previewId}
                </span>
                {preview.cutoffDate && (
                  <span className="badge badge-gray">Cutoff: {formatDateDDMMYY(preview.cutoffDate)}</span>
                )}
              </div>
              <p style={{ margin: "0.4rem 0 0", fontSize: "14px", fontWeight: 600, color: "var(--accent)" }}>
                {preview.amharicAmountInWords}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="net-amount">{Math.round(preview.grandTotal).toLocaleString()} ETB</div>
              <span className="badge badge-green" style={{ marginTop: "4px" }}>
                {preview.weaverCount} Artisans Covered
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {preview.weavers.map((weaver) => (
              <div key={weaver.weaverId} className="settlement-weaver-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span className="settlement-weaver-name">{weaver.weaverName}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>(#{weaver.weaverId})</span>
                  </div>
                  <span className="settlement-net">{Math.round(weaver.netSettlement).toLocaleString()} ETB</span>
                </div>
                <p className="settlement-weaver-meta">
                  Linked Zigs: <strong>{weaver.zigIds.join(", ")}</strong> &middot; Fabric Returns: <strong>{weaver.returnCount}</strong> &middot; Yarn Records: <strong>{weaver.yarnCount}</strong>
                </p>
                <div className="table-wrap" style={{ margin: "0.5rem 0 0" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Return #</th>
                        <th>Zig ID</th>
                        <th style={{ textAlign: "right" }}>Quality Deduction</th>
                        <th style={{ textAlign: "right" }}>Net Credit (ETB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weaver.lineItems.map((line) => (
                        <tr key={line.returnId}>
                          <td style={{ fontFamily: "monospace" }}>#{line.returnId}</td>
                          <td style={{ fontWeight: 600 }}>{line.zigId}</td>
                          <td style={{ textAlign: "right", color: line.deductionPerPiece > 0 ? "var(--red)" : "var(--text-muted)" }}>
                            {line.deductionPerPiece > 0 ? `-${line.deductionPerPiece} ETB/pc` : "—"}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green)" }}>
                            {Math.round(line.netCredit).toLocaleString()} ETB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Committed Payments list */}
      {payments.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              <span>✅</span> Committed Payments
              <span className="count">{payments.length}</span>
            </h3>
            {committedPreviewId && (
              <div className="button-row">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => reportsApi.downloadBatchHisabCsv(committedPreviewId)}
                >
                  ⬇ Master CSV
                </button>
                <Link
                  to={`/admin/settlement/preview/${committedPreviewId}`}
                  className="btn-ghost btn-sm"
                  target="_blank"
                >
                  🖨 Master Document
                </Link>
              </div>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Artisan Weaver</th>
                  <th>Reconciled Zigs</th>
                  <th style={{ textAlign: "right" }}>Amount (ETB)</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.paymentId}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                      #{p.paymentId}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.weaverName}</td>
                    <td>{p.reconciledZigIds.join(", ")}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green)" }}>
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
    </div>
  );
}

export default SettlementPage;
