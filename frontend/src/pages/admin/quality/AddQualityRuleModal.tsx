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
          Factor · የጥራት ምክንያት
          <input
            type="text"
            placeholder="e.g. weight, length, defect"
            value={newFactor}
            onChange={(e) => setNewFactor(e.target.value)}
            className="input-field"
            required
          />
          <span className="field-label-sub">
            Name of the quality evaluation factor or defect type
          </span>
        </div>

        <div className="field-label form-field-gap">
          Unit of measurement · መለኪያ
          <input
            type="text"
            placeholder="e.g. g, cm, piece"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="input-field"
            required
          />
          <span className="field-label-sub">
            The unit for measuring defect shortfalls (e.g. g, cm, pcs)
          </span>
        </div>

        <div className="field-label form-field-gap">
          Deduction per unit (ETB) · ቅጣት በአንድ መለኪያ
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

        {/* Info callout */}
        <div className="warning-callout-box info-callout-gap">
          <span className="text-base">ⓘ</span>
          <div>
            New quality rules apply to all subsequent fabric returns and settlement calculations.
          </div>
        </div>

        <div className="modal-actions-right">
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
