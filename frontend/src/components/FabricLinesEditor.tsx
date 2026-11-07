import { useEffect } from "react";
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
  const fabricProducts = (
    lookup.products?.length ? lookup.products : []
  ).filter((p) => p.category === "fabric" || !p.category);

  useEffect(() => {
    if (fabricProducts.length === 0) return;
    const needsUpdate = lines.some(
      (l) => !l.productId && l.entryMode !== "variant",
    );
    if (needsUpdate) {
      const p0 = fabricProducts[0];
      const p0Price =
        txnType === "fabric_purchase"
          ? ((p0 as any).weaverRate ?? p0.basePrice)
          : txnType === "fabric_sale"
            ? ((p0 as any).sellingPrice ?? p0.basePrice)
            : p0.basePrice;
      onChange(
        lines.map((l) => {
          if (l.productId || l.entryMode === "variant") return l;
          return {
            ...l,
            productId: String(p0.productId),
            warpColorId:
              l.warpColorId ||
              (lookup.colors[0] ? String(lookup.colors[0].colorId) : ""),
            weftColorId:
              l.weftColorId ||
              (lookup.colors[0] ? String(lookup.colors[0].colorId) : ""),
            designId:
              l.designId ||
              (lookup.designs[0] ? String(lookup.designs[0].designId) : ""),
            unitPrice:
              l.unitPrice || (p0Price ? String(p0Price) : ""),
          };
        }),
      );
    }
  }, [lookup, fabricProducts, lines, onChange, txnType]);

  function addLine() {
    const draft = createFabricLineDraft(lookup, defaultEntryMode);
    const p0 = fabricProducts[0];
    const defaultPrice = p0
      ? txnType === "fabric_purchase"
        ? ((p0 as any).weaverRate ?? p0.basePrice)
        : txnType === "fabric_sale"
          ? ((p0 as any).sellingPrice ?? p0.basePrice)
          : p0.basePrice
      : "";
    if (defaultPrice) draft.unitPrice = String(defaultPrice);
    onChange([...lines, draft]);
  }

  return (
    <div className="yarn-lines-editor">
      {lines.map((line, index) => {
        const selectedProduct = fabricProducts.find(
          (p) => String(p.productId) === line.productId,
        );
        const selectedVariant = fabricVariants.find(
          (v) => String(v.fabricVariantId) === line.fabricVariantId,
        );
        const availableStock = selectedVariant ? Number((selectedVariant as any).stockSnapshot ?? 0) : null;
        const exceedsStock =
          txnType === "fabric_sale" &&
          availableStock !== null &&
          Number(line.quantity) > availableStock;

        return (
          <div key={line.id} className="yarn-line-row">
            <div className="yarn-line-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                Fabric line {index + 1}
              </span>
              {availableStock !== null && (
                <span style={{ fontSize: "12px", fontWeight: 600, color: availableStock <= 0 ? "var(--red)" : "var(--text-muted)" }}>
                  Available Stock: <strong style={{ color: availableStock <= 0 ? "var(--red)" : "var(--accent)" }}>{availableStock} pcs</strong>
                </span>
              )}
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn-link danger"
                  onClick={() =>
                    onChange(lines.filter((l) => l.id !== line.id))
                  }
                >
                  Remove
                </button>
              )}
            </div>

            <VariantSearch
              label="Find existing fabric / ጨርቅ ፈልግ"
              placeholder="Type a name, e.g. medebegna-biret-geberdin"
              items={fabricVariants}
              getId={(v) => String(v.fabricVariantId)}
              getLabel={(v) => `${fabricVariantName(v)} (${(v as any).stockSnapshot ?? 0} in stock)`}
              getSearchText={(v) => v.sku}
              selectedId={
                line.entryMode === "variant" ? line.fabricVariantId : ""
              }
              onSelect={(variant) => {
                const autoPrice =
                  txnType === "fabric_purchase"
                    ? ((variant as any).weaverRate ?? (variant as any).product?.weaverRate ?? variant.basePrice)
                    : txnType === "fabric_sale"
                      ? ((variant as any).sellingPrice ?? (variant as any).product?.sellingPrice ?? variant.basePrice)
                      : variant.basePrice;
                onChange(
                  lines.map((l) =>
                    l.id === line.id
                      ? {
                          ...applyFabricVariantToLine(l, variant),
                          unitPrice: autoPrice ? String(autoPrice) : l.unitPrice,
                        }
                      : l,
                  ),
                );
              }}
              onClear={() =>
                onChange(updateLine(lines, line.id, { ...DETAILS_EDITED }))
              }
            />
            <p
              className="muted"
              style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}
            >
              Not in the list? Fill in the details below.
            </p>

            <label>
              Product / ዓይነት
              <select
                value={line.productId}
                onChange={(e) => {
                  const product = fabricProducts.find(
                    (p) => String(p.productId) === e.target.value,
                  );
                  const autoPrice =
                    txnType === "fabric_purchase"
                      ? ((product as any)?.weaverRate ?? product?.basePrice)
                      : txnType === "fabric_sale"
                        ? ((product as any)?.sellingPrice ?? product?.basePrice)
                        : product?.basePrice;
                  onChange(
                    updateLine(lines, line.id, {
                      ...DETAILS_EDITED,
                      productId: e.target.value,
                      unitPrice: autoPrice
                        ? String(autoPrice)
                        : line.unitPrice,
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
                  onChange(
                    updateLine(lines, line.id, {
                      ...DETAILS_EDITED,
                      designId: e.target.value,
                    }),
                  )
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
            <div className="form-row">
              <label>
                Warp / ውርፍ
                <select
                  value={line.warpColorId}
                  onChange={(e) =>
                    onChange(
                      updateLine(lines, line.id, {
                        ...DETAILS_EDITED,
                        warpColorId: e.target.value,
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
              <label>
                Weft / ስፍ
                <select
                  value={line.weftColorId}
                  onChange={(e) =>
                    onChange(
                      updateLine(lines, line.id, {
                        ...DETAILS_EDITED,
                        weftColorId: e.target.value,
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
            {selectedProduct && (
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Standard: {selectedProduct.standardWidthCm ?? "-"} x{" "}
                {selectedProduct.standardLengthCm ?? "-"} cm
              </p>
            )}

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
                  style={exceedsStock ? { borderColor: "var(--red)" } : undefined}
                />
                {exceedsStock && (
                  <span style={{ color: "var(--red)", fontSize: "11px", fontWeight: 600, display: "block", marginTop: "4px" }}>
                    ⚠️ Exceeds stock ({availableStock} available)
                  </span>
                )}
              </label>
              <label>
                Unit price
                <input
                  value={line.unitPrice}
                  onChange={(e) =>
                    onChange(
                      updateLine(lines, line.id, { unitPrice: e.target.value }),
                    )
                  }
                />
              </label>
            </div>
          </div>
        );
      })}
      <button type="button" className="btn-secondary" onClick={addLine}>
        + Add fabric line
      </button>
    </div>
  );
}
