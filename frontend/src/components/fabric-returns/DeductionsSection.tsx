import type { DeductionEntry } from "../../api";
import { DEDUCTION_FACTORS } from "./useFabricReturnForm";

export interface DeductionsSectionProps {
  deductions: DeductionEntry[];
  numQty: number;
  isCurrentUnderweight?: boolean;
  hasWeightDeduction?: boolean;
  flooredAvg?: number;
  weightDeficit?: number;
  standardWeight?: number;
  suggestedWeightPerPiece?: number;
  handleApplyWeightDeduction?: () => void;
  handleRemoveDeduction: (factor: string) => void;
  handleCancelDeduction?: (factor: string) => void;
  handleRestoreDeduction?: (factor: string) => void;
  cancelledAutoDeductions?: Array<{
    factor: string;
    label: string;
    deficit: number;
    unit: string;
    standard: number;
    actual: number;
    perPiece: number;
    remark: string;
  }>;
  addFactorOpen: boolean;
  setAddFactorOpen: (open: boolean) => void;
  handleOpenAddFactor?: () => void;
  availableFactors?: Array<{ value: string; label: string; rate?: number }>;
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
  handleRemoveDeduction,
  handleCancelDeduction,
  handleRestoreDeduction,
  cancelledAutoDeductions,
  addFactorOpen,
  setAddFactorOpen,
  handleOpenAddFactor,
  availableFactors,
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
  const onCancel = handleCancelDeduction || handleRemoveDeduction;

  return (
    <div className="deductions-box">
      <div className="deductions-header">
        <div className="deductions-header-title">
          <span>Quality Deductions</span>
          <span
            className={`badge ${deductions.length > 0 ? "badge--danger" : "badge--neutral"}`}
          >
            {deductions.length}
          </span>
        </div>

        {!addFactorOpen && (
          <button
            type="button"
            onClick={handleOpenAddFactor || (() => setAddFactorOpen(true))}
            className="btn btn-secondary btn-sm"
          >
            + Add factor
          </button>
        )}
      </div>

      {/* Applied Deductions List */}
      {deductions.length === 0 ? (
        <p className="deductions-empty">
          No quality deductions applied. Weaver will receive full piece rate.
        </p>
      ) : (
        <div className="deductions-list">
          {deductions.map((d) => {
            const factorMeta = DEDUCTION_FACTORS.find((f) => f.value === d.factor);
            const factorLabel = factorMeta ? factorMeta.label : d.factor;
            const factorSubtotal = (Number(d.perPiece) || 0) * numQty;

            return (
              <div key={d.factor} className="deduction-item">
                <div className="deduction-item-content">
                  <span className="deduction-factor-tag">{factorLabel}</span>
                  <span className="deduction-rate">-{d.perPiece} ETB/pc</span>
                  {numQty > 0 && (
                    <span className="deduction-subtotal">
                      (= -{factorSubtotal.toLocaleString()} ETB)
                    </span>
                  )}
                  {d.remark && <span className="deduction-remark">· {d.remark}</span>}
                </div>
                <button
                  type="button"
                  title="Cancel deduction (waive)"
                  onClick={() => onCancel(d.factor)}
                  className="deduction-cancel-btn"
                >
                  ✕ Cancel
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Waived Auto Deductions with Re-apply option */}
      {cancelledAutoDeductions && cancelledAutoDeductions.length > 0 && (
        <div className="deductions-waived-section">
          <div className="deductions-waived-header">
            <span>Waived Deductions (calculated deficit cancelled by admin):</span>
          </div>
          {cancelledAutoDeductions.map((cad) => (
            <div key={cad.factor} className="deduction-waived-item">
              <div>
                <strong>{cad.label}</strong>: {cad.deficit} {cad.unit} below standard ({cad.actual} vs std {cad.standard} {cad.unit}) · Waived -{cad.perPiece} ETB/pc
              </div>
              <button
                type="button"
                title="Re-apply deduction"
                onClick={() => handleRestoreDeduction?.(cad.factor)}
                className="deduction-restore-btn"
              >
                ↺ Re-apply
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inline Add Factor Form */}
      {addFactorOpen && (
        <div className="deductions-custom-form">
          <div className="deductions-custom-row">
            <div className="form-group">
              <label className="form-label" htmlFor="custom-factor-type">
                Factor / Reason
              </label>
              <select
                id="custom-factor-type"
                value={factorType}
                onChange={(e) => {
                  const val = e.target.value;
                  setFactorType(val);
                  const factorsList = availableFactors || DEDUCTION_FACTORS;
                  const match = factorsList.find((f) => f.value === val);
                  if (match && "rate" in match && match.rate !== undefined) {
                    setFactorPerPiece(String(match.rate));
                  }
                }}
                className="select"
              >
                {(availableFactors && availableFactors.length > 0
                  ? availableFactors
                  : DEDUCTION_FACTORS
                ).map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="custom-factor-rate">
                Deduction / piece (ETB)
              </label>
              <input
                id="custom-factor-rate"
                type="number"
                step="any"
                min={0.01}
                placeholder="e.g. 10"
                value={factorPerPiece}
                onChange={(e) => setFactorPerPiece(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Optional note / observation"
              value={factorRemark}
              onChange={(e) => setFactorRemark(e.target.value)}
              className="input"
            />
          </div>
          <div className="deductions-custom-actions">
            <button
              type="button"
              onClick={() => {
                setAddFactorOpen(false);
                setFactorPerPiece("");
                setFactorRemark("");
              }}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCustomFactor}
              className="btn btn-primary btn-sm"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Live Financial Calculation Breakdown */}
      {numQty > 0 && (
        <div className="deductions-totals">
          <div className="cluster">
            <span className="text-muted">Gross: </span>
            <strong>{liveGross.toLocaleString()} ETB</strong>
            {liveDeductionAmount > 0 && (
              <span className="text-danger">
                Deduction: -{liveDeductionAmount.toLocaleString()} ETB
              </span>
            )}
          </div>
          <div>
            <strong>Net Fabric Pay: </strong>
            <span className={liveNetFabricValue >= 0 ? "deductions-net-positive" : "deductions-net-negative"}>
              {liveNetFabricValue.toLocaleString()} ETB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
