import { useEffect, useMemo } from "react";
import type { FabricVariant } from "../api";
import {
  applyFabricVariantToLine,
  createFabricLineDraft,
  DETAILS_EDITED,
  type FabricCatalogLookup,
  type FabricLineDraft,
} from "../utils/fabricLines";
import { fabricVariantName } from "../utils/variantNames";
import { VariantSearch } from "./VariantSearch";

interface FabricLinesEditorProps {
  lines: FabricLineDraft[];
  onChange: (lines: FabricLineDraft[]) => void;
  lookup: FabricCatalogLookup;
  fabricVariants: FabricVariant[];
  defaultEntryMode?: "catalog" | "variant";
  txnType?: string;
}

function updateLine(
  lines: FabricLineDraft[],
  id: string,
  patch: Partial<FabricLineDraft>,
): FabricLineDraft[] {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

export function FabricLinesEditor({
  lines,
  onChange,
  lookup,
  fabricVariants,
  defaultEntryMode = "catalog",
  txnType,
}: FabricLinesEditorProps) {
  const isSale = txnType === "fabric_sale";

  const fabricProducts = useMemo(
    () => (lookup.products?.length ? lookup.products : []).filter((p) => p.category === "fabric" || !p.category),
    [lookup.products],
  );

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

  // Default non-sale catalog line initialization
  useEffect(() => {
    if (isSale || fabricProducts.length === 0) return;
    const needsUpdate = lines.some((l) => !l.productId && l.entryMode !== "variant");
    if (needsUpdate) {
      const p0 = fabricProducts[0];
      const p0Price =
        txnType === "fabric_purchase"
          ? ((p0 as any).weaverRate ?? p0.basePrice)
          : p0.basePrice;
      onChange(
        lines.map((l) => {
          if (l.productId || l.entryMode === "variant") return l;
          return {
            ...l,
            productId: String(p0.productId),
            warpColorId: l.warpColorId || (lookup.colors[0] ? String(lookup.colors[0].colorId) : ""),
            weftColorId: l.weftColorId || (lookup.colors[0] ? String(lookup.colors[0].colorId) : ""),
            designId: l.designId || (lookup.designs[0] ? String(lookup.designs[0].designId) : ""),
            unitPrice: l.unitPrice || (p0Price ? String(p0Price) : ""),
          };
        }),
      );
    }
  }, [isSale, lookup, fabricProducts, lines, onChange, txnType]);

  function addLine() {
    const draft = createFabricLineDraft(lookup, isSale ? "variant" : defaultEntryMode);
    // If sale and there's an in-stock variant, pre-select it
    if (isSale && inStockVariants.length > 0) {
      const first = inStockVariants[0];
      const autoPrice = (first as any).sellingPrice ?? (first as any).product?.sellingPrice ?? first.basePrice;
      draft.entryMode = "variant";
      draft.fabricVariantId = String(first.fabricVariantId);
      draft.productId = String(first.fabricId ?? first.fabric?.fabricId ?? "");
      draft.unitPrice = autoPrice ? String(autoPrice) : "";
      draft.quantity = "1";
    }
    onChange([...lines, draft]);
  }

  function handleSelectVariant(lineId: string, variant: FabricVariant) {
    const autoPrice = isSale
      ? ((variant as any).sellingPrice ?? (variant as any).product?.sellingPrice ?? variant.basePrice)
      : ((variant as any).weaverRate ?? (variant as any).product?.weaverRate ?? variant.basePrice);

    onChange(
      lines.map((l) =>
        l.id === lineId
          ? {
              ...applyFabricVariantToLine(l, variant),
              entryMode: "variant",
              fabricVariantId: String(variant.fabricVariantId),
              unitPrice: autoPrice ? String(autoPrice) : l.unitPrice,
              quantity: l.quantity && Number(l.quantity) > 0 ? l.quantity : "1",
            }
          : l,
      ),
    );
  }

  return (
    <div className="fabric-lines-editor">
      {isSale && inStockVariants.length === 0 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            marginBottom: "1rem",
            color: "#92400e",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          <div>
            <strong>No fabric inventory available:</strong> There are currently 0 fabric pieces in stock. You must record fabric returns from weavers or purchase fabric before completing a sale.
          </div>
        </div>
      )}

      {lines.map((line, index) => {
        const selectedVariant = fabricVariants.find(
          (v) => String(v.fabricVariantId) === line.fabricVariantId,
        );
        const selectedProduct = fabricProducts.find(
          (p) => String(p.productId) === line.productId,
        );
        const availableStock = selectedVariant ? Number((selectedVariant as any).stockSnapshot ?? 0) : null;
        const qtyNum = Number(line.quantity || 0);
        const unitPriceNum = Number(line.unitPrice || 0);
        const lineSubtotal = Math.round(qtyNum * unitPriceNum * 100) / 100;
        const exceedsStock = isSale && availableStock !== null && qtyNum > availableStock;

        return (
          <div
            key={line.id}
            className="yarn-line-row"
            style={{
              background: "var(--card-bg, #ffffff)",
              border: exceedsStock ? "1.5px solid var(--red, #dc2626)" : "1px solid var(--border, #e2e8f0)",
              borderRadius: "10px",
              padding: "1rem",
              marginBottom: "1rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {/* Row Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--border-light, #f1f5f9)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main, #0f172a)" }}>
                  Item #{index + 1}
                </span>
                {isSale && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "12px",
                    }}
                  >
                    Sale Item
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {availableStock !== null && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: availableStock <= 0 ? "var(--red, #dc2626)" : "#15803d",
                      background: availableStock <= 0 ? "#fef2f2" : "#f0fdf4",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      border: `1px solid ${availableStock <= 0 ? "#fecaca" : "#bbf7d0"}`,
                    }}
                  >
                    Available: <strong>{availableStock} pcs</strong>
                  </span>
                )}

                {lines.length > 1 && (
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={() => onChange(lines.filter((l) => l.id !== line.id))}
                    style={{ fontSize: "12px", color: "var(--red, #dc2626)", cursor: "pointer", background: "none", border: "none" }}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>

            {/* If Sale: Dedicated Variant Selection (Only Available Variants) */}
            {isSale ? (
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.88rem" }}>
                  Select Available Fabric / የሚሸጠውን ጨርቅ ይምረጡ <span style={{ color: "var(--red, #dc2626)" }}>*</span>
                </label>
                <select
                  value={line.fabricVariantId}
                  onChange={(e) => {
                    const variant = activeVariants.find((v) => String(v.fabricVariantId) === e.target.value);
                    if (variant) {
                      handleSelectVariant(line.id, variant);
                    } else {
                      onChange(
                        updateLine(lines, line.id, {
                          entryMode: "variant",
                          fabricVariantId: "",
                          unitPrice: "",
                        }),
                      );
                    }
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
                    -- Choose an available fabric variant ({inStockVariants.length} in stock) --
                  </option>
                  {inStockVariants.length > 0 && (
                    <optgroup label="🟢 Ready in Stock (Available to Sell)">
                      {inStockVariants.map((v) => {
                        const price = (v as any).sellingPrice ?? (v as any).product?.sellingPrice ?? v.basePrice;
                        return (
                          <option key={v.fabricVariantId} value={v.fabricVariantId}>
                            {fabricVariantName(v)} [{v.sku}] — 🟢 {Number((v as any).stockSnapshot)} pcs in stock — ETB {price}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {outOfStockVariants.length > 0 && (
                    <optgroup label="🔴 Out of Stock (0 Available)">
                      {outOfStockVariants.map((v) => (
                        <option key={v.fabricVariantId} value={v.fabricVariantId} disabled>
                          {fabricVariantName(v)} [{v.sku}] — 0 pcs in stock
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Selected Variant Summary Card */}
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
                      <span className="muted">SKU:</span> <strong style={{ fontFamily: "monospace" }}>{selectedVariant.sku}</strong>
                    </div>
                    <div>
                      <span className="muted">Warp / ውርፍ:</span> <strong>{selectedVariant.warpColor?.name ?? "Standard"}</strong>
                    </div>
                    <div>
                      <span className="muted">Weft / ስፍ:</span> <strong>{selectedVariant.weftColor?.name ?? "Standard"}</strong>
                    </div>
                    <div>
                      <span className="muted">Design / ዲዛይን:</span> <strong>{selectedVariant.design?.name ?? "Standard"}</strong>
                    </div>
                    <div>
                      <span className="muted">Stock:</span>{" "}
                      <strong style={{ color: availableStock && availableStock > 0 ? "#15803d" : "var(--red, #dc2626)" }}>
                        {availableStock} pcs
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Non-Sale Mode (e.g. Fabric Purchase from Weaver): Support both Variant Search & Custom Weave Creation */
              <>
                <VariantSearch
                  label="Find existing fabric / ጨርቅ ፈልግ"
                  placeholder="Type SKU or name, e.g. medebegna-biret"
                  items={fabricVariants}
                  getId={(v) => String(v.fabricVariantId)}
                  getLabel={(v) => `${fabricVariantName(v)} (${(v as any).stockSnapshot ?? 0} in stock)`}
                  getSearchText={(v) => v.sku}
                  selectedId={line.entryMode === "variant" ? line.fabricVariantId : ""}
                  onSelect={(variant) => handleSelectVariant(line.id, variant)}
                  onClear={() => onChange(updateLine(lines, line.id, { ...DETAILS_EDITED }))}
                />
                <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
                  Not in the list? Specify custom fabric details below:
                </p>

                <div className="form-row">
                  <label>
                    Product / ዓይነት
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const product = fabricProducts.find((p) => String(p.productId) === e.target.value);
                        const autoPrice = (product as any)?.weaverRate ?? product?.basePrice;
                        onChange(
                          updateLine(lines, line.id, {
                            ...DETAILS_EDITED,
                            productId: e.target.value,
                            unitPrice: autoPrice ? String(autoPrice) : line.unitPrice,
                          }),
                        );
                      }}
                    >
                      {fabricProducts.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Design / ዲዛይን
                    <select
                      value={line.designId}
                      onChange={(e) =>
                        onChange(updateLine(lines, line.id, { ...DETAILS_EDITED, designId: e.target.value }))
                      }
                    >
                      <option value="">None</option>
                      {lookup.designs.map((d) => (
                        <option key={d.designId} value={d.designId}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Warp / ውርፍ
                    <select
                      value={line.warpColorId}
                      onChange={(e) =>
                        onChange(updateLine(lines, line.id, { ...DETAILS_EDITED, warpColorId: e.target.value }))
                      }
                    >
                      {lookup.colors.map((c) => (
                        <option key={c.colorId} value={c.colorId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Weft / ስፍ
                    <select
                      value={line.weftColorId}
                      onChange={(e) =>
                        onChange(updateLine(lines, line.id, { ...DETAILS_EDITED, weftColorId: e.target.value }))
                      }
                    >
                      {lookup.colors.map((c) => (
                        <option key={c.colorId} value={c.colorId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedProduct && (
                  <p className="muted" style={{ fontSize: "0.82rem", margin: "0.2rem 0 0.5rem" }}>
                    Standard size: {selectedProduct.standardWidthCm ?? "-"} x {selectedProduct.standardLengthCm ?? "-"} cm
                  </p>
                )}
              </>
            )}

            {/* Quantity and Price Inputs */}
            <div className="form-row" style={{ marginTop: "0.5rem" }}>
              <label>
                <span>Quantity (pieces) <span style={{ color: "var(--red, #dc2626)" }}>*</span></span>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <input
                    type="number"
                    min="1"
                    max={isSale && availableStock !== null ? availableStock : undefined}
                    step="1"
                    value={line.quantity}
                    onChange={(e) => onChange(updateLine(lines, line.id, { quantity: e.target.value }))}
                    placeholder="e.g. 5"
                    style={{
                      flex: 1,
                      borderColor: exceedsStock ? "var(--red, #dc2626)" : undefined,
                      borderWidth: exceedsStock ? 2 : undefined,
                    }}
                  />
                  {isSale && availableStock !== null && availableStock > 0 && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => onChange(updateLine(lines, line.id, { quantity: String(availableStock) }))}
                      title="Set to maximum available stock"
                      style={{ whiteSpace: "nowrap", padding: "0.35rem 0.5rem", fontSize: "11px", height: 38 }}
                    >
                      Max ({availableStock})
                    </button>
                  )}
                </div>
                {exceedsStock && (
                  <span style={{ color: "var(--red, #dc2626)", fontSize: "12px", fontWeight: 600, display: "block", marginTop: "4px" }}>
                    ⚠️ Requested quantity ({line.quantity}) exceeds on-hand stock ({availableStock} pcs).
                  </span>
                )}
              </label>

              <label>
                <span>{isSale ? "Unit Selling Price (ETB)" : "Unit Price (ETB)"} <span style={{ color: "var(--red, #dc2626)" }}>*</span></span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={line.unitPrice}
                  onChange={(e) => onChange(updateLine(lines, line.id, { unitPrice: e.target.value }))}
                  placeholder="ETB / piece"
                />
              </label>
            </div>

            {/* Line Subtotal */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginTop: "0.6rem",
                paddingTop: "0.5rem",
                borderTop: "1px dashed var(--border-light, #e2e8f0)",
                fontSize: "0.88rem",
              }}
            >
              <span className="muted" style={{ marginRight: "0.5rem" }}>
                Subtotal:
              </span>
              <strong style={{ fontSize: "1.05rem", color: "var(--brand, #2563eb)" }}>
                ETB {lineSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="btn-secondary"
        onClick={addLine}
        style={{ marginTop: "0.25rem", width: "100%", justifyContent: "center" }}
      >
        + Add Another Fabric Line
      </button>
    </div>
  );
}
