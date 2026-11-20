import { useMemo } from "react";
import type { Weaver } from "../../../../api";
import { SearchableSelect } from "../../../../components/common";
import type { TxnCategory } from "./useTransactionForm";

export interface TransactionCounterpartySectionProps {
  category: TxnCategory;
  merchantUserId: string;
  setMerchantUserId: (val: string) => void;
  weaverUserId: string;
  setWeaverUserId: (val: string) => void;
  merchants: Array<{ userId: number; companyName: string | null; contactPhone: string }>;
  weavers: Weaver[];
  onOpenAddPartyModal: (initialName?: string) => void;
  date: string;
  setDate: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
}

export function TransactionCounterpartySection({
  category,
  merchantUserId,
  setMerchantUserId,
  weaverUserId,
  setWeaverUserId,
  merchants,
  weavers,
  onOpenAddPartyModal,
  date,
  setDate,
  notes,
  setNotes,
}: TransactionCounterpartySectionProps) {
  const merchantOptions = useMemo(() => {
    return merchants.map((m) => ({
      id: String(m.userId),
      title: m.companyName || `Merchant #${m.userId}`,
      subtitle: m.contactPhone ? `Phone: ${m.contactPhone}` : undefined,
    }));
  }, [merchants]);

  const weaverOptions = useMemo(() => {
    return weavers.map((w) => ({
      id: String(w.userId),
      title: w.fullName,
      subtitle: w.phone ? `Phone: ${w.phone}` : undefined,
    }));
  }, [weavers]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Counterparty bar (Only for Weaver / Merchant transactions; Buy yarn selects supplier per variant) */}
      {category !== "yarn_purchase" && (
        <div
          style={{
            background: "var(--color-surface, #ffffff)",
            borderRadius: "var(--radius-lg, 12px)",
            border: "1px solid var(--color-border-subtle, #e2e8f0)",
            boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.4rem",
            }}
          >
            <label className="form-label" style={{ fontSize: "12.5px", fontWeight: 700 }}>
              {category === "fabric_sale_to_merchant"
                ? "Merchant · ገዢ ነጋዴ"
                : "Weaver · ሸማኔ"}
            </label>
            <button
              type="button"
              onClick={() => onOpenAddPartyModal()}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--color-primary, #c2410c)",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add a new{" "}
              {category === "fabric_sale_to_merchant" ? "merchant" : "weaver"}
            </button>
          </div>

          {category === "fabric_sale_to_merchant" ? (
            <SearchableSelect
              value={merchantUserId}
              onChange={(val) => setMerchantUserId(val)}
              options={merchantOptions}
              placeholder="Search merchant by name or phone…"
              onAddNew={(q) => onOpenAddPartyModal(q)}
              addNewLabel="Add merchant"
              required
            />
          ) : (
            <SearchableSelect
              value={weaverUserId}
              onChange={(val) => setWeaverUserId(val)}
              options={weaverOptions}
              placeholder="Search weaver by name or phone…"
              onAddNew={(q) => onOpenAddPartyModal(q)}
              addNewLabel="Add weaver"
              required
            />
          )}
        </div>
      )}

      {/* Merged Card: Date & Notes */}
      <div
        style={{
          background: "var(--color-surface, #ffffff)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--color-border-subtle, #e2e8f0)",
          boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          <div>
            <label className="form-label" style={{ fontSize: "12.5px", fontWeight: 700, marginBottom: "0.35rem" }}>
              Transaction date · ቀን
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              style={{ height: 38 }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "12.5px", fontWeight: 700, marginBottom: "0.35rem" }}>
              Notes / Remark · ማስታወሻ
            </label>
            <input
              type="text"
              placeholder="Optional notes or references for this transaction…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              style={{ height: 38 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
