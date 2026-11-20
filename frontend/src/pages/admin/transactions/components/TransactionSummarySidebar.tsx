import { Link } from "react-router-dom";
import type { TxnCategory } from "./useTransactionForm";

export interface TransactionSummarySidebarProps {
  category: TxnCategory;
  categoryLabel: string;
  counterpartySummaryName: string;
  date: string;
  linesCount: number;
  totalQuantity: number;
  calculatedGrandTotal: number;
  saving: boolean;
  onSaveTransaction: () => void;
}

export function TransactionSummarySidebar({
  category,
  categoryLabel,
  counterpartySummaryName,
  date,
  linesCount,
  totalQuantity,
  calculatedGrandTotal,
  saving,
  onSaveTransaction,
}: TransactionSummarySidebarProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: "1.5rem",
        background: "var(--color-surface, #ffffff)",
        borderRadius: "var(--radius-lg, 12px)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        boxShadow: "var(--shadow-md, 0 1px 4px rgba(0,0,0,0.05))",
        padding: "1.5rem",
      }}
    >
      <h3
        style={{
          margin: "0 0 1.25rem",
          fontSize: "18px",
          fontWeight: 800,
          color: "var(--color-text, #0f172a)",
        }}
      >
        Summary
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          fontSize: "14px",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Type</span>
          <span style={{ fontWeight: 600, color: "var(--color-text, #0f172a)" }}>
            {categoryLabel}
          </span>
        </div>

        {category !== "yarn_purchase" && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>
              {category === "fabric_sale_to_merchant" ? "Merchant" : "Weaver"}
            </span>
            <span style={{ fontWeight: 600, color: "var(--color-text, #0f172a)" }}>
              [{counterpartySummaryName}]
            </span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Date</span>
          <span style={{ fontWeight: 600, color: "var(--color-text, #0f172a)" }}>{date}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-text-muted, #64748b)" }}>Items</span>
          <span style={{ fontWeight: 600, color: "var(--color-text, #0f172a)" }}>
            {linesCount} · {totalQuantity} pcs
          </span>
        </div>

        <div style={{ borderTop: "1px solid var(--color-border-subtle, #e2e8f0)", margin: "0.5rem 0" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: "16px",
              color: "var(--color-text, #0f172a)",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: "20px",
              color: "var(--color-primary, #c2410c)",
            }}
          >
            [{calculatedGrandTotal.toLocaleString()}] ETB
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <button
          type="button"
          onClick={onSaveTransaction}
          disabled={saving}
          className="btn btn-primary"
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          {saving ? "Saving…" : "Record transaction"}
        </button>

        <Link
          to="/admin/transactions"
          className="btn btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "0.65rem",
            fontSize: "13.5px",
            textDecoration: "none",
          }}
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
