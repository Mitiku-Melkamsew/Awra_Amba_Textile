import type { FormEvent } from "react";

export interface CancelRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error?: string;
  runReference: string;
  settlementCount: number;
  reason: string;
  setReason: (val: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
}

export function CancelRunModal({
  isOpen,
  onClose,
  loading,
  error,
  runReference,
  settlementCount,
  reason,
  setReason,
  onSubmit,
}: CancelRunModalProps) {
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

        <h2 className="settlement-modal-title">
          Cancel this run?
        </h2>

        <p className="settlement-modal-sub">
          All <strong>{settlementCount} settlements</strong> in run <strong>{runReference}</strong> are cancelled and their zigs are released, so you can correct the returns and start a new run.
        </p>

        {error && (
          <div className="settlement-modal-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="settlement-modal-field">
            <label className="settlement-modal-label">
              Reason (required)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Error found on Weaver 02's return"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="settlement-modal-textarea"
            />
          </div>

          {/* Warning Callout Box */}
          <div className="settlement-modal-warning">
            Not possible once any weaver is marked as paid.
          </div>

          {/* Action buttons */}
          <div className="settlement-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Keep run
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="settlement-btn-cancel-danger"
            >
              {loading ? "Cancelling…" : "Cancel run"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
