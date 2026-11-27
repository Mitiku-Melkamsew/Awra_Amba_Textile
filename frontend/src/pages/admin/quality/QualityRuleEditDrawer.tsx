import type { FormEvent } from "react";
import type { QualityRuleRow } from "../../../api";
import { toTitleCase } from "../../../utils/formatters";

export interface QualityRuleEditDrawerProps {
  rule: QualityRuleRow;
  editDeduction: string;
  setEditDeduction: (val: string) => void;
  isSaving: boolean;
  onSave: (e: FormEvent) => void;
  onClose: () => void;
}

export function QualityRuleEditDrawer({
  rule,
  editDeduction,
  setEditDeduction,
  isSaving,
  onSave,
  onClose,
}: QualityRuleEditDrawerProps) {
  const calcRate = parseFloat(editDeduction) || 0;
  const exampleDeduction = (1 * calcRate * 42).toLocaleString();

  return (
    <div className="edit-detail-panel">
      <div className="detail-panel-header">
        <div>
          <h3 className="detail-panel-title">
            Edit rule · {toTitleCase(rule.factor)}
          </h3>
          <p className="detail-panel-sub">
            Deduction per piece, for each {rule.unit} below the fabric's standard
          </p>
        </div>
        <button
          type="button"
          className="detail-close-btn"
          title="Close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <form onSubmit={onSave}>
        <div className="field-label">
          Factor
          <input
            type="text"
            value={toTitleCase(rule.factor)}
            readOnly
            disabled
            className="input-field input-read-only"
          />
        </div>

        <div className="field-label form-field-gap">
          Unit
          <input
            type="text"
            value={rule.unit}
            readOnly
            disabled
            className="input-field input-read-only"
          />
        </div>

        <div className="field-label form-field-gap">
          Deduction per {rule.unit} (ETB)
          <input
            type="number"
            step="any"
            min="0"
            value={editDeduction}
            onChange={(e) => setEditDeduction(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div className="detail-panel-actions">
          <button
            type="submit"
            className="btn btn-primary btn-full-width"
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditDeduction(String(rule.deductionPerUnit))}
          >
            Reset
          </button>
        </div>

        {/* Example calculation box */}
        <div className="example-calc-box">
          <strong>Example:</strong> 42 pieces, 1 {rule.unit} short → 1 × {calcRate} × 42 ={" "}
          <strong>{exampleDeduction} ETB</strong> deducted.
        </div>

        <p className="detail-panel-footnote">
          Applies to settlements calculated from now on. Confirmed settlements keep their saved deductions.
        </p>
      </form>
    </div>
  );
}
