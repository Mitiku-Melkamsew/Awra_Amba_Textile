import type { FormEvent } from "react";
import { Modal } from "../../../components/common";

export interface AddWeaverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  addError: string;
  saving: boolean;
}

export function AddWeaverModal({
  isOpen,
  onClose,
  onSubmit,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  addError,
  saving,
}: AddWeaverModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="+ Register New Weaver"
      maxWidth={480}
    >
      <form onSubmit={onSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">First name / ስም</label>
            <input
              type="text"
              required
              placeholder="e.g. Abebe"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              className="input"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Last name / የአባት ስም</label>
            <input
              type="text"
              required
              placeholder="e.g. Alemu"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="form-group mb-4">
          <label className="form-label">Phone number / ስልክ</label>
          <input
            type="tel"
            placeholder="+251 9xx xxx xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
          />
        </div>

        {addError && (
          <div className="error-msg" style={{ marginBottom: "1rem" }}>
            <span>⚠️</span> {addError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
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
            disabled={saving}
          >
            {saving ? "Creating…" : "Create Weaver"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
