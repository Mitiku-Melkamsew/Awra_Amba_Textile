import { SearchableVariantSelect } from "./SearchableVariantSelect";
import type { LineItemDraft, TxnCategory } from "./useTransactionForm";

export interface TransactionLineItemsTableProps {
  isFabric: boolean;
  isSale: boolean;
  category: TxnCategory;
  lines: LineItemDraft[];
  fabricVariants: any[];
  yarnVariants: any[];
  handleUpdateLine: (id: string, field: keyof LineItemDraft, val: string) => void;
  handleRemoveLine: (id: string) => void;
  handleAddLine: () => void;
  handleOpenAddVariantModal: (lineId?: string, query?: string) => void;
}

export function TransactionLineItemsTable({
  isFabric,
  isSale,
  category,
  lines,
  fabricVariants,
  yarnVariants,
  handleUpdateLine,
  handleRemoveLine,
  handleAddLine,
  handleOpenAddVariantModal,
}: TransactionLineItemsTableProps) {
  return (
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 800,
            color: "var(--color-text, #0f172a)",
          }}
        >
          Items
        </h3>
        {(category === "yarn_purchase" ||
          category === "fabric_purchase_from_weaver") && (
          <button
            type="button"
            onClick={() => handleOpenAddVariantModal()}
            className="btn btn-primary"
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            + Add new {isFabric ? "fabric" : "yarn"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {lines.map((l, index) => {
          const selectedVariant = isFabric
            ? fabricVariants.find(
                (f) => String(f.fabricVariantId) === l.variantId
              )
            : yarnVariants.find(
                (y) => String(y.yarnVariantId) === l.variantId
              );

          const currentStock = Number(
            (selectedVariant as any)?.stockSnapshot ??
              selectedVariant?.currentStock ??
              0
          );
          const requestedQty = parseFloat(l.quantity) || 0;
          const unitPriceNum = parseFloat(l.unitPrice) || 0;
          const lineTotal = requestedQty * unitPriceNum;
          const afterStock = isSale
            ? currentStock - requestedQty
            : currentStock + requestedQty;

          return (
            <div
              key={l.id}
              style={{
                paddingBottom: "1rem",
                borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.9fr 0.65fr 1fr 0.8fr 36px",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                {/* Variant Searchable Input */}
                <div>
                  {index === 0 && (
                    <label
                      className="form-label"
                      style={{ fontSize: "12px", color: "var(--color-text-muted, #64748b)", marginBottom: "0.25rem" }}
                    >
                      {isFabric ? "Fabric variant" : "Yarn variant"}
                    </label>
                  )}
                  <SearchableVariantSelect
                    isFabric={isFabric}
                    canAddNew={
                      category === "yarn_purchase" ||
                      category === "fabric_purchase_from_weaver"
                    }
                    isSale={isSale}
                    selectedVariantId={l.variantId}
                    fabricVariants={fabricVariants}
                    yarnVariants={yarnVariants}
                    onSelect={(id) => handleUpdateLine(l.id, "variantId", id)}
                    onAddNew={(q) => handleOpenAddVariantModal(l.id, q)}
                  />
                </div>

                {/* Qty */}
                <div>
                  {index === 0 && (
                    <label
                      className="form-label"
                      style={{ fontSize: "12px", color: "var(--color-text-muted, #64748b)", marginBottom: "0.25rem" }}
                    >
                      Qty
                    </label>
                  )}
                  <input
                    type="number"
                    min="1"
                    value={l.quantity}
                    onChange={(e) =>
                      handleUpdateLine(l.id, "quantity", e.target.value)
                    }
                    className="input"
                    style={{ height: 38, fontSize: "13.5px" }}
                  />
                </div>

                {/* Unit Price */}
                <div>
                  {index === 0 && (
                    <label
                      className="form-label"
                      style={{ fontSize: "12px", color: "var(--color-text-muted, #64748b)", marginBottom: "0.25rem" }}
                    >
                      Unit price
                    </label>
                  )}
                  <input
                    type="number"
                    step="any"
                    value={l.unitPrice}
                    onChange={(e) =>
                      handleUpdateLine(l.id, "unitPrice", e.target.value)
                    }
                    placeholder="Price"
                    className="input"
                    style={{ height: 38, fontSize: "13.5px" }}
                  />
                </div>

                {/* Total */}
                <div>
                  {index === 0 && (
                    <label
                      className="form-label"
                      style={{ fontSize: "12px", color: "var(--color-text-muted, #64748b)", marginBottom: "0.25rem" }}
                    >
                      Total
                    </label>
                  )}
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "var(--color-text, #0f172a)",
                      paddingTop: index === 0 ? "0.25rem" : "0",
                    }}
                  >
                    [{lineTotal > 0 ? lineTotal.toLocaleString() : "0"}]
                  </div>
                </div>

                {/* Delete */}
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: index === 0 ? "1.25rem" : "0",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(l.id)}
                    disabled={lines.length <= 1}
                    style={{
                      background: "none",
                      border: "none",
                      color: lines.length <= 1 ? "var(--color-border-subtle, #cbd5e1)" : "var(--color-text-muted, #94a3b8)",
                      cursor: lines.length <= 1 ? "not-allowed" : "pointer",
                      fontSize: "16px",
                      padding: "0.25rem",
                    }}
                    title="Delete item"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Stock Indicator Badge */}
              {selectedVariant && (
                <div style={{ marginTop: "0.5rem" }}>
                  {isSale && afterStock < 0 ? (
                    <span
                      className="badge badge--danger"
                      style={{ padding: "0.2rem 0.6rem", display: "inline-flex", gap: "0.25rem", fontSize: "12px" }}
                    >
                      ⚠️ Only [{currentStock}] in stock (shortage of [{requestedQty - currentStock}])
                    </span>
                  ) : (
                    <span
                      className="badge badge--success"
                      style={{ padding: "0.2rem 0.6rem", display: "inline-flex", gap: "0.25rem", fontSize: "12px" }}
                    >
                      ✓ [{currentStock}] in stock → [{afterStock}] after
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* + Add item Button */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
          <button
            type="button"
            onClick={handleAddLine}
            className="btn btn-secondary"
            style={{
              flex: 1,
              padding: "0.65rem",
              fontSize: "13.5px",
              fontWeight: 600,
              borderStyle: "dashed",
            }}
          >
            + Add item
          </button>
        </div>
      </div>
    </div>
  );
}
