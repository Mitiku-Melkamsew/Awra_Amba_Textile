import type { DeductionEntry } from "../../api";
import { DEDUCTION_FACTORS } from "./useFabricReturnForm";

export interface DeductionsSectionProps {
  deductions: DeductionEntry[];
  numQty: number;
  isCurrentUnderweight: boolean;
  hasWeightDeduction: boolean;
  flooredAvg: number;
  weightDeficit: number;
  standardWeight: number;
  suggestedWeightPerPiece: number;
  handleApplyWeightDeduction: () => void;
  handleRemoveDeduction: (factor: string) => void;
  addFactorOpen: boolean;
  setAddFactorOpen: (open: boolean) => void;
  factorType: string;
  setFactorType: (type: string) => void;
  factorPerPiece: string;
  setFactorPerPiece: (val: string) => void;
  factorRemark: string;
  setFactorRemark: (val: string) => void;
  handleAddCustomFactor: () => void;
  liveGross: number;
  liveDeductionAmount: number;
  liveNetFabricValue: number;
}

export function DeductionsSection({
  deductions,
  numQty,
  isCurrentUnderweight,
  hasWeightDeduction,
  flooredAvg,
  weightDeficit,
  standardWeight,
  suggestedWeightPerPiece,
  handleApplyWeightDeduction,
  handleRemoveDeduction,
  addFactorOpen,
  setAddFactorOpen,
  factorType,
  setFactorType,
  factorPerPiece,
  setFactorPerPiece,
  factorRemark,
  setFactorRemark,
  handleAddCustomFactor,
  liveGross,
  liveDeductionAmount,
  liveNetFabricValue,
}: DeductionsSectionProps) {
  return (
    <div
      style={{
        background: "var(--color-surface-subtle, #f8fafc)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        borderRadius: "var(--radius-md, 10px)",
        padding: "1rem",
        marginTop: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.6rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
            Quality Deductions
          </span>
          <span
            className={`badge ${deductions.length > 0 ? "badge--danger" : "badge--neutral"}`}
            style={{ fontSize: "0.75rem", padding: "1px 7px" }}
          >
            {deductions.length}
          </span>
        </div>

        {!addFactorOpen && (
          <button
            type="button"
            onClick={() => setAddFactorOpen(true)}
            className="btn btn-secondary"
            style={{
              padding: "0.3rem 0.65rem",
              fontSize: "0.78rem",
            }}
          >
            + Add factor
          </button>
        )}
      </div>

      {/* Underweight auto-suggestion banner */}
      {isCurrentUnderweight && !hasWeightDeduction && (
        <div
          style={{
            background: "var(--color-amber-50, #fffbeb)",
            border: "1px solid var(--color-amber-200, #fde68a)",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "0.6rem 0.85rem",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            fontSize: "0.82rem",
            color: "var(--color-amber-800, #92400e)",
          }}
        >
          <span>
            ⚠️ Average weight ({flooredAvg}g) is {weightDeficit}g below standard ({standardWeight}g).
            Suggested deduction: <strong>{suggestedWeightPerPiece} ETB/piece</strong>.
          </span>
          <button
            type="button"
            onClick={handleApplyWeightDeduction}
            className="btn btn-primary"
            style={{
              padding: "0.3rem 0.65rem",
              fontSize: "0.78rem",
              whiteSpace: "nowrap",
            }}
          >
            Apply
          </button>
        </div>
      )}

      {/* Applied Deductions List */}
      {deductions.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)", fontStyle: "italic" }}>
          No quality deductions applied. Weaver will receive full piece rate.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "0.75rem" }}>
          {deductions.map((d) => {
            const factorMeta = DEDUCTION_FACTORS.find((f) => f.value === d.factor);
            const factorLabel = factorMeta ? factorMeta.label : d.factor;
            const factorSubtotal = (Number(d.perPiece) || 0) * numQty;

            return (
              <div
                key={d.factor}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--color-surface, #ffffff)",
                  border: "1px solid var(--color-orange-200, #fed7aa)",
                  borderRadius: "var(--radius-sm, 7px)",
                  padding: "0.45rem 0.75rem",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "var(--color-orange-100, #ffedd5)",
                      color: "var(--color-orange-800, #9a3412)",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {factorLabel}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--color-danger, #dc2626)" }}>
                    -{d.perPiece} ETB/pc
                  </span>
                  {numQty > 0 && (
                    <span style={{ color: "var(--color-text-muted, #64748b)", fontSize: "0.78rem" }}>
                      (= -{factorSubtotal.toLocaleString()} ETB)
                    </span>
                  )}
                  {d.remark && (
                    <span style={{ color: "var(--color-text-muted, #64748b)", fontSize: "0.78rem", fontStyle: "italic" }}>
                      · {d.remark}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  title="Remove deduction"
                  onClick={() => handleRemoveDeduction(d.factor)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-danger, #ef4444)",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    padding: "0 0.25rem",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Add Factor Form */}
      {addFactorOpen && (
        <div
          style={{
            background: "var(--color-surface, #ffffff)",
            border: "1px dashed var(--color-border-subtle, #cbd5e1)",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: 3 }}>
                Factor / Reason
              </label>
              <select
                value={factorType}
                onChange={(e) => setFactorType(e.target.value)}
                className="select"
                style={{ padding: "0.4rem", fontSize: "0.82rem" }}
              >
                {DEDUCTION_FACTORS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: 3 }}>
                Deduction / piece (ETB)
              </label>
              <input
                type="number"
                step="any"
                min={0.01}
                placeholder="e.g. 10"
                value={factorPerPiece}
                onChange={(e) => setFactorPerPiece(e.target.value)}
                className="input"
                style={{ padding: "0.4rem", fontSize: "0.82rem" }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="Optional note / observation"
              value={factorRemark}
              onChange={(e) => setFactorRemark(e.target.value)}
              className="input"
              style={{ padding: "0.4rem", fontSize: "0.82rem" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
            <button
              type="button"
              onClick={() => {
                setAddFactorOpen(false);
                setFactorPerPiece("");
                setFactorRemark("");
              }}
              className="btn btn-secondary"
              style={{ padding: "0.3rem 0.65rem", fontSize: "0.8rem" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCustomFactor}
              className="btn btn-primary"
              style={{ padding: "0.3rem 0.85rem", fontSize: "0.8rem" }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Live Financial Calculation Breakdown */}
      {numQty > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--color-border-subtle, #e2e8f0)",
            marginTop: "0.75rem",
            paddingTop: "0.6rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            fontSize: "0.82rem",
          }}
        >
          <div>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>Gross: </span>
            <strong>{liveGross.toLocaleString()} ETB</strong>
            {liveDeductionAmount > 0 && (
              <span style={{ color: "var(--color-danger, #dc2626)", marginLeft: "0.5rem" }}>
                Deduction: -{liveDeductionAmount.toLocaleString()} ETB
              </span>
            )}
          </div>
          <div style={{ fontWeight: 800, color: "var(--color-text, #0f172a)" }}>
            Net Fabric Pay:{" "}
            <span style={{ color: liveNetFabricValue >= 0 ? "var(--color-success, #15803d)" : "var(--color-danger, #b91c1c)" }}>
              {liveNetFabricValue.toLocaleString()} ETB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
