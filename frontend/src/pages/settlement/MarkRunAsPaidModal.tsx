import type { FormEvent } from "react";

export interface MarkRunAsPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error?: string;
  weaverCount: number;
  totalAmount: number;
  paidBy: string;
  setPaidBy: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
}

export function MarkRunAsPaidModal({
  isOpen,
  onClose,
  loading,
  error,
  weaverCount,
  totalAmount,
  paidBy,
  setPaidBy,
  note,
  setNote,
  onSubmit,
}: MarkRunAsPaidModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="settlement-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="settlement-modal-dialog">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="settlement-modal-close"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="settlement-modal-title with-margin">
          Mark run as paid
        </h2>

        {error && (
          <div className="settlement-modal-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Summary Lines */}
          <div className="settlement-modal-summary-row">
            <span className="settlement-modal-summary-label">Weavers</span>
            <strong className="settlement-modal-summary-val">{weaverCount}</strong>
          </div>

          <div className="settlement-modal-summary-row" style={{ marginBottom: "1.5rem" }}>
            <span className="settlement-modal-summary-label">Total paid</span>
            <strong className="settlement-modal-summary-total">
              {Math.round(totalAmount).toLocaleString()} ETB
            </strong>
          </div>

          {/* Paid by Dropdown */}
          <div className="settlement-modal-field">
            <label className="settlement-modal-label">
              Paid by
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="settlement-modal-select"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer (CBE)</option>
              <option value="Telebirr">Telebirr</option>
              <option value="Check">Check</option>
            </select>
          </div>

          {/* Note Input */}
          <div className="settlement-modal-field">
            <label className="settlement-modal-label">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid at the office"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="settlement-modal-input"
            />
          </div>

          {/* Footnote */}
          <p className="settlement-modal-sub" style={{ fontSize: "0.82rem", margin: "0 0 1.5rem 0" }}>
            Everyone in this run is paid in full, together. This cannot be undone.
          </p>

          {/* Actions */}
          <div className="settlement-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="settlement-btn-confirm-primary"
            >
              {loading ? "Processing…" : "Mark as paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
