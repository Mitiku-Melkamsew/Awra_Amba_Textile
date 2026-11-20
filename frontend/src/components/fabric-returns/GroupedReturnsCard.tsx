import type { DeductionEntry, FabricVariant } from "../../api";
import type { FabricReturnRow } from "./useFabricReturnForm";

export interface GroupedReturnItem {
  variantId: number;
  variant: FabricVariant | null;
  label: string;
  standardWeightG: number;
  totalQty: number;
  totalWeight: number;
  avgG: number;
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
  returns: FabricReturnRow[];
}

export interface GroupedReturnsCardProps {
  groupedReturns: GroupedReturnItem[];
  grandTotal: number;
  canRecord?: boolean;
  onStartEdit: (ret: FabricReturnRow) => void;
  onDeleteReturn: (returnId: number) => void;
}

export function GroupedReturnsCard({
  groupedReturns,
  grandTotal,
  canRecord = true,
  onStartEdit,
  onDeleteReturn,
}: GroupedReturnsCardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface, #ffffff)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        borderRadius: "var(--radius-lg, 14px)",
        padding: "1.5rem",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))",
      }}
    >
      {/* Card Title */}
      <h3
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1.15rem",
          fontWeight: 700,
          color: "var(--color-text, #0f172a)",
        }}
      >
        Fabric returned
      </h3>

      {/* Table Column Headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
          paddingBottom: "0.5rem",
          marginBottom: "0.75rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--color-text-muted, #64748b)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        <span style={{ flex: 1 }}>Fabric</span>
        <span style={{ width: 44, textAlign: "center" }}>Qty</span>
        <span style={{ width: 60, textAlign: "center" }}>Avg g</span>
        <span style={{ width: 85, textAlign: "right" }}>Subtotal</span>
      </div>

      {/* Empty state */}
      {groupedReturns.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2.5rem 1rem",
            color: "var(--color-text-muted, #94a3b8)",
          }}
        >
          <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📭</div>
          <div style={{ fontWeight: 600, color: "var(--color-text-secondary, #64748b)" }}>
            No fabric returns recorded yet
          </div>
          <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Use the form on the left to record the first piece.
          </div>
        </div>
      ) : (
        groupedReturns.map((group) => (
          <div key={group.variantId} style={{ marginBottom: "1.25rem" }}>
            {/* Group Summary Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.35rem 0",
                fontWeight: 700,
                color: "var(--color-text, #0f172a)",
                fontSize: "0.95rem",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)" }}>⌵</span>
                <span>{group.label}</span>
              </div>
              <span style={{ width: 44, textAlign: "center" }}>{group.totalQty}</span>
              <span style={{ width: 60, textAlign: "center" }}>{group.avgG} g</span>
              <span style={{ width: 85, textAlign: "right", color: "var(--color-success, #15803d)" }}>
                {group.netTotal.toLocaleString()}
              </span>
            </div>

            {group.deductionTotal > 0 && (
              <div style={{ margin: "0.15rem 0 0.4rem 1.35rem" }}>
                <span className="badge badge-danger">
                  Total deductions: -{group.deductionTotal.toLocaleString()} ETB
                </span>
              </div>
            )}

            {/* Sub-rows: Individual Returns */}
            <div
              style={{
                background: "var(--color-amber-50, #fffdf5)",
                borderRadius: "var(--radius-sm, 8px)",
                border: "1px solid var(--color-amber-100, #fef3c7)",
                overflow: "hidden",
                marginTop: "0.35rem",
              }}
            >
              {group.returns.map((ret: any, idx) => {
                const rGross =
                  ret.grossFabricValue !== undefined
                    ? Number(ret.grossFabricValue)
                    : Number(ret.quantityReturned || 0) * Number(ret.unitPrice || 0);
                const rDeduction =
                  ret.deductionAmount !== undefined ? Number(ret.deductionAmount) : 0;
                const rNet = rGross - rDeduction;
                const rDeductions: DeductionEntry[] = ret.deductions || [];

                return (
                  <div
                    key={ret.returnId}
                    style={{
                      padding: "0.6rem 0.85rem",
                      borderBottom:
                        idx < group.returns.length - 1
                          ? "1px solid var(--color-amber-100, #fef3c7)"
                          : "none",
                      fontSize: "0.85rem",
                      color: "var(--color-text-secondary, #334155)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-text, #0f172a)" }}>
                        Return {idx + 1} · {Number(ret.totalWeight).toLocaleString()} g ({ret.quantityReturned} pcs)
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: rNet >= 0 ? "var(--color-success, #15803d)" : "var(--color-danger, #b91c1c)",
                          }}
                        >
                          {rNet.toLocaleString()} ETB
                        </span>
                        {canRecord && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <button
                              type="button"
                              title="Edit this return"
                              onClick={() => onStartEdit(ret)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--color-text-muted, #64748b)",
                                padding: "0.15rem",
                                fontSize: "0.95rem",
                              }}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              title="Delete this return"
                              onClick={() => onDeleteReturn(ret.returnId)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--color-danger, #ef4444)",
                                padding: "0.15rem",
                                fontSize: "0.85rem",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deductions & details line */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        flexWrap: "wrap",
                        marginTop: "3px",
                        fontSize: "0.76rem",
                      }}
                    >
                      <span style={{ color: "var(--color-text-muted, #64748b)" }}>
                        Gross: {rGross.toLocaleString()} ETB
                      </span>
                      {rDeductions.length > 0 && (
                        <>
                          <span style={{ color: "var(--color-border-subtle, #cbd5e1)" }}>•</span>
                          {rDeductions.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className="badge badge-danger"
                              style={{ padding: "1px 5px", fontSize: "0.72rem" }}
                            >
                              {d.factor}: -{d.perPiece}/pc
                            </span>
                          ))}
                          <span style={{ color: "var(--color-danger, #dc2626)", fontWeight: 600 }}>
                            (-{rDeduction.toLocaleString()} ETB)
                          </span>
                        </>
                      )}
                      {ret.remark && (
                        <>
                          <span style={{ color: "var(--color-border-subtle, #cbd5e1)" }}>•</span>
                          <span style={{ color: "var(--color-text-muted, #64748b)", fontStyle: "italic" }}>
                            {ret.remark}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Card Total Footer */}
      <div
        style={{
          borderTop: "1px solid var(--color-border-subtle, #e2e8f0)",
          marginTop: "1.25rem",
          paddingTop: "0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 700,
          color: "var(--color-text, #0f172a)",
        }}
      >
        <span style={{ fontSize: "1rem" }}>Net fabric total</span>
        <span style={{ fontSize: "1.05rem", color: "var(--color-success, #15803d)" }}>
          {grandTotal.toLocaleString()} ETB
        </span>
      </div>
    </div>
  );
}
