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
  const labels = useMemo(() => yarnVariantLabels(yarnVariants), [yarnVariants]);

  useEffect(() => {
    if (lookup.yarnTypes.length === 0) return;
    const needsUpdate = lines.some(
      (l) => !l.yarnTypeId && l.entryMode !== "variant",
    );
    if (needsUpdate) {
      const y0 = lookup.yarnTypes[0];
      const autoPrice =
        txnType === "yarn_purchase"
          ? ((y0 as any).purchasePrice ?? (y0 as any).basePrice)
          : txnType === "yarn_sale"
            ? ((y0 as any).sellingPrice ?? (y0 as any).basePrice)
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
  }, [lookup, lines, onChange, txnType]);

  function addLine() {
    const draft = createYarnLineDraft(lookup);
    const y0 = lookup.yarnTypes[0];
    const autoPrice = y0
      ? txnType === "yarn_purchase"
        ? ((y0 as any).purchasePrice ?? (y0 as any).basePrice)
        : txnType === "yarn_sale"
          ? ((y0 as any).sellingPrice ?? (y0 as any).basePrice)
          : (y0 as any).basePrice
      : "";
    if (autoPrice) draft.unitPrice = String(autoPrice);
    onChange([...lines, draft]);
  }

  function removeLine(id: string) {
    if (lines.length === 1) return;
    onChange(lines.filter((line) => line.id !== id));
  }

  return (
    <div className="yarn-lines-editor">
      {lines.map((line, index) => {
        const selectedVariant = yarnVariants.find(
          (v) => String(v.yarnVariantId) === line.yarnVariantId,
        );
        const availableStock = selectedVariant ? Number((selectedVariant as any).stockSnapshot ?? 0) : null;
        const exceedsStock =
          (txnType === "yarn_sale" || txnType === "issue_zig") &&
          availableStock !== null &&
          Number(line.quantity) > availableStock;

        return (
          <div key={line.id} className="yarn-line-row">
            <div className="yarn-line-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                Yarn variant {index + 1}
              </span>
              {availableStock !== null && (
                <span style={{ fontSize: "12px", fontWeight: 600, color: availableStock <= 0 ? "var(--red)" : "var(--text-muted)" }}>
                  Available Stock: <strong style={{ color: availableStock <= 0 ? "var(--red)" : "var(--accent)" }}>{availableStock} pieces</strong>
                </span>
              )}
              {!singleLine && lines.length > 1 && (
                <button
                  type="button"
                  className="btn-link danger"
                  onClick={() => removeLine(line.id)}
                >
                  Remove
                </button>
              )}
            </div>

            <VariantSearch
              label="Find existing yarn / ክር ፈልግ"
              placeholder="Type a name, e.g. cotton-white"
              items={yarnVariants}
              getId={(v) => String(v.yarnVariantId)}
              getLabel={(v) => `${labels.get(v.yarnVariantId) ?? v.sku} (${(v as any).stockSnapshot ?? 0} in stock)`}
              getSearchText={(v) => v.sku}
              selectedId={line.entryMode === "variant" ? line.yarnVariantId : ""}
              onSelect={(variant) => {
                const autoPrice =
                  txnType === "yarn_purchase"
                    ? ((variant as any).purchasePrice ?? variant.basePrice)
                    : txnType === "yarn_sale"
                      ? ((variant as any).sellingPrice ?? variant.basePrice)
                      : variant.basePrice;
                onChange(
                  lines.map((l) =>
                    l.id === line.id
                      ? {
                          ...applyYarnVariantToLine(l, variant),
                          unitPrice: autoPrice ? String(autoPrice) : l.unitPrice,
                        }
                      : l,
                  ),
                );
              }}
              onClear={() =>
                onChange(updateLine(lines, line.id, { ...YARN_DETAILS_EDITED }))
              }
            />
            <p
              className="muted"
              style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}
            >
              Not in the list? Fill in the details below.
            </p>

            <div className="form-row form-row-3">
              <label>
                Type / ዓይነት
                <select
                  value={line.yarnTypeId}
                  onChange={(e) => {
                    const y = lookup.yarnTypes.find((t) => String(t.yarnTypeId) === e.target.value);
                    const autoPrice =
                      txnType === "yarn_purchase"
                        ? ((y as any)?.purchasePrice ?? (y as any)?.basePrice)
                        : txnType === "yarn_sale"
                          ? ((y as any)?.sellingPrice ?? (y as any)?.basePrice)
                          : (y as any)?.basePrice;
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
                    onChange(
                      updateLine(lines, line.id, {
                        ...YARN_DETAILS_EDITED,
                        supplierId: e.target.value,
                      }),
                    )
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
                    onChange(
                      updateLine(lines, line.id, {
                        ...YARN_DETAILS_EDITED,
                        colorId: e.target.value,
                      }),
                    )
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

            <div className="form-row">
              <label>
                Quantity (pieces)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={(e) =>
                    onChange(
                      updateLine(lines, line.id, { quantity: e.target.value }),
                    )
                  }
                  placeholder={quantityHint}
                  style={exceedsStock ? { borderColor: "var(--red)" } : undefined}
                />
                {exceedsStock && (
                  <span style={{ color: "var(--red)", fontSize: "11px", fontWeight: 600, display: "block", marginTop: "4px" }}>
                    ⚠️ Exceeds stock ({availableStock} available)
                  </span>
                )}
              </label>
              <label>
                Unit price (ETB / piece)
                <input
                  value={line.unitPrice}
                  onChange={(e) =>
                    onChange(
                      updateLine(lines, line.id, { unitPrice: e.target.value }),
                    )
                  }
                  placeholder={
                    Number(line.quantity) > 0 ? "Required" : "When qty > 0"
                  }
                />
              </label>
            </div>
          </div>
        );
      })}
      {!singleLine && (
        <button type="button" className="btn-secondary" onClick={addLine}>
          + Add yarn variant
        </button>
      )}
    </div>
  );
}
