import type { TxnCategory } from "./useTransactionForm";

export interface TransactionCategoryPickerProps {
  category: TxnCategory;
  onSelectCategory: (newCat: TxnCategory) => void;
}

const CATEGORIES: Array<{
  id: TxnCategory;
  title: string;
  sub: string;
}> = [
  {
    id: "yarn_purchase",
    title: "Buy yarn · ግዢ",
    sub: "From a supplier",
  },
  {
    id: "fabric_purchase_from_weaver",
    title: "Buy fabric · ግዢ",
    sub: "From a weaver",
  },
  {
    id: "yarn_sale_to_weaver",
    title: "Sell yarn · ሽያጭ",
    sub: "To a weaver",
  },
  {
    id: "fabric_sale_to_merchant",
    title: "Sell fabric · ሽያጭ",
    sub: "To a merchant",
  },
];

export function TransactionCategoryPicker({
  category,
  onSelectCategory,
}: TransactionCategoryPickerProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      {CATEGORIES.map((c) => {
        const isSelected = category === c.id;
        return (
          <div
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            style={{
              position: "relative",
              background: "var(--color-surface, #ffffff)",
              border: isSelected
                ? "2px solid var(--color-primary, #c2410c)"
                : "1px solid var(--color-border-subtle, #e2e8f0)",
              borderRadius: "var(--radius-lg, 12px)",
              padding: "1.1rem 1.25rem",
              cursor: "pointer",
              boxShadow: isSelected
                ? "var(--shadow-md, 0 2px 8px rgba(194, 65, 12, 0.08))"
                : "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.02))",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: "15px",
                color: "var(--color-text, #0f172a)",
                marginBottom: "0.25rem",
              }}
            >
              {c.title}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted, #64748b)" }}>
              {c.sub}
            </div>

            {isSelected && (
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  color: "var(--color-text, #0f172a)",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
