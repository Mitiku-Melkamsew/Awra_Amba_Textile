import { useMemo } from "react";
import type { FabricVariant } from "../api";
import {
  applyFabricVariantToLine,
  createFabricLineDraft,
  type FabricLineDraft,
} from "../utils/fabricLines";
import { fabricVariantName } from "../utils/variantNames";
import { VariantSearch } from "./VariantSearch";

interface FabricLinesEditorProps {
  lines: FabricLineDraft[];
  onChange: (lines: FabricLineDraft[]) => void;
  fabricVariants: FabricVariant[];
  txnType?: string;
}

function updateLine(
  lines: FabricLineDraft[],
  id: string,
  patch: Partial<FabricLineDraft>,
): FabricLineDraft[] {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

/**
 * Multi-line fabric editor. Every line must select an existing fabricVariantId
 * (schema field on DirectTransactionLine / WorkOrder). No productId path.
 */
export function FabricLinesEditor({
  lines,
  onChange,
  fabricVariants,
  txnType,
}: FabricLinesEditorProps) {
  const isSale = txnType === "fabric_sale_to_merchant";

  const activeVariants = useMemo(
    () => fabricVariants.filter((v) => v.isActive !== false),
    [fabricVariants],
  );

  const inStockVariants = useMemo(
    () => activeVariants.filter((v) => Number((v as any).stockSnapshot ?? 0) > 0),
    [activeVariants],
  );

  const outOfStockVariants = useMemo(
    () => activeVariants.filter((v) => Number((v as any).stockSnapshot ?? 0) <= 0),
    [activeVariants],
  );

  function handleSelectVariant(lineId: string, variant: FabricVariant) {
    const price = isSale
      ? ((variant as any).sellingPrice ??
          (variant as any).fabric?.prices?.[0]?.sellingPrice ??
          (variant as any).basePrice)
      : ((variant as any).basePrice ??
          (variant as any).fabric?.prices?.[0]?.weaverRate ??
          (variant as any).basePrice);

    onChange(
      lines.map((line) =>
        line.id === lineId
          ? {
              ...applyFabricVariantToLine(line, variant),
              unitPrice: price != null ? String(price) : line.unitPrice,
            }
          : line,
      ),
    );
  }

  function addLine() {
    const draft = createFabricLineDraft();
    const pool = isSale ? inStockVariants : activeVariants;
    if (pool[0]) {
      const first = pool[0];
      const price = isSale
        ? ((first as any).sellingPrice ?? (first as any).basePrice)
        : ((first as any).basePrice ??
            (first as any).fabric?.prices?.[0]?.weaverRate);
      Object.assign(draft, applyFabricVariantToLine(draft, first));
      if (price != null) draft.unitPrice = String(price);
      draft.quantity = "1";
    }
    onChange([...lines, draft]);
  }

  return (
    <div className="fabric-lines-editor">
      {lines.map((line, index) => {
        const selectedVariant = activeVariants.find(
          (v) => String(v.fabricVariantId) === line.fabricVariantId,
        );
        const availableStock = selectedVariant
          ? Number((selectedVariant as any).stockSnapshot ?? 0)
          : undefined;

        return (
          <div
            key={line.id}
            className="card"
            style={{ marginBottom: "0.75rem", padding: "0.85rem 1rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.6rem",
              }}
            >
              <strong style={{ fontSize: "0.9rem" }}>Line {index + 1}</strong>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn-link danger"
                  onClick={() =>
                    onChange(lines.filter((l) => l.id !== line.id))
                  }
                  style={{
                    fontSize: "12px",
                    color: "var(--red, #dc2626)",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                  }}
                >
                  ✕ Remove
                </button>
              )}
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.35rem",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                }}
              >
                Fabric variant <span style={{ color: "var(--red, #dc2626)" }}>*</span>
              </label>

              {isSale ? (
                <select
                  value={line.fabricVariantId}
                  onChange={(e) => {
                    const variant = activeVariants.find(
                      (v) => String(v.fabricVariantId) === e.target.value,
                    );
                    if (variant) handleSelectVariant(line.id, variant);
                    else
                      onChange(
                        updateLine(lines, line.id, {
                          fabricVariantId: "",
                          unitPrice: "",
                        }),
                      );
                  }}
                  style={{
                    width: "100%",
                    height: 42,
                    fontSize: "0.95rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border, #cbd5e1)",
                    padding: "0 0.75rem",
                  }}
                >
                  <option value="">
                    -- Choose fabric variant ({inStockVariants.length} in stock) --
                  </option>
                  {inStockVariants.length > 0 && (
                    <optgroup label="In stock">
                      {inStockVariants.map((v) => {
                        const price =
                          (v as any).sellingPrice ?? (v as any).basePrice;
                        return (
                          <option key={v.fabricVariantId} value={v.fabricVariantId}>
                            {fabricVariantName(v)} [{v.sku}] —{" "}
                            {Number((v as any).stockSnapshot)} pcs
                            {price != null ? ` — ETB ${price}` : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {outOfStockVariants.length > 0 && (
                    <optgroup label="Out of stock">
                      {outOfStockVariants.map((v) => (
                        <option
                          key={v.fabricVariantId}
                          value={v.fabricVariantId}
                          disabled
                        >
                          {fabricVariantName(v)} [{v.sku}] — 0 pcs
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <VariantSearch
                  label="Fabric variant"
                  items={activeVariants}
                  getId={(v) => String(v.fabricVariantId)}
                  getLabel={(v) => fabricVariantName(v)}
                  getSearchText={(v) => v.sku ?? ""}
                  selectedId={line.fabricVariantId}
                  onSelect={(v) => handleSelectVariant(line.id, v)}
                  onClear={() =>
                    onChange(
                      updateLine(lines, line.id, {
                        fabricVariantId: "",
                      }),
                    )
                  }
                  placeholder="Search fabric variant (SKU, name, color…)"
                />
              )}

              {selectedVariant && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1rem",
                    background: "var(--bg-subtle, #f8fafc)",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "6px",
                    marginTop: "0.5rem",
                    fontSize: "0.85rem",
                    border: "1px solid var(--border-light, #e2e8f0)",
                  }}
                >
                  <div>
                    <span className="muted">SKU:</span>{" "}
                    <strong style={{ fontFamily: "monospace" }}>
                      {selectedVariant.sku}
                    </strong>
                  </div>
                  <div>
                    <span className="muted">Fabric:</span>{" "}
                    <strong>
                      {(selectedVariant as any).fabric?.name ?? "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="muted">Warp:</span>{" "}
                    <strong>
                      {selectedVariant.warpColor?.name ?? "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="muted">Weft:</span>{" "}
                    <strong>
                      {selectedVariant.weftColor?.name ?? "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="muted">Design:</span>{" "}
                    <strong>{selectedVariant.design?.name ?? "—"}</strong>
                  </div>
                  {availableStock != null && (
                    <div>
                      <span className="muted">Stock:</span>{" "}
                      <strong
                        style={{
                          color:
                            availableStock > 0
                              ? "#15803d"
                              : "var(--red, #dc2626)",
                        }}
                      >
                        {availableStock} pcs
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="field-row">
              <div className="field">
                <label>Quantity</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={line.quantity}
                  onChange={(e) =>
                    onChange(
                      updateLine(lines, line.id, { quantity: e.target.value }),
                    )
                  }
                />
                {isSale &&
                  availableStock != null &&
                  availableStock > 0 && (
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() =>
                        onChange(
                          updateLine(lines, line.id, {
                            quantity: String(availableStock),
                          }),
                        )
                      }
                      style={{
                        fontSize: "12px",
                        marginTop: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Use all stock ({availableStock})
                    </button>
                  )}
              </div>
              <div className="field">
                <label>Unit price</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={line.unitPrice}
                  onChange={(e) =>
                    onChange(
                      updateLine(lines, line.id, {
                        unitPrice: e.target.value,
                      }),
                    )
                  }
                />
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" className="secondary" onClick={addLine}>
        + Add fabric line
      </button>
    </div>
  );
}
