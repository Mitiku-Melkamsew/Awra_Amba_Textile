import type { FormEvent } from "react";
import { Modal } from "../../../components/common";

export interface AddQualityRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  newFactor: string;
  setNewFactor: (val: string) => void;
  newUnit: string;
  setNewUnit: (val: string) => void;
  newDeduction: string;
  setNewDeduction: (val: string) => void;
  isCreating: boolean;
}

export function AddQualityRuleModal({
  isOpen,
  onClose,
  onSubmit,
  newFactor,
  setNewFactor,
  newUnit,
  setNewUnit,
  newDeduction,
  setNewDeduction,
  isCreating,
}: AddQualityRuleModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add quality rule"
      maxWidth={440}
    >
      <form onSubmit={onSubmit}>
        <div className="field-label">
          Factor
          <select
            value={newFactor}
            onChange={(e) => setNewFactor(e.target.value)}
            className="input-field"
          >
            <option value="weight">Weight</option>
          </select>
          <span className="field-label-sub">
            Length and width are not used in settlements yet.
          </span>
        </div>

        <div className="field-label" style={{ marginTop: "0.85rem" }}>
          Unit
          <input
            type="text"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="input-field input-read-only"
            readOnly
          />
        </div>

        <div className="field-label" style={{ marginTop: "0.85rem" }}>
          Deduction per gram (ETB)
          <input
            type="number"
            step="any"
            min="0.01"
            placeholder="e.g. 10"
            value={newDeduction}
            onChange={(e) => setNewDeduction(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Warning note */}
        <div className="warning-callout-box" style={{ marginTop: "1rem" }}>
          <span style={{ fontSize: "14px" }}>ⓘ</span>
          <div>
            Only one weight rule can be active. Adding one replaces the current rate.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isCreating}
          >
            {isCreating ? "Adding…" : "Add rule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
