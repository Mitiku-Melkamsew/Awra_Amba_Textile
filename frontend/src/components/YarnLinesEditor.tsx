import type { YarnCatalogLookup, YarnLineDraft } from "../utils/yarnLines";
import { createYarnLineDraft } from "../utils/yarnLines";

interface YarnLinesEditorProps {
  lines: YarnLineDraft[];
  onChange: (lines: YarnLineDraft[]) => void;
  lookup: YarnCatalogLookup;
  quantityHint?: string;
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
  quantityHint,
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
            {lines.length > 1 && (
              <button
                type="button"
                className="btn-link danger"
                onClick={() => removeLine(line.id)}
              >
                Remove
              </button>
            )}
          </div>
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
      <button type="button" className="btn-secondary" onClick={addLine}>
        + Add yarn variant
      </button>
    </div>
  );
}