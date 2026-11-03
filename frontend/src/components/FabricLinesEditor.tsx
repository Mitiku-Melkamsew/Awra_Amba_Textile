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
}: FabricLinesEditorProps) {
  const fabricProducts = (lookup.products?.length ? lookup.products : []).filter(
    (p) => p.category === "fabric" || !p.category,
  );

  useEffect(() => {
    if (fabricProducts.length === 0) return;
    const needsUpdate = lines.some((l) => !l.productId && l.entryMode !== "variant");
    if (needsUpdate) {
      const p0 = fabricProducts[0];
      onChange(
        lines.map((l) => {
          if (l.productId || l.entryMode === "variant") return l;
          return {
            ...l,
            productId: String(p0.productId),
            warpColorId: l.warpColorId || (lookup.colors[0] ? String(lookup.colors[0].colorId) : ""),
            weftColorId: l.weftColorId || (lookup.colors[0] ? String(lookup.colors[0].colorId) : ""),
            designId: l.designId || (lookup.designs[0] ? String(lookup.designs[0].designId) : ""),
            unitPrice: l.unitPrice || (p0.basePrice ? String(p0.basePrice) : ""),
          };
        }),
      );
    }
  }, [lookup, fabricProducts, lines, onChange]);

  function addLine() {
    onChange([...lines, createFabricLineDraft(lookup, defaultEntryMode)]);
  }

  return (
    <div className="yarn-lines-editor">
      {lines.map((line, index) => {
        const selectedProduct = fabricProducts.find(
          (p) => String(p.productId) === line.productId,
        );
        return (
          <div key={line.id} className="yarn-line-row">
            <div className="yarn-line-header">
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                Fabric line {index + 1}
              </span>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn-link danger"
                  onClick={() => onChange(lines.filter((l) => l.id !== line.id))}
                >
                  Remove
                </button>
              )}
            </div>

            <VariantSearch
              label="Find existing fabric / áŒ¨áˆ­á‰… áˆáˆáŒ"
              placeholder="Type a name, e.g. medebegna-biret-geberdin"
              items={fabricVariants}
              getId={(v) => String(v.fabricVariantId)}
              getLabel={fabricVariantName}
              getSearchText={(v) => v.sku}
              selectedId={line.entryMode === "variant" ? line.fabricVariantId : ""}
              onSelect={(variant) =>
                onChange(
                  lines.map((l) => (l.id === line.id ? applyFabricVariantToLine(l, variant) : l)),
                )
              }
              onClear={() => onChange(updateLine(lines, line.id, { ...DETAILS_EDITED }))}
            />
            <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
              Not in the list? Fill in the details below.
            </p>

            <label>
              Product / á‹“á‹­áŠá‰µ
              <select
                value={line.productId}
                onChange={(e) => {
                  const product = fabricProducts.find((p) => String(p.productId) === e.target.value);
                  onChange(
                    updateLine(lines, line.id, {
                      ...DETAILS_EDITED,
                      productId: e.target.value,
                      unitPrice: product ? String(product.basePrice) : line.unitPrice,
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
              Design / á‹²á‹›á‹­áŠ•
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
            <div className="form-row">
              <label>
                Warp / á‹áˆ­á
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
                Weft / áˆµá
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
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Standard: {selectedProduct.standardWidthCm ?? "â€”"} Ã—{" "}
                {selectedProduct.standardLengthCm ?? "â€”"} cm
              </p>
            )}

            <div className="form-row">
              <label>
                Quantity
                <input
                  value={line.quantity}
                  onChange={(e) =>
                    onChange(updateLine(lines, line.id, { quantity: e.target.value }))
                  }
                />
              </label>
              <label>
                Unit price
                <input
                  value={line.unitPrice}
                  onChange={(e) =>
                    onChange(updateLine(lines, line.id, { unitPrice: e.target.value }))
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