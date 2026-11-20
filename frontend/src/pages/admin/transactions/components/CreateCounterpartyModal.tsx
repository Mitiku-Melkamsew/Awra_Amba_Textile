import type { FormEvent } from "react";
import { Modal } from "../../../../components/common";
import type { TxnCategory } from "./useTransactionForm";

export interface CreateCounterpartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: TxnCategory;
  newPartyName: string;
  setNewPartyName: (val: string) => void;
  newPartyPhone: string;
  setNewPartyPhone: (val: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
}

export function CreateCounterpartyModal({
  isOpen,
  onClose,
  category,
  newPartyName,
  setNewPartyName,
  newPartyPhone,
  setNewPartyPhone,
  onSubmit,
}: CreateCounterpartyModalProps) {
  const partyType =
    category === "fabric_sale_to_merchant"
      ? "Merchant"
      : category === "yarn_purchase"
      ? "Supplier"
      : "Weaver";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add New ${partyType}`}
      subtitle={`Enter details to create and select this new ${partyType.toLowerCase()}.`}
      maxWidth={440}
    >
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        <div>
          <label className="form-label" style={{ fontSize: "12.5px", marginBottom: "0.25rem" }}>
            Name / Business Name
          </label>
          <input
            type="text"
            required
            value={newPartyName}
            onChange={(e) => setNewPartyName(e.target.value)}
            placeholder="e.g. Merkato Textile Trader"
            className="input"
            style={{ fontSize: "14px" }}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: "12.5px", marginBottom: "0.25rem" }}>
            Phone Number
          </label>
          <input
            type="text"
            value={newPartyPhone}
            onChange={(e) => setNewPartyPhone(e.target.value)}
            placeholder="e.g. 0911234567"
            className="input"
            style={{ fontSize: "14px" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: "14px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ fontSize: "14px" }}
          >
            Save & Select
          </button>
        </div>
      </form>
    </Modal>
  );
}
