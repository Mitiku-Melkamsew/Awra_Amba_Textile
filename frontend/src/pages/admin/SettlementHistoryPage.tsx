import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { calculationsApi, reportsApi } from "../../api";
import type { CommittedSettlementSummary } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

export function SettlementHistoryPage() {
  const [rows, setRows] = useState<CommittedSettlementSummary[] | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Payout Modal State
  const [payingBatch, setPayingBatch] = useState<CommittedSettlementSummary | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("cash");
  const [payoutNotes, setPayoutNotes] = useState<string>("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  function loadHistory() {
    calculationsApi
      .settlementHistory()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load history"));
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function handleOpenPayoutModal(batch: CommittedSettlementSummary) {
    setPayingBatch(batch);
    const balance = batch.balance !== undefined ? batch.balance : Math.max(0, batch.grandTotal - batch.paidTotal);
    setPayoutAmount(String(balance > 0 ? balance : batch.grandTotal));
    setPayoutMethod(batch.paymentMethod || "cash");
    setPayoutNotes("");
    setPayoutError("");
  }

  async function handleConfirmPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!payingBatch) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayoutError("Please enter a valid positive payment amount.");
      return;
    }

    setIsSubmittingPayout(true);
    setPayoutError("");
    try {
      await calculationsApi.payBatch(payingBatch.previewId, {
        amount,
        paymentMethod: payoutMethod,
        notes: payoutNotes || undefined,
      });

      setSuccessMsg(`Successfully disbursed payment of ${amount.toLocaleString()} ETB for Batch #${payingBatch.previewId}!`);
      setPayingBatch(null);
      loadHistory();
    } catch (err: any) {
      setPayoutError(err.message || "Failed to disburse batch payment");
    } finally {
      setIsSubmittingPayout(false);
    }
  }

  return (
    <div className="page">
      <Link to="/admin/settlement" className="back-link">
        ← Back to Settlement / ወደ ሂሳብ ማጠቃለያ
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">ሂሳብ / Past Settlements</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Settlement History</h1>
            {rows && <span className="badge badge-gray">{rows.length} Batches</span>}
          </div>
          <p className="page-subtitle">Every confirmed batch settlement, disbursement status, and official payroll receipts.</p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner" style={{ marginBottom: "1rem" }}>
          <span>✓</span> {successMsg}
          <button type="button" onClick={() => setSuccessMsg("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
        </div>
      )}

      {error && <div className="error-msg" style={{ marginBottom: "1rem" }}><span>⚠️</span> {error}</div>}
      {!rows && !error && <div className="loading"><span>⏳</span> Loading history…</div>}

      {rows && rows.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📜</span>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>No batch settlement has been confirmed yet.</p>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Go to the Settlement page to generate and commit your first artisan payroll.
          </span>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Confirmed Date</th>
                <th>Batch Reference</th>
                <th>Cutoff Date</th>
                <th style={{ textAlign: "right" }}>Weavers</th>
                <th>Payment Status</th>
                <th style={{ textAlign: "right" }}>Total / Disbursed (ETB)</th>
                <th>Payment Method</th>
                <th>Confirmed By</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isPaid = row.status === "paid" || row.paidTotal >= row.grandTotal - 0.01;
                const isPartial = row.status === "partial" || (row.paidTotal > 0 && !isPaid);
                const remaining = Math.max(0, row.grandTotal - row.paidTotal);

                return (
                  <tr key={row.previewId}>
                    <td style={{ color: "var(--text-muted)" }}>
                      {row.committedAt ? formatDateDDMMYY(row.committedAt) : "—"}
                    </td>
                    <td>
                      <code style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                        #{row.previewId}
                      </code>
                    </td>
                    <td>{row.cutoffDate ? formatDateDDMMYY(row.cutoffDate) : "—"}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{row.weaverCount} artisans</td>
                    <td>
                      {isPaid ? (
                        <span className="badge badge-green">✓ Paid / የተከፈለ</span>
                      ) : isPartial ? (
                        <span className="badge badge-blue">⚠️ Partial ({Math.round(row.paidTotal).toLocaleString()} ETB)</span>
                      ) : (
                        <span className="badge badge-yellow">⏳ Unpaid / ያልተከፈለ</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: isPaid ? "var(--green)" : "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                        {Math.round(row.grandTotal).toLocaleString()} ETB
                      </div>
                      {!isPaid && (
                        <span style={{ fontSize: "11px", color: "#EA580C", fontWeight: 600 }}>
                          Remaining: {Math.round(remaining).toLocaleString()} ETB
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-gray">{row.paymentMethod ?? "Standard"}</span>
                    </td>
                    <td style={{ fontSize: "12.5px" }}>{row.confirmedBy}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                        {!isPaid && (
                          <button
                            type="button"
                            className="btn-sm"
                            style={{ background: "#059669", color: "#FFFFFF", fontWeight: 700 }}
                            onClick={() => handleOpenPayoutModal(row)}
                          >
                            💳 Pay / ክፈል
                          </button>
                        )}
                        <Link
                          to={`/admin/settlement/preview/${row.previewId}`}
                          className="btn-sm"
                        >
                          🖨 Document
                        </Link>
                        <button
                          type="button"
                          className="btn-sm primary"
                          onClick={() => reportsApi.downloadBatchHisabCsv(row.previewId)}
                        >
                          ⬇ CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Disburse Batch Payment Modal */}
      {payingBatch && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: "480px", width: "100%", background: "#FFFFFF", borderRadius: "12px", boxShadow: "var(--shadow-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
                💳 Disburse Batch Payment / ክፍያ ፈጽም
              </h3>
              <button
                type="button"
                onClick={() => setPayingBatch(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {payoutError && <div className="error-msg" style={{ marginBottom: "1rem" }}><span>⚠️</span> {payoutError}</div>}

            <form onSubmit={handleConfirmPayout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "8px", fontSize: "13px" }}>
                <div>Batch Reference: <strong>#{payingBatch.previewId}</strong></div>
                <div>Eligible Weavers: <strong>{payingBatch.weaverCount} artisans</strong></div>
                <div>Total Payable: <strong>{Math.round(payingBatch.grandTotal).toLocaleString()} ETB</strong></div>
                <div>Already Paid: <strong>{Math.round(payingBatch.paidTotal).toLocaleString()} ETB</strong></div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Disbursement Amount (ETB) / የክፍያ መጠን
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "15px", fontWeight: 700 }}
                />
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
                  placeholder="e.g. CBE Batch Txn Ref #928374 or Cash Slip"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setPayingBatch(null)}
                  disabled={isSubmittingPayout}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: "#059669", borderColor: "#059669" }}
                  disabled={isSubmittingPayout}
                >
                  {isSubmittingPayout ? "Processing Payout…" : "✓ Confirm Disbursement / አጽድቅ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementHistoryPage;
