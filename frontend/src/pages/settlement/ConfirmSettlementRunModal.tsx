export interface ConfirmSettlementRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error?: string;
  cutoffDate: string;
  weaverCount: number;
  zigCount: number;
  totalAmount: number;
  amharicAmountInWords?: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmSettlementRunModal({
  isOpen,
  onClose,
  loading,
  error,
  cutoffDate,
  weaverCount,
  zigCount,
  totalAmount,
  amharicAmountInWords,
  onConfirm,
}: ConfirmSettlementRunModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="settlement-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="settlement-modal-dialog">
        {/* Close button */}
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
          Confirm settlement run
        </h2>

        {error && (
          <div className="settlement-modal-error">
            ⚠️ {error}
          </div>
        )}

        {/* Details list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div className="settlement-modal-summary-row">
            <span className="settlement-modal-summary-label">Zigs returned up to</span>
            <strong className="settlement-modal-summary-val">{cutoffDate || "All available"}</strong>
          </div>

          <div className="settlement-modal-summary-row">
            <span className="settlement-modal-summary-label">Weavers</span>
            <strong className="settlement-modal-summary-val">{weaverCount}</strong>
          </div>

          <div className="settlement-modal-summary-row">
            <span className="settlement-modal-summary-label">Zigs</span>
            <strong className="settlement-modal-summary-val">{zigCount}</strong>
          </div>

          <div className="settlement-modal-summary-row" style={{ marginTop: "0.25rem" }}>
            <span className="settlement-modal-summary-label">Total to pay</span>
            <strong className="settlement-modal-summary-total">
              {Math.round(totalAmount).toLocaleString()} ETB
            </strong>
          </div>

          {amharicAmountInWords && (
            <div style={{ textAlign: "right", color: "#64748b", fontSize: "0.82rem", marginTop: "-0.35rem" }}>
              [{amharicAmountInWords}]
            </div>
          )}
        </div>

        {/* Info callout */}
        <div className="settlement-modal-success-box">
          This creates one settlement per weaver and locks their zigs. If you find a mistake later, cancel the whole run, correct the returns and start again.
        </div>

        {/* Action buttons */}
        <div className="settlement-modal-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="settlement-btn-confirm-primary"
          >
            {loading ? "Confirming…" : "Confirm run"}
          </button>
        </div>
      </div>
    </div>
  );
}
