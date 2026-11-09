import { useEffect, useMemo } from "react";
import type {
  YarnCatalogLookup,
  YarnLineDraft,
  YarnVariantOption,
} from "../utils/yarnLines";
import {
  applyYarnVariantToLine,
  createYarnLineDraft,
  YARN_DETAILS_EDITED,
} from "../utils/yarnLines";
import { yarnVariantLabels } from "../utils/variantNames";
import { VariantSearch } from "./VariantSearch";

interface YarnLinesEditorProps {
  lines: YarnLineDraft[];
  onChange: (lines: YarnLineDraft[]) => void;
  lookup: YarnCatalogLookup;
  yarnVariants?: YarnVariantOption[];
  quantityHint?: string;
  singleLine?: boolean;
  txnType?: string;
}

function updateLine(
  lines: YarnLineDraft[],
  id: string,
  patch: Partial<YarnLineDraft>,
): YarnLineDraft[] {
  return lines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

export function YarnLinesEditor({
  lines,
  onChange,
  lookup,
  yarnVariants = [],
  quantityHint,
  singleLine = false,
  txnType,
}: YarnLinesEditorProps) {
  const isSale = txnType === "yarn_sale";
  const labels = useMemo(() => yarnVariantLabels(yarnVariants), [yarnVariants]);

  const activeVariants = useMemo(
    () => yarnVariants.filter((v) => v.isActive !== false),
    [yarnVariants],
  );

  const inStockVariants = useMemo(
    () => activeVariants.filter((v) => Number((v as any).stockSnapshot ?? 0) > 0),
    [activeVariants],
  );

  const outOfStockVariants = useMemo(
    () => activeVariants.filter((v) => Number((v as any).stockSnapshot ?? 0) <= 0),
    [activeVariants],
  );

  useEffect(() => {
    if (isSale || lookup.yarnTypes.length === 0) return;
    const needsUpdate = lines.some(
      (l) => !l.yarnTypeId && l.entryMode !== "variant",
    );
    if (needsUpdate) {
      const y0 = lookup.yarnTypes[0];
      const autoPrice =
        txnType === "yarn_purchase"
          ? ((y0 as any).purchasePrice ?? (y0 as any).basePrice)
          : (y0 as any).basePrice;
      onChange(
        lines.map((l) => {
          if (l.yarnTypeId || l.entryMode === "variant") return l;
          return {
            ...l,
            yarnTypeId: String(y0?.yarnTypeId ?? ""),
            supplierId:
              l.supplierId || String(lookup.suppliers[0]?.supplierId ?? ""),
            colorId: l.colorId || String(lookup.colors[0]?.colorId ?? ""),
            unitPrice: l.unitPrice || (autoPrice ? String(autoPrice) : ""),
          };
        }),
      );
    }
  }, [isSale, lookup, lines, onChange, txnType]);

  function addLine() {
    const draft = createYarnLineDraft(lookup);
    if (isSale && inStockVariants.length > 0) {
      const first = inStockVariants[0];
      const autoPrice = (first as any).sellingPrice ?? first.basePrice;
      draft.entryMode = "variant";
      draft.yarnVariantId = String(first.yarnVariantId);
      draft.yarnTypeId = String(first.yarnTypeId ?? (first as any).yarnId ?? "");
      draft.supplierId = String(first.supplierId ?? "");
      draft.colorId = String(first.colorId ?? "");
      draft.unitPrice = autoPrice ? String(autoPrice) : "";
      draft.quantity = "1";
    } else {
      const y0 = lookup.yarnTypes[0];
      const autoPrice = y0
        ? txnType === "yarn_purchase"
          ? ((y0 as any).purchasePrice ?? (y0 as any).basePrice)
          : (y0 as any).basePrice
        : "";
      if (autoPrice) draft.unitPrice = String(autoPrice);
    }
    onChange([...lines, draft]);
  }

  function removeLine(id: string) {
    if (lines.length === 1) return;
    onChange(lines.filter((line) => line.id !== id));
  }

  function handleSelectVariant(lineId: string, variant: YarnVariantOption) {
    const autoPrice = isSale
      ? ((variant as any).sellingPrice ?? variant.basePrice)
      : ((variant as any).purchasePrice ?? variant.basePrice);

    onChange(
      lines.map((l) =>
        l.id === lineId
          ? {
              ...applyYarnVariantToLine(l, variant),
              entryMode: "variant",
              yarnVariantId: String(variant.yarnVariantId),
              unitPrice: autoPrice ? String(autoPrice) : l.unitPrice,
              quantity: l.quantity && Number(l.quantity) > 0 ? l.quantity : "1",
            }
          : l,
      ),
    );
  }

  return (
    <div className="yarn-lines-editor">
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
            <strong>No yarn inventory available:</strong> There are currently 0 yarn pieces/cones in stock. Record yarn purchases before recording a sale.
          </div>
        </div>
      )}

      {lines.map((line, index) => {
        const selectedVariant = yarnVariants.find(
          (v) => String(v.yarnVariantId) === line.yarnVariantId,
        );
        const availableStock = selectedVariant ? Number((selectedVariant as any).stockSnapshot ?? 0) : null;
        const qtyNum = Number(line.quantity || 0);
        const unitPriceNum = Number(line.unitPrice || 0);
        const lineSubtotal = Math.round(qtyNum * unitPriceNum * 100) / 100;
        const exceedsStock =
          (isSale || txnType === "issue_zig") &&
          availableStock !== null &&
          qtyNum > availableStock;

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
            {/* Header */}
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
                  Yarn Item #{index + 1}
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
                    Available: <strong>{availableStock} pieces</strong>
                  </span>
                )}
                {!singleLine && lines.length > 1 && (
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={() => removeLine(line.id)}
                    style={{ fontSize: "12px", color: "var(--red, #dc2626)", cursor: "pointer", background: "none", border: "none" }}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>

            {/* If Sale: Dedicated Variant Selection */}
            {isSale ? (
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.88rem" }}>
                  Select Available Yarn / የሚሸጠውን ክር ይምረጡ <span style={{ color: "var(--red, #dc2626)" }}>*</span>
                </label>
                <select
                  value={line.yarnVariantId}
                  onChange={(e) => {
                    const variant = activeVariants.find((v) => String(v.yarnVariantId) === e.target.value);
                    if (variant) {
                      handleSelectVariant(line.id, variant);
                    } else {
                      onChange(
                        updateLine(lines, line.id, {
                          entryMode: "variant",
                          yarnVariantId: "",
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
                    -- Choose an available yarn variant ({inStockVariants.length} in stock) --
                  </option>
                  {inStockVariants.length > 0 && (
                    <optgroup label="🟢 Ready in Stock (Available to Sell)">
                      {inStockVariants.map((v) => {
                        const price = (v as any).sellingPrice ?? v.basePrice;
                        const label = labels.get(v.yarnVariantId) ?? v.sku;
                        return (
                          <option key={v.yarnVariantId} value={v.yarnVariantId}>
                            {label} [{v.sku}] — 🟢 {Number((v as any).stockSnapshot)} in stock — ETB {price}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {outOfStockVariants.length > 0 && (
                    <optgroup label="🔴 Out of Stock (0 Available)">
                      {outOfStockVariants.map((v) => {
                        const label = labels.get(v.yarnVariantId) ?? v.sku;
                        return (
                          <option key={v.yarnVariantId} value={v.yarnVariantId} disabled>
                            {label} [{v.sku}] — 0 in stock
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>

                {/* Selected Summary */}
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
                      <span className="muted">Color / ቀለም:</span> <strong>{selectedVariant.color?.name ?? "Standard"}</strong>
                    </div>
                    <div>
                      <span className="muted">Supplier:</span> <strong>{selectedVariant.supplier?.name ?? "-"}</strong>
                    </div>
                    <div>
                      <span className="muted">Stock:</span>{" "}
                      <strong style={{ color: availableStock && availableStock > 0 ? "#15803d" : "var(--red, #dc2626)" }}>
                        {availableStock} pieces
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Non-Sale Mode (Procurement or Work Order issue): Variant Search & Direct Details */
              <>
                <VariantSearch
                  label="Find existing yarn / ክር ፈልግ"
                  placeholder="Type a name or SKU, e.g. cotton-white"
                  items={yarnVariants}
                  getId={(v) => String(v.yarnVariantId)}
                  getLabel={(v) => `${labels.get(v.yarnVariantId) ?? v.sku} (${(v as any).stockSnapshot ?? 0} in stock)`}
                  getSearchText={(v) => v.sku}
                  selectedId={line.entryMode === "variant" ? line.yarnVariantId : ""}
                  onSelect={(variant) => handleSelectVariant(line.id, variant)}
                  onClear={() => onChange(updateLine(lines, line.id, { ...YARN_DETAILS_EDITED }))}
                />
                <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
                  Not in the list? Specify custom details below:
                </p>

                <div className="form-row form-row-3">
                  <label>
                    Type / ዓይነት
                    <select
                      value={line.yarnTypeId}
                      onChange={(e) => {
                        const y = lookup.yarnTypes.find((t) => String(t.yarnTypeId) === e.target.value);
                        const autoPrice = (y as any)?.purchasePrice ?? (y as any)?.basePrice;
                        onChange(
                          updateLine(lines, line.id, {
                            ...YARN_DETAILS_EDITED,
                            yarnTypeId: e.target.value,
                            unitPrice: autoPrice ? String(autoPrice) : line.unitPrice,
                          }),
                        );
                      }}
                    >
                      {lookup.yarnTypes.map((t) => (
                        <option key={t.yarnTypeId} value={t.yarnTypeId}>
                          {t.materialName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Supplier
                    <select
                      value={line.supplierId}
                      onChange={(e) =>
                        onChange(updateLine(lines, line.id, { ...YARN_DETAILS_EDITED, supplierId: e.target.value }))
                      }
                    >
                      {lookup.suppliers.map((s) => (
                        <option key={s.supplierId} value={s.supplierId}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Color / ቀለም
                    <select
                      value={line.colorId}
                      onChange={(e) =>
                        onChange(updateLine(lines, line.id, { ...YARN_DETAILS_EDITED, colorId: e.target.value }))
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
              </>
            )}

            {/* Quantity and Price */}
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
                    placeholder={quantityHint ?? "e.g. 10"}
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
                    ⚠️ Requested quantity ({line.quantity}) exceeds on-hand stock ({availableStock} pieces).
                  </span>
                )}
              </label>

              <label>
                <span>{isSale ? "Unit Selling Price (ETB)" : "Unit Price (ETB / piece)"} <span style={{ color: "var(--red, #dc2626)" }}>*</span></span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={line.unitPrice}
                  onChange={(e) => onChange(updateLine(lines, line.id, { unitPrice: e.target.value }))}
                  placeholder={Number(line.quantity) > 0 ? "Required" : "When qty > 0"}
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

      {!singleLine && (
        <button
          type="button"
          className="btn-secondary"
          onClick={addLine}
          style={{ marginTop: "0.25rem", width: "100%", justifyContent: "center" }}
        >
          + Add Another Yarn Line
        </button>
      )}
    </div>
  );
}
