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
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [payments, setPayments] = useState<CommittedPayment[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const p = await calculationsApi.batchPreview();
      setPreview(p);
      setStep("previewed");
      setMessage("Preview ready. Share with weavers before recording.");
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
        `Record settlements for ${preview.weaverCount} weavers using preview ${preview.previewId}?`,
      )
    ) return;

    setLoading(true);
    setError("");
    try {
      const result = await calculationsApi.batchCommit(preview.previewId, "Recorded");
      setPayments(result.payments);
      setStep("committed");
      setMessage(
        `Recorded ${result.weaverCount} payments. Grand total: ${result.grandTotal} ETB`,
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
          <h1 className="page-title">Settle All Returned Zigs</h1>
          <p className="page-subtitle">Generate, review, then record settlements for all outstanding returns.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="settlement-steps">
        <div className={`step-item ${step === "idle" ? "active" : "done"}`}>
          <span className="step-number">{step === "idle" ? "1" : "✓"}</span>
          <span className="step-label">Generate Preview</span>
        </div>
        <div className="step-divider" />
        <div className={`step-item ${step === "previewed" ? "active" : step === "committed" ? "done" : ""}`}>
          <span className="step-number">{step === "committed" ? "✓" : "2"}</span>
          <span className="step-label">Review & Share</span>
        </div>
        <div className="step-divider" />
        <div className={`step-item ${step === "committed" ? "done" : ""}`}>
          <span className="step-number">{step === "committed" ? "✓" : "3"}</span>
          <span className="step-label">Record Settlements</span>
        </div>
      </div>

      {/* Actions card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 0, marginBottom: "0.875rem" }}>
          Step 1: Generate preview and save reference ID · Step 2: Download CSV or open print PDF for weaver review · Step 3: Record only after weavers confirm.
        </p>
        <div className="button-row">
          <button
            type="button"
            className="btn-primary"
            onClick={handlePreview}
            disabled={loading || step === "committed"}
          >
            {loading && step === "idle" ? "Generating…" : "1. Generate Preview"}
          </button>

          {preview && (
            <>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => calculationsApi.downloadPreviewCsv(preview.previewId)}
              >
                ⬇ Download CSV
              </button>
              <Link
                to={`/admin/settlement/preview/${preview.previewId}`}
                className="btn-ghost"
                target="_blank"
              >
                🖨 Open Print / PDF
              </Link>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCommit}
                disabled={loading}
              >
                {loading && step === "previewed" ? "Recording…" : "2. Confirm & Record"}
              </button>
            </>
          )}
        </div>

        {message && <div className="success-msg" style={{ marginTop: "0.875rem" }}><span>✅</span> {message}</div>}
        {error && <div className="error-msg" style={{ marginTop: "0.875rem" }}><span>⚠️</span> {error}</div>}
      </div>

      {/* Preview detail */}
      {preview && (
        <div className="card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
            <div>
              <p className="section-title">
                Preview
                <code style={{ fontSize: 11.5, background: "var(--bg)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>
                  {preview.previewId}
                </code>
              </p>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>{preview.amharicAmountInWords}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="net-amount">{preview.grandTotal} ETB</div>
              <div className="muted" style={{ fontSize: 12 }}>{preview.weaverCount} weavers</div>
            </div>
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>
            {preview.weavers.map((weaver) => (
              <div key={weaver.weaverId} className="settlement-weaver-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p className="settlement-weaver-name">{weaver.weaverName}</p>
                  <span className="settlement-net">{weaver.netSettlement} ETB</span>
                </div>
                <p className="settlement-weaver-meta">
                  Zigs: {weaver.zigIds.join(", ")} · Returns: {weaver.returnCount} · Yarn: {weaver.yarnCount}
                </p>
                <table style={{ marginTop: "0.5rem" }}>
                  <thead>
                    <tr>
                      <th>Return #</th>
                      <th>Zig</th>
                      <th style={{ textAlign: "right" }}>Deduction</th>
                      <th style={{ textAlign: "right" }}>Bonus</th>
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
                        <td style={{ textAlign: "right", color: line.bonusAmount > 0 ? "var(--green)" : undefined }}>
                          {line.bonusAmount > 0 ? `+${line.bonusAmount}` : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{line.netCredit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Committed payments */}
      {payments.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p className="section-title">
            Generated Payments
            <span className="count">{payments.length}</span>
            <span className="muted" style={{ fontSize: 12, marginLeft: "0.5rem" }}>
              {formatDateDDMMYY(new Date())}
            </span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {payments.map((p) => (
              <div key={p.paymentId} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.625rem", background: "var(--bg)", borderRadius: "var(--radius-sm)",
                gap: "1rem", flexWrap: "wrap"
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.weaverName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {p.amount} ETB · Zigs: {p.reconciledZigIds.join(", ")}
                  </div>
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => reportsApi.downloadHisabCsv(p.paymentId)}
                  >
                    ⬇ CSV
                  </button>
                  <Link to={`/admin/reports/hisab/${p.paymentId}`} className="btn-sm primary">
                    🖨 HISAB
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