import { Modal } from "../common";

export interface CancelZigModalProps {
  isOpen: boolean;
  onClose: () => void;
  zigId: string;
  weaverDisplayName: string;
  cancelling: boolean;
  onConfirm: () => Promise<void>;
}

export function CancelZigModal({
  isOpen,
  onClose,
  zigId,
  weaverDisplayName,
  cancelling,
  onConfirm,
}: CancelZigModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!cancelling) onClose();
      }}
      title={`Cancel Zig ${zigId}?`}
      maxWidth={460}
    >
      <div>
        <p
          style={{
            margin: "0 0 1rem 0",
            fontSize: "0.92rem",
            color: "var(--color-text-secondary, #334155)",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to cancel this work order for <strong>{weaverDisplayName}</strong>?
        </p>

        <div
          style={{
            background: "var(--color-danger-subtle, #fef2f2)",
            border: "1px solid var(--color-danger-border, #fca5a5)",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.82rem",
            color: "var(--color-danger-dark, #991b1b)",
            lineHeight: 1.45,
          }}
        >
          <strong>Notice:</strong> This action permanently halts work order {zigId}. It cannot be undone, and the weaver will not be able to return additional fabric against this zig.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button
            type="button"
            disabled={cancelling}
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.92rem" }}
          >
            Keep Zig
          </button>
          <button
            type="button"
            disabled={cancelling}
            onClick={onConfirm}
            className="btn btn-danger"
            style={{ padding: "0.6rem 1.35rem", fontSize: "0.92rem" }}
          >
            {cancelling ? "Cancelling…" : "Yes, Cancel This Zig"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
