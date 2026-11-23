import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { calculationsApi } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";
import { ConfirmSettlementRunModal } from "./ConfirmSettlementRunModal";
import type { OutOfCutoffZig } from "../../domain/models";

export function NewSettlementRunPage() {
  const navigate = useNavigate();

  const [cutoffDate, setCutoffDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [exceptionZigIds, setExceptionZigIds] = useState<string[]>([]);
  const [showAddZigModal, setShowAddZigModal] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedWeaverIds, setExpandedWeaverIds] = useState<Set<number>>(new Set());

  // Confirm Run Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const calculatePreview = useCallback(async (currentExceptions = exceptionZigIds) => {
    setLoading(true);
    setError("");
    try {
      const p: any = await calculationsApi.batchPreview({
        cutoffDate: cutoffDate || undefined,
        includeZigIds: currentExceptions.length > 0 ? currentExceptions : undefined,
      });
      setPreview(p);
      // Auto-expand first weaver if present
      if (p.weavers && p.weavers.length > 0) {
        setExpandedWeaverIds(new Set([p.weavers[0].userId]));
      }
    } catch (err: any) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Preview calculation failed");
    } finally {
      setLoading(false);
    }
  }, [cutoffDate, exceptionZigIds]);

  useEffect(() => {
    calculatePreview();
  }, [calculatePreview]);

  const toggleWeaverExpand = (userId: number) => {
    setExpandedWeaverIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const removeExceptionZig = (zigId: string) => {
    const updated = exceptionZigIds.filter((id) => id !== zigId);
    setExceptionZigIds(updated);
    calculatePreview(updated);
  };

  const addExceptionZig = (zigId: string) => {
    if (!exceptionZigIds.includes(zigId)) {
      const updated = [...exceptionZigIds, zigId];
      setExceptionZigIds(updated);
      calculatePreview(updated);
    }
    setShowAddZigModal(false);
  };

  // Aggregated Stats
  const weavers = useMemo(() => preview?.weavers || [], [preview]);
  const readyWeavers = useMemo(() => weavers.filter((w: any) => !w.isBlocked), [weavers]);
  const blockedWeavers = useMemo(() => weavers.filter((w: any) => w.isBlocked), [weavers]);

  const totalZigsCount = useMemo(() => {
    return weavers.reduce((acc: number, w: any) => acc + (w.zigIds?.length || 0), 0);
  }, [weavers]);

  const grandTotal = Math.round(preview?.grandTotal || 0);

  // Commit Run
  const handleConfirmRun = async () => {
    if (!preview || preview.weaverCount === 0 || blockedWeavers.length > 0) return;

    setConfirmLoading(true);
    setConfirmError("");
    try {
      const result = await calculationsApi.batchCommit({
        cutoffDate: cutoffDate || undefined,
        includeZigIds: exceptionZigIds.length > 0 ? exceptionZigIds : undefined,
        expectedNetSettlement: preview.grandTotal,
      });

      setShowConfirmModal(false);
      navigate(`/admin/settlement/runs/${result.previewId}`);
    } catch (err: any) {
      setConfirmError(err.message || "Failed to commit settlement run");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: "5rem" }}>
      {/* ── Back Navigation Link ── */}
      <Link
        to="/admin/settlement"
        className="back-link"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          color: "var(--brand, #c2410c)",
          textDecoration: "none",
          fontWeight: 600,
          marginBottom: "1rem",
        }}
      >
        ‹ Settlement
      </Link>

      {/* ── Header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
          New settlement run · አዲስ ሂሳብ
        </h1>
        <p style={{ color: "#64748B", fontSize: "0.92rem", margin: "0.35rem 0 0 0" }}>
          Preview only. Nothing is saved until you confirm.
        </p>
      </div>

      {/* ── Filter / Controls Card ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "14px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Include Zigs up to Date */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748B", marginBottom: "0.35rem" }}>
              Include zigs returned up to
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontSize: "0.9rem",
                color: "#0F172A",
              }}
            />
          </div>

          {/* Also include later zigs tags */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#64748B", marginBottom: "0.35rem" }}>
              Also include later zigs
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {exceptionZigIds.map((id) => (
                <span
                  key={id}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "0.82rem",
                    color: "#334155",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {id}
                  <button
                    type="button"
                    onClick={() => removeExceptionZig(id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B", padding: 0 }}
                  >
                    ✕
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={() => setShowAddZigModal(true)}
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 600 }}
              >
                + Add a zig
              </button>
            </div>
          </div>
        </div>

        {/* Recalculate Button */}
        <button
          type="button"
          onClick={() => calculatePreview()}
          disabled={loading}
          className="btn btn-secondary"
          style={{ padding: "0.55rem 1.15rem", borderRadius: "8px", fontWeight: 600 }}
        >
          {loading ? "Calculating…" : "Recalculate"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── 3 Summary KPI Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Card 1: Ready */}
        <div className="settlement-kpi-card settlement-kpi-white">
          <div className="settlement-kpi-label">Ready</div>
          <div className="settlement-kpi-val dark">
            {readyWeavers.length} weavers
          </div>
          <div className="settlement-kpi-sub">
            no problems found
          </div>
        </div>

        {/* Card 2: Blocked */}
        <div className="settlement-kpi-card settlement-kpi-white">
          <div className="settlement-kpi-label">Blocked</div>
          <div className="settlement-kpi-val" style={{ color: blockedWeavers.length > 0 ? "#DC2626" : "#0F172A" }}>
            {blockedWeavers.length} {blockedWeavers.length === 1 ? "weaver" : "weavers"}
          </div>
          <div className="settlement-kpi-sub">
            {blockedWeavers.length > 0 ? "needs a fix first" : "all clear"}
          </div>
        </div>

        {/* Card 3: Total to pay (Peach bg) */}
        <div className="settlement-kpi-card settlement-kpi-peach">
          <div className="settlement-kpi-label">Total to pay</div>
          <div className="settlement-kpi-val rust">
            {grandTotal.toLocaleString()} ETB
          </div>
          <div className="settlement-kpi-sub">
            {totalZigsCount} zigs
          </div>
        </div>
      </div>

      {/* ── Weavers Accordion Table ── */}
      <div
        className="data-table-container"
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          overflow: "hidden",
        }}
      >
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E2E8F0", background: "#FFFFFF" }}>
              <th style={{ padding: "1rem 1.25rem", textAlign: "left", fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Weaver · ሸማኔ</th>
              <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Zigs</th>
              <th style={{ padding: "1rem 1.25rem", textAlign: "right", fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Fabric credit</th>
              <th style={{ padding: "1rem 1.25rem", textAlign: "right", fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Yarn charged</th>
              <th style={{ padding: "1rem 1.25rem", textAlign: "right", fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Net payable</th>
              <th style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Status</th>
              <th style={{ width: "40px", padding: "1rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {weavers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
                  {loading ? "Calculating master preview…" : "No weavers found returned within this period."}
                </td>
              </tr>
            ) : (
              weavers.map((w: any) => {
                const isExpanded = expandedWeaverIds.has(w.userId);
                const isBlocked = w.isBlocked;

                // Calculate fabric credit and yarn charged
                const fabricCredit = Math.round(
                  (w.lineItems || []).reduce((acc: number, line: any) => acc + (line.grossValue || 0), 0)
                );
                const yarnCharged = Math.round(
                  (w.yarnDebits || []).reduce((acc: number, debit: any) => acc + (debit.cost || 0), 0)
                );

                return (
                  <tr key={w.userId} style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td colSpan={7} style={{ padding: 0 }}>
                      {/* Summary Row */}
                      <div
                        onClick={() => toggleWeaverExpand(w.userId)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 0.6fr 1.2fr 1.2fr 1.2fr 1fr 40px",
                          alignItems: "center",
                          padding: "1rem 1.25rem",
                          background: isBlocked ? "#FEF2F2" : isExpanded ? "#F8FAFC" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "background 0.1s ease",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#0F172A", fontSize: "0.95rem" }}>
                            {w.weaverName}
                          </strong>
                        </div>

                        <div style={{ textAlign: "center", color: "#334155" }}>
                          {w.zigIds?.length || 0}
                        </div>

                        <div style={{ textAlign: "right", color: "#334155" }}>
                          {fabricCredit.toLocaleString()}
                        </div>

                        <div style={{ textAlign: "right", color: "#334155" }}>
                          {yarnCharged.toLocaleString()}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          {isBlocked ? (
                            <span style={{ color: "#94A3B8" }}>—</span>
                          ) : (
                            <strong style={{ color: "#0F172A", fontWeight: 700 }}>
                              {Math.round(w.netSettlement || 0).toLocaleString()}
                            </strong>
                          )}
                        </div>

                        <div style={{ textAlign: "center" }}>
                          {isBlocked ? (
                            <span className="badge-blocked">⚠ Blocked</span>
                          ) : (
                            <span className="badge-settled">✓ Ready</span>
                          )}
                        </div>

                        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.9rem" }}>
                          {isExpanded ? "⌃" : "⌄"}
                        </div>
                      </div>

                      {/* Blocked Warning Callout */}
                      {isBlocked && (
                        <div
                          style={{
                            background: "#FEF2F2",
                            borderTop: "1px solid #FEE2E2",
                            padding: "0.85rem 1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.85rem",
                            color: "#991B1B",
                          }}
                        >
                          <div>
                            <strong>Why:</strong> yarn cost ({yarnCharged.toLocaleString()} ETB) is more than the fabric value ({fabricCredit.toLocaleString()} ETB). Fix the zig, then recalculate.
                          </div>
                          {w.zigIds && w.zigIds[0] && (
                            <Link
                              to={`/admin/zigs/${w.zigIds[0]}`}
                              className="btn btn-secondary btn-sm"
                              style={{ textDecoration: "none", fontSize: "0.8rem", padding: "0.25rem 0.65rem" }}
                            >
                              Open zig
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Expanded Details Sub-table */}
                      {isExpanded && !isBlocked && (
                        <div style={{ background: "#F8FAFC", padding: "1rem 1.5rem", borderTop: "1px solid #E2E8F0" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                                <th style={{ textAlign: "left", padding: "0.5rem" }}>Zig · fabric</th>
                                <th style={{ textAlign: "center", padding: "0.5rem" }}>Received</th>
                                <th style={{ textAlign: "center", padding: "0.5rem" }}>Defective</th>
                                <th style={{ textAlign: "center", padding: "0.5rem" }}>Billable</th>
                                <th style={{ textAlign: "center", padding: "0.5rem" }}>Avg weight</th>
                                <th style={{ textAlign: "right", padding: "0.5rem" }}>Rate</th>
                                <th style={{ textAlign: "right", padding: "0.5rem" }}>Penalty / pc</th>
                                <th style={{ textAlign: "right", padding: "0.5rem" }}>Net credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(w.lineItems || []).map((line: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                  <td style={{ padding: "0.5rem" }}>
                                    <Link to={`/admin/zigs/${line.zigId}`} style={{ fontWeight: 600, color: "#0F172A", textDecoration: "none" }}>
                                      {line.zigId}
                                    </Link>
                                  </td>
                                  <td style={{ textAlign: "center", padding: "0.5rem" }}>{line.quantityReturned || line.quantity}</td>
                                  <td style={{ textAlign: "center", padding: "0.5rem" }}>{line.excludedQuantity || 0}</td>
                                  <td style={{ textAlign: "center", padding: "0.5rem" }}>{line.quantity}</td>
                                  <td style={{ textAlign: "center", padding: "0.5rem" }}>{line.avgWeight ? `${line.avgWeight} g` : "—"}</td>
                                  <td style={{ textAlign: "right", padding: "0.5rem" }}>{Number(line.unitPrice || 0).toLocaleString()}</td>
                                  <td style={{ textAlign: "right", padding: "0.5rem", color: line.deductionPerPiece > 0 ? "#DC2626" : "#64748B" }}>
                                    {line.deductionPerPiece > 0 ? `-${line.deductionPerPiece}` : "0"}
                                  </td>
                                  <td style={{ textAlign: "right", padding: "0.5rem", fontWeight: 600 }}>
                                    {Math.round(line.netCredit || line.grossValue || 0).toLocaleString()} ETB
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Sub-footer inside expanded section */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", fontSize: "0.85rem" }}>
                            <div style={{ color: "#64748B" }}>
                              Yarn given: charged <strong>{yarnCharged.toLocaleString()} ETB</strong>
                            </div>
                            <div>
                              Net payable <strong style={{ color: "var(--brand, #c2410c)", fontSize: "0.95rem" }}>{Math.round(w.netSettlement || 0).toLocaleString()} ETB</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Sticky Bottom Action Footer ── */}
      <div className="settlement-sticky-footer">
        <div>
          {blockedWeavers.length > 0 && (
            <span style={{ color: "#DC2626", fontWeight: 600, fontSize: "0.9rem" }}>
              ⚠ Fix {blockedWeavers[0].weaverName} to continue
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={loading || weavers.length === 0 || blockedWeavers.length > 0}
          className="btn btn-primary"
          style={{
            padding: "0.65rem 1.45rem",
            borderRadius: "8px",
            fontWeight: 700,
            background: "var(--brand, #c2410c)",
            borderColor: "var(--brand, #c2410c)",
            color: "#ffffff",
            cursor: blockedWeavers.length > 0 || weavers.length === 0 ? "not-allowed" : "pointer",
            opacity: blockedWeavers.length > 0 || weavers.length === 0 ? 0.6 : 1,
          }}
        >
          Confirm run
        </button>
      </div>

      {/* ── Confirm Run Modal ── */}
      <ConfirmSettlementRunModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        loading={confirmLoading}
        error={confirmError}
        cutoffDate={cutoffDate ? formatDateDDMMYY(cutoffDate) : "Today"}
        weaverCount={weavers.length}
        zigCount={totalZigsCount}
        totalAmount={grandTotal}
        amharicAmountInWords={preview?.amharicAmountInWords}
        onConfirm={handleConfirmRun}
      />

      {/* ── Add Exception Zig Modal ── */}
      {showAddZigModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddZigModal(false);
          }}
        >
          <div
            className="modal-dialog"
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "1.5rem",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.15rem", color: "#0F172A" }}>
              Include later zig
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748B", marginBottom: "1rem" }}>
              Available out-of-cutoff returned zigs:
            </p>
            <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(preview?.outOfCutoffZigs || []).length === 0 ? (
                <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>
                  No additional out-of-cutoff zigs found.
                </div>
              ) : (
                (preview.outOfCutoffZigs as OutOfCutoffZig[]).map((zig) => (
                  <button
                    key={zig.zigId}
                    type="button"
                    onClick={() => addExceptionZig(zig.zigId)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "6px",
                      border: "1px solid #E2E8F0",
                      background: "#FFFFFF",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span><strong>{zig.zigId}</strong> · {zig.weaverName}</span>
                    <span style={{ color: "#64748B", fontSize: "0.8rem" }}>{formatDateDDMMYY(zig.firstReturnDate)}</span>
                  </button>
                ))
              )}
            </div>
            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setShowAddZigModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewSettlementRunPage;
