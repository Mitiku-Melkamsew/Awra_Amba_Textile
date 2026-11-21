import type { FormEvent } from "react";
import type { QualityRuleRow } from "../../../api";

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
            Edit rule · {rule.factor.charAt(0).toUpperCase() + rule.factor.slice(1)}
          </h3>
          <p className="detail-panel-sub">
            Deduction per piece, for each gram below the fabric's standard
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
            value={rule.factor.charAt(0).toUpperCase() + rule.factor.slice(1)}
            readOnly
            disabled
            className="input-field input-read-only"
          />
        </div>

        <div className="field-label" style={{ marginTop: "0.85rem" }}>
          Unit
          <input
            type="text"
            value={rule.unit}
            readOnly
            disabled
            className="input-field input-read-only"
          />
        </div>

        <div className="field-label" style={{ marginTop: "0.85rem" }}>
          Deduction per gram (ETB)
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

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1 }}
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
        <div className="example-calc-box" style={{ marginTop: "1rem" }}>
          <strong>Example:</strong> 42 pieces, 1 g short → 1 × {calcRate} × 42 ={" "}
          <strong>{exampleDeduction} ETB</strong> deducted.
        </div>

        <p
          style={{
            margin: "0.85rem 0 0",
            fontSize: "12px",
            color: "var(--text-muted, #64748B)",
            lineHeight: 1.45,
          }}
        >
          Applies to settlements calculated from now on. Confirmed settlements keep their saved deductions.
        </p>
      </form>
    </div>
  );
}
