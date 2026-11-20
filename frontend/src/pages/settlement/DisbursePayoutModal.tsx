import type { FormEvent } from "react";
import { Modal } from "../../components/common";

export interface DisbursePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutLoading: boolean;
  payoutError: string;
  committedPreviewId: string;
  committedWeaverCount: number;
  committedTotal: number;
  payoutMethod: string;
  setPayoutMethod: (val: string) => void;
  payoutNotes: string;
  setPayoutNotes: (val: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
}

export function DisbursePayoutModal({
  isOpen,
  onClose,
  payoutLoading,
  payoutError,
  committedPreviewId,
  committedWeaverCount,
  committedTotal,
  payoutMethod,
  setPayoutMethod,
  payoutNotes,
  setPayoutNotes,
  onSubmit,
}: DisbursePayoutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!payoutLoading) onClose();
      }}
      title="💳 Disburse Batch Payment / ክፍያ ፈጽም"
      maxWidth={500}
    >
      <div>
        {payoutError && (
          <div
            className="alert alert-danger"
            style={{
              background: "var(--color-danger-subtle, #fee2e2)",
              border: "1px solid var(--color-danger-border, #fca5a5)",
              color: "var(--color-danger, #b91c1c)",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm, 8px)",
              marginBottom: "1rem",
              fontSize: "13px",
            }}
          >
            <span>⚠️</span> {payoutError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              background: "var(--color-surface-subtle, #f8fafc)",
              padding: "0.85rem",
              borderRadius: "var(--radius-sm, 8px)",
              fontSize: "13px",
              border: "1px solid var(--color-border-subtle, #e2e8f0)",
            }}
          >
            <div>
              Batch Reference: <strong>#{committedPreviewId}</strong>
            </div>
            <div>
              Artisans Count: <strong>{committedWeaverCount} weavers</strong>
            </div>
            <div>
              Total Payout: <strong>{Math.round(committedTotal).toLocaleString()} ETB</strong>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "12.5px", marginBottom: "0.25rem" }}>
              Payment Method / የክፍያ ዘዴ
            </label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="select"
              style={{ width: "100%", padding: "0.6rem 0.75rem" }}
            >
              <option value="cash">Cash (ጥሬ ገንዘብ)</option>
              <option value="bank_transfer">Commercial Bank of Ethiopia (CBE)</option>
              <option value="telebirr">Telebirr (ቴሌብር)</option>
              <option value="coop_bank">Cooperative Bank (ኅብረት ሥራ ባንክ)</option>
              <option value="check">Check (ቼክ)</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "12.5px", marginBottom: "0.25rem" }}>
              Payment Notes / ማስታወሻ (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cash Voucher #45"
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.6rem 0.75rem" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={payoutLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: "#059669", borderColor: "#059669" }}
              disabled={payoutLoading}
            >
              {payoutLoading ? "Disbursing Payment…" : "✓ Confirm Disbursement / አጽድቅ"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
