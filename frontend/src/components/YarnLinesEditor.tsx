import { useMemo } from "react";
import type { YarnCatalogLookup, YarnLineDraft, YarnVariantOption } from "../utils/yarnLines";
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
  const labels = useMemo(() => yarnVariantLabels(yarnVariants), [yarnVariants]);

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

          <VariantSearch
            label="Find existing yarn / ክር ፈልግ"
            placeholder="Type a name, e.g. cotton-white"
            items={yarnVariants}
            getId={(v) => String(v.yarnVariantId)}
            getLabel={(v) => labels.get(v.yarnVariantId) ?? v.sku}
            getSearchText={(v) => v.sku}
            selectedId={line.entryMode === "variant" ? line.yarnVariantId : ""}
            onSelect={(variant) =>
              onChange(lines.map((l) => (l.id === line.id ? applyYarnVariantToLine(l, variant) : l)))
            }
            onClear={() => onChange(updateLine(lines, line.id, { ...YARN_DETAILS_EDITED }))}
          />
          <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
            Not in the list? Fill in the details below.
          </p>

          <div className="form-row form-row-3">
            <label>
              Type / ዓይነት
              <select
                value={line.yarnTypeId}
                onChange={(e) =>
                  onChange(updateLine(lines, line.id, { ...YARN_DETAILS_EDITED, yarnTypeId: e.target.value }))
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