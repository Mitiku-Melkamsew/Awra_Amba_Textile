import { useState } from "react";
import type { UserRole } from "../../../domain/models";
import { Button, Modal } from "../../../components/common";

export interface CreatedCredentialsModalProps {
  credentials: {
    fullName: string;
    username: string;
    initialPassword?: string;
    roles: UserRole[];
  } | null;
  onClose: () => void;
}

export function CreatedCredentialsModal({
  credentials,
  onClose,
}: CreatedCredentialsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!credentials) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Username: ${credentials.username}\nPassword: ${credentials.initialPassword}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={!!credentials}
      onClose={onClose}
      title="User Successfully Created"
      subtitle={`Share these credentials with ${credentials.fullName}.`}
      maxWidth={440}
    >
      <div className="stack">
        <div className="modal-celebrate-icon">🎉</div>

        <div className="created-creds-box">
          <div className="cluster-between mb-2">
            <span className="text-muted text-sm">Username:</span>
            <strong className="text-sm font-bold">{credentials.username}</strong>
          </div>
          <div className="cluster-between mb-2">
            <span className="text-muted text-sm">Password:</span>
            <strong className="text-sm font-bold text-brand">
              {credentials.initialPassword || "••••••••"}
            </strong>
          </div>
          <div className="cluster-between">
            <span className="text-muted text-sm">Roles:</span>
            <span className="text-sm font-semibold capitalize">
              {credentials.roles.join(", ")}
            </span>
          </div>
        </div>

        <div className="cluster">
          <Button variant="secondary" onClick={handleCopy} fullWidth>
            {copied ? "✓ Copied!" : "Copy info"}
          </Button>
          <Button variant="primary" onClick={onClose} fullWidth>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreatedCredentialsModal;
