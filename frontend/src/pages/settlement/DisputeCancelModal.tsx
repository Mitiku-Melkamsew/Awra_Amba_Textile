import type { FormEvent } from "react";
import { Modal } from "../../components/common";
import type { CommittedPayment } from "./useSettlementManager";

export interface DisputeCancelModalProps {
  cancellingPayment: CommittedPayment | null;
  cancelLoading: boolean;
  cancellationReason: string;
  setCancellationReason: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => Promise<void>;
}

export function DisputeCancelModal({
  cancellingPayment,
  cancelLoading,
  cancellationReason,
  setCancellationReason,
  onClose,
  onSubmit,
}: DisputeCancelModalProps) {
  return (
    <Modal
      isOpen={Boolean(cancellingPayment)}
      onClose={() => {
        if (!cancelLoading) onClose();
      }}
      title={`Cancel Settlement for ${cancellingPayment?.weaverName}`}
      maxWidth={460}
    >
      {cancellingPayment && (
        <div>
          <p
            style={{
              fontSize: "13.5px",
              color: "var(--color-text-muted, #64748b)",
              margin: "0 0 1rem",
              lineHeight: 1.5,
            }}
          >
            This will release all fabric returns for this weaver back to the unsettled pool so a corrected settlement can be generated.
          </p>
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label className="form-label" style={{ fontSize: "12.5px", marginBottom: "0.25rem" }}>
                Cancellation / Dispute Reason (Required):
              </label>
              <textarea
                required
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Disputed scale calibration on Zig-12; re-measuring weight."
                className="input"
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={cancelLoading}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={cancelLoading}
              >
                {cancelLoading ? "Cancelling…" : "Confirm Cancellation"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
