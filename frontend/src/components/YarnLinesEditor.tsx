import type { YarnCatalogLookup, YarnLineDraft, YarnVariantOption } from "../utils/yarnLines";
import { applyYarnVariantToLine, createYarnLineDraft } from "../utils/yarnLines";

interface YarnLinesEditorProps {
  lines: YarnLineDraft[];
  onChange: (lines: YarnLineDraft[]) => void;
  lookup: YarnCatalogLookup;
  yarnVariants?: YarnVariantOption[];
  quantityHint?: string;
  singleLine?: boolean;
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
}: YarnLinesEditorProps) {
  function addLine() {
    onChange([...lines, createYarnLineDraft(lookup)]);
  }

  function removeLine(id: string) {
    if (lines.length === 1) return;
    onChange(lines.filter((line) => line.id !== id));
  }

  return (
    <div className="yarn-lines-editor">
      {lines.map((line, index) => (
        <div key={line.id} className="yarn-line-row">
          <div className="yarn-line-header">
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              Yarn variant {index + 1}
            </span>
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

          <div className="entry-mode-toggle">
            <label>
              <input
                type="radio"
                checked={line.entryMode === "catalog"}
                onChange={() =>
                  onChange(updateLine(lines, line.id, { entryMode: "catalog", yarnVariantId: "" }))
                }
              />
              Build from type / color
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
              Yarn variant / SKU
              <select
                value={line.yarnVariantId}
                onChange={(e) => {
                  const variant = yarnVariants.find(
                    (v) => String(v.yarnVariantId) === e.target.value,
                  );
                  if (variant) {
                    onChange(
                      lines.map((l) =>
                        l.id === line.id ? applyYarnVariantToLine(l, variant) : l,
                      ),
                    );
                  } else {
                    onChange(updateLine(lines, line.id, { yarnVariantId: e.target.value }));
                  }
                }}
              >
                <option value="">Select variant...</option>
                {yarnVariants.map((v) => (
                  <option key={v.yarnVariantId} value={v.yarnVariantId}>
                    {v.sku} · {v.yarnType?.materialName} · {v.color?.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="form-row form-row-3">
              <label>
                Type / ዓይነት
                <select
                  value={line.yarnTypeId}
                  onChange={(e) =>
                    onChange(updateLine(lines, line.id, { yarnTypeId: e.target.value }))
                  }
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
                    onChange(updateLine(lines, line.id, { supplierId: e.target.value }))
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
                    onChange(updateLine(lines, line.id, { colorId: e.target.value }))
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
          )}

          {line.entryMode === "variant" && line.yarnVariantId && (
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              {lookup.yarnTypes.find((t) => String(t.yarnTypeId) === line.yarnTypeId)?.materialName}
              {" · "}
              {lookup.suppliers.find((s) => String(s.supplierId) === line.supplierId)?.name}
              {" · "}
              {lookup.colors.find((c) => String(c.colorId) === line.colorId)?.name}
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
                placeholder={quantityHint}
              />
            </label>
            <label>
              Unit price
              <input
                value={line.unitPrice}
                onChange={(e) =>
                  onChange(updateLine(lines, line.id, { unitPrice: e.target.value }))
                }
                placeholder={Number(line.quantity) > 0 ? "Required" : "When qty > 0"}
              />
            </label>
          </div>
        </div>
      ))}
      {!singleLine && (
        <button type="button" className="btn-secondary" onClick={addLine}>
          + Add yarn variant
        </button>
      )}
    </div>
  );
}