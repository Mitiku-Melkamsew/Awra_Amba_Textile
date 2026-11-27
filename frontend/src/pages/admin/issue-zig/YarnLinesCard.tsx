import { useMemo } from "react";
import { SearchableSelect } from "../../../components/common";
import { toTitleCase } from "../../../utils/formatters";
import type { YarnLineItem } from "./useIssueZig";

export interface YarnLinesCardProps {
  yarnLines: YarnLineItem[];
  lineCalculations: Array<{
    line: YarnLineItem;
    idx: number;
    variant: any;
    stock: number;
    qty: number;
    price: number;
    lineTotal: number;
    stockAfter: number;
    isExceeded: boolean;
    isMissingVariant: boolean;
    isInvalidQty: boolean;
  }>;
  yarnVariants: any[];
  handleYarnVariantChange: (lineId: string, variantIdStr: string) => void;
  handleQuantityChange: (lineId: string, qtyStr: string) => void;
  handleUnitPriceChange: (lineId: string, priceStr: string) => void;
  handleRemoveYarnLine: (id: string) => void;
  handleAddYarnLine: () => void;
  notes: string;
  setNotes: (val: string) => void;
}

function formatYarnName(yv: any) {
  const mat = toTitleCase(yv.yarn?.name ?? "Yarn");
  const col = toTitleCase(yv.color?.name ?? "Standard");
  return `${mat} · ${col}`;
}

export function YarnLinesCard({
  yarnLines,
  lineCalculations,
  yarnVariants,
  handleYarnVariantChange,
  handleQuantityChange,
  handleUnitPriceChange,
  handleRemoveYarnLine,
  handleAddYarnLine,
  notes,
  setNotes,
}: YarnLinesCardProps) {
  const yarnVariantOptions = useMemo(() => {
    return yarnVariants.map((y) => ({
      id: String(y.yarnVariantId),
      title: formatYarnName(y),
      badge: `${y.stockSnapshot ?? 0} pcs`,
      badgeColor:
        (y.stockSnapshot ?? 0) > 0
          ? { bg: "#dcfce7", text: "#166534" }
          : { bg: "#fee2e2", text: "#991b1b" },
    }));
  }, [yarnVariants]);

  return (
    <div
      style={{
        background: "var(--color-surface, #ffffff)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        borderRadius: "var(--radius-lg, 12px)",
        padding: "1.5rem",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.03))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--color-text, #0f172a)",
          }}
        >
          Yarn to give · የሚሰጥ ጥጥ
        </h2>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #64748b)" }}>
          Stock is checked as you type
        </span>
      </div>

      {/* Table Headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.1fr 1.1fr 1.6fr 40px",
          gap: "0.85rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--color-text-muted, #64748b)",
          marginBottom: "0.6rem",
          padding: "0 0.25rem",
        }}
      >
        <div>Yarn</div>
        <div>Quantity</div>
        <div>Price</div>
        <div>Stock after</div>
        <div />
      </div>

      {/* Table Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {yarnLines.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              textAlign: "center",
              background: "var(--color-surface-subtle, #f8fafc)",
              borderRadius: "var(--radius-sm, 8px)",
              border: "1px dashed var(--color-border-subtle, #cbd5e1)",
              color: "var(--color-text-muted, #64748b)",
              fontSize: "0.88rem",
            }}
          >
            No yarn lines added. This zig will be assigned without yarn. Click &ldquo;+ Add yarn line&rdquo; below to issue yarn.
          </div>
        ) : (
          lineCalculations.map((item) => {
            const { line, stock, isExceeded, isInvalidQty } = item;
            const hasStockProblem = isExceeded;
            const stockAfterNum = stock - item.qty;

            return (
              <div
                key={line.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1.1fr 1.1fr 1.6fr 40px",
                  gap: "0.85rem",
                  alignItems: "center",
                  background: "var(--color-surface, #ffffff)",
                  padding: "0.25rem 0",
                }}
              >
                {/* Yarn Dropdown */}
                <div>
                  <SearchableSelect
                    options={yarnVariantOptions}
                    value={line.yarnVariantId}
                    onChange={(val) => handleYarnVariantChange(line.id, val)}
                    placeholder="-- Choose yarn --"
                  />
                </div>

                {/* Quantity Input */}
                <div>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={line.quantity}
                    onChange={(e) => handleQuantityChange(line.id, e.target.value)}
                    placeholder="e.g. 40"
                    className="input"
                    style={{
                      height: 40,
                      fontWeight: 600,
                      borderColor: hasStockProblem ? "var(--color-danger, #f87171)" : undefined,
                      background: hasStockProblem ? "var(--color-danger-subtle, #fef2f2)" : undefined,
                      color: hasStockProblem ? "var(--color-danger-dark, #991b1b)" : undefined,
                    }}
                  />
                </div>

                {/* Price Column */}
                <div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={line.unitPrice}
                    onChange={(e) => handleUnitPriceChange(line.id, e.target.value)}
                    placeholder="ETB"
                    className="input yarn-price-input"
                  />
                </div>

                {/* Stock After Pill Indicator */}
                <div>
                  {!line.yarnVariantId ? (
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #94a3b8)" }}>—</span>
                  ) : isInvalidQty ? (
                    <span
                      className="badge badge--neutral"
                      style={{ fontSize: "12px", padding: "0.25rem 0.6rem" }}
                    >
                      {stock} in stock
                    </span>
                  ) : !isExceeded ? (
                    <span
                      className="badge badge--success"
                      style={{ fontSize: "12px", padding: "0.25rem 0.65rem", display: "inline-flex", gap: "0.25rem" }}
                    >
                      <span>✓</span> {stock} → {stockAfterNum}
                    </span>
                  ) : (
                    <span
                      className="badge badge--danger"
                      style={{ fontSize: "12px", padding: "0.25rem 0.65rem", display: "inline-flex", gap: "0.25rem" }}
                    >
                      <span>⚠</span> {stock > 0 ? `Only ${stock} in stock` : "0 in stock"}
                    </span>
                  )}
                </div>

                {/* Delete Icon */}
                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveYarnLine(line.id)}
                    title="Remove yarn line"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      color: "var(--color-text-muted, #94a3b8)",
                      padding: "0.25rem",
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Yarn Line Button */}
      <button
        type="button"
        onClick={handleAddYarnLine}
        className="btn"
        style={{
          width: "100%",
          marginTop: "1.25rem",
          padding: "0.75rem",
          border: "1.5px dashed var(--color-orange-200, #fed7aa)",
          background: "var(--color-orange-50, #fffaf5)",
          borderRadius: "var(--radius-sm, 8px)",
          color: "var(--color-primary, #c2410c)",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.35rem",
        }}
      >
        <span>+</span> Add yarn line
      </button>

      <div style={{ marginTop: "1rem" }}>
        <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #64748b)", marginBottom: "0.25rem" }}>
          Work order notes / special instructions (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Special order, expedited weave..."
          className="input"
          style={{ height: 38, fontSize: "0.85rem" }}
        />
      </div>
    </div>
  );
}
