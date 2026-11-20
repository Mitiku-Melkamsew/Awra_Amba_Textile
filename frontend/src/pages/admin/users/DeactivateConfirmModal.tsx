import type { UserSummary } from "../../../domain/models";
import { Button, Modal } from "../../../components/common";

export interface DeactivateConfirmModalProps {
  user: UserSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export function DeactivateConfirmModal({
  user,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: DeactivateConfirmModalProps) {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Deactivate ${user.fullName}?`}
      maxWidth={440}
    >
      <div className="stack">
        <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
          They will no longer be able to sign in to the platform. All historical transactions,
          work orders, and payment records will remain completely intact.
        </p>

        <div className="cluster" style={{ justifyContent: "flex-end", gap: "var(--space-2)" }}>
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isProcessing}>
            Yes, deactivate
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeactivateConfirmModal;
