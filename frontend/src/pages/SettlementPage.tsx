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

export function SettlementPage() {
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
      setPreview(await calculationsApi.batchPreview());
      setMessage(
        "Preview saved. Download CSV or open print view to confirm with weavers before recording.",
      );
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
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await calculationsApi.batchCommit(preview.previewId, "Recorded");
      setPayments(result.payments);
      setMessage(
        `Recorded ${result.weaverCount} payments from ${preview.previewId}. Grand total: ${result.grandTotal} ETB`,
      );
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Settlement</p>
          <h2>Settle All Returned Zigs</h2>
          <p className="muted">
            Step 1: Generate preview and share with weavers. Step 2: After confirmation, record
            settlements (linked to preview and transactions).
          </p>
        </div>
      </header>

      <div className="card form">
        <ol className="muted" style={{ marginBottom: "1rem", paddingLeft: "1.25rem" }}>
          <li>Generate preview — saves reference ID</li>
          <li>Download CSV or print PDF for weaver review</li>
          <li>Record settlements only after weavers confirm</li>
        </ol>
        <div className="button-row">
          <button type="button" className="btn-primary" onClick={handlePreview} disabled={loading}>
            {loading ? "Loading..." : "1. Generate Preview"}
          </button>
          {preview && (
            <>
              <button
                type="button"
                onClick={() => calculationsApi.downloadPreviewCsv(preview.previewId)}
              >
                Download CSV
              </button>
              <Link
                to={`/admin/settlement/preview/${preview.previewId}`}
                className="btn-secondary"
                target="_blank"
              >
                Open Print / PDF
              </Link>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCommit}
                disabled={loading}
              >
                2. Confirm & Record Settlements
              </button>
            </>
          )}
        </div>
      </div>

      {preview && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>
            Preview {preview.previewId} — {preview.weaverCount} weavers · {preview.grandTotal}{" "}
            ETB
          </h3>
          <p className="muted">{preview.amharicAmountInWords}</p>
          <p className="muted">
            Reference this ID when recording: <strong>{preview.previewId}</strong>
          </p>
          {preview.weavers.map((weaver) => (
            <div key={weaver.weaverId} className="settlement-weaver-block">
              <h4>
                {weaver.weaverName} — {weaver.netSettlement} ETB
              </h4>
              <p className="muted">
                Zigs: {weaver.zigIds.join(", ")} · Returns: {weaver.returnCount} · Yarn:{" "}
                {weaver.yarnCount}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Return</th>
                    <th>Zig</th>
                    <th>Deduction</th>
                    <th>Bonus</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {weaver.lineItems.map((line) => (
                    <tr key={line.returnId}>
                      <td>{line.returnId}</td>
                      <td>{line.zigId}</td>
                      <td>{line.deductionPerPiece}</td>
                      <td>{line.bonusAmount}</td>
                      <td>{line.netCredit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {payments.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Generated Payments ({formatDateDDMMYY(new Date())})</h3>
          <ul className="record-list">
            {payments.map((p) => (
              <li key={p.paymentId}>
                <strong>
                  {p.weaverName} — {p.amount} ETB (Payment #{p.paymentId})
                </strong>
                <span>Zigs: {p.reconciledZigIds.join(", ")}</span>
                <div className="button-row" style={{ marginTop: "0.5rem" }}>
                  <button type="button" onClick={() => reportsApi.downloadHisabCsv(p.paymentId)}>
                    Download CSV
                  </button>
                  <Link to={`/admin/reports/hisab/${p.paymentId}`} className="btn-sm">
                    Print HISAB
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}