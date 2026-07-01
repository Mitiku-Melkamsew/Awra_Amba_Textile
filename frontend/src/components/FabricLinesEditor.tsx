import type { FabricVariant } from "../api";
import {
  applyFabricVariantToLine,
  createFabricLineDraft,
  type FabricCatalogLookup,
  type FabricLineDraft,
} from "../utils/fabricLines";

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
  const fabricProducts = lookup.products.filter((p) => p.category === "fabric");

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

            <div className="entry-mode-toggle">
              <label>
                <input
                  type="radio"
                  checked={line.entryMode === "catalog"}
                  onChange={() =>
                    onChange(
                      updateLine(lines, line.id, { entryMode: "catalog", fabricVariantId: "" }),
                    )
                  }
                />
                Describe fabric (like zig return)
              </label>
              <label>
                <input
                  type="radio"
                  checked={line.entryMode === "variant"}
                  onChange={() => onChange(updateLine(lines, line.id, { entryMode: "variant" }))}
                />
                Pick existing variant
              </label>
            </div>

            {line.entryMode === "variant" ? (
              <label>
                Fabric variant / SKU
                <select
                  value={line.fabricVariantId}
                  onChange={(e) => {
                    const variant = fabricVariants.find(
                      (v) => String(v.fabricVariantId) === e.target.value,
                    );
                    if (variant) {
                      onChange(
                        lines.map((l) =>
                          l.id === line.id ? applyFabricVariantToLine(l, variant) : l,
                        ),
                      );
                    } else {
                      onChange(updateLine(lines, line.id, { fabricVariantId: e.target.value }));
                    }
                  }}
                >
                  <option value="">Select variant...</option>
                  {fabricVariants.map((v) => (
                    <option key={v.fabricVariantId} value={v.fabricVariantId}>
                      {v.product.name} · {v.sku}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label>
                  Product / ዓይነት
                  <select
                    value={line.productId}
                    onChange={(e) => {
                      const product = fabricProducts.find(
                        (p) => String(p.productId) === e.target.value,
                      );
                      onChange(
                        updateLine(lines, line.id, {
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
                  Design / ዲዛይን
                  <select
                    value={line.designId}
                    onChange={(e) =>
                      onChange(updateLine(lines, line.id, { designId: e.target.value }))
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
                        onChange(updateLine(lines, line.id, { warpColorId: e.target.value }))
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
                        onChange(updateLine(lines, line.id, { weftColorId: e.target.value }))
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
                    Standard: {selectedProduct.standardWidthCm ?? "—"} ×{" "}
                    {selectedProduct.standardLengthCm ?? "—"} cm
                  </p>
                )}
              </>
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