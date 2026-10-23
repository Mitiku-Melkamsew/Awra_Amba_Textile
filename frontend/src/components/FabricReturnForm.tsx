import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { catalogApi, fabricReturnsApi } from "../api";
import type { FabricVariant, WorkOrderDetail } from "../api";
import {
  applyFabricVariantToLine,
  createFabricLineDraft,
  DETAILS_EDITED,
  type FabricCatalogLookup,
  type FabricLineDraft,
} from "../utils/fabricLines";
import type { LineEntryMode } from "../utils/yarnLines";
import { fabricNameFromParts, fabricVariantName } from "../utils/variantNames";
import { VariantSearch } from "./VariantSearch";

type FabricReturnRow = WorkOrderDetail["fabricReturns"][number];

interface FabricReturnFormProps {
  order: WorkOrderDetail;
  onSaved: (message?: string) => void;
  editReturn?: FabricReturnRow;
  onCancel?: () => void;
}

export function FabricReturnForm({ order, onSaved, editReturn, onCancel }: FabricReturnFormProps) {
  const isEdit = Boolean(editReturn);
  const product = order.fabricVariant.product;
  const fv = order.fabricVariant;
  const defaultLength = product.standardLengthCm ? Number(product.standardLengthCm) : "";
  const defaultWidth = product.standardWidthCm ? Number(product.standardWidthCm) : "";
  const defaultPrice = fv.basePrice ? Number(fv.basePrice) : Number(product.basePrice);

  const [lookup, setLookup] = useState<FabricCatalogLookup>({
    colors: [],
    designs: [],
    products: [],
  });
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [entryMode, setEntryMode] = useState<LineEntryMode>("catalog");
  const [line, setLine] = useState<FabricLineDraft>(createFabricLineDraft());

  const [quantity, setQuantity] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [lengthCm, setLengthCm] = useState(String(defaultLength));
  const [widthCm, setWidthCm] = useState(String(defaultWidth));
  const [unitPrice, setUnitPrice] = useState(String(defaultPrice));
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([catalogApi.lookup(), catalogApi.fabricVariants()]).then(([data, variants]) => {
      setLookup(data);
      setFabricVariants(variants);

      if (editReturn) {
        const rv = editReturn.fabricVariant;
        setEntryMode("variant");
        setLine(applyFabricVariantToLine(createFabricLineDraft(data, "variant"), rv));
        setQuantity(String(editReturn.quantityReturned));
        setTotalWeight(String(editReturn.totalWeight));
        setLengthCm(editReturn.lengthCm ? String(editReturn.lengthCm) : "");
        setWidthCm(editReturn.widthCm ? String(editReturn.widthCm) : "");
        setUnitPrice(String(editReturn.unitPrice));
        setRemark(editReturn.remark ?? "");
        return;
      }

      const draft = createFabricLineDraft(data, "catalog");
      setLine({
        ...draft,
        productId: String(product.productId),
        warpColorId: fv.warpColor ? String(fv.warpColor.colorId) : draft.warpColorId,
        weftColorId: fv.weftColor ? String(fv.weftColor.colorId) : draft.weftColorId,
        designId: fv.design ? String(fv.design.designId) : draft.designId,
        unitPrice: String(defaultPrice),
      });
    });
  }, [product.productId, fv, defaultPrice, editReturn]);

  /** Readable name of what is being saved: the chosen variant, or the typed details on the zig's product. */
  function savedFabricName(): string {
    const chosen =
      entryMode === "variant" && line.fabricVariantId
        ? fabricVariants.find((v) => String(v.fabricVariantId) === line.fabricVariantId)
        : undefined;
    if (chosen) return fabricVariantName(chosen);
    const colorName = (id: string) => lookup.colors.find((c) => String(c.colorId) === id)?.name;
    const designName = lookup.designs.find((d) => String(d.designId) === line.designId)?.name;
    return fabricNameFromParts(product.name, colorName(line.warpColorId), colorName(line.weftColorId), designName);
  }

  function editDetails(patch: Partial<FabricLineDraft>) {
    setLine({ ...line, ...DETAILS_EDITED, ...patch });
    setEntryMode("catalog");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload =
        entryMode === "variant" && line.fabricVariantId
          ? {
              zigId: order.zigId,
              fabricVariantId: Number(line.fabricVariantId),
              quantityReturned: Number(quantity),
              totalWeight: Number(totalWeight),
              unitPrice: Number(unitPrice),
              lengthCm: lengthCm ? Number(lengthCm) : undefined,
              widthCm: widthCm ? Number(widthCm) : undefined,
              remark: remark || undefined,
            }
          : {
              zigId: order.zigId,
              warpColorId: Number(line.warpColorId),
              weftColorId: Number(line.weftColorId),
              designId: line.designId ? Number(line.designId) : null,
              quantityReturned: Number(quantity),
              totalWeight: Number(totalWeight),
              unitPrice: Number(unitPrice),
              lengthCm: lengthCm ? Number(lengthCm) : undefined,
              widthCm: widthCm ? Number(widthCm) : undefined,
              remark: remark || undefined,
            };

      if (isEdit && editReturn) {
        const createPayload = payload as Parameters<typeof fabricReturnsApi.create>[0];
        const updatePayload = {
          fabricVariantId: createPayload.fabricVariantId,
          warpColorId: createPayload.warpColorId,
          weftColorId: createPayload.weftColorId,
          designId: createPayload.designId,
          quantityReturned: createPayload.quantityReturned,
          totalWeight: createPayload.totalWeight,
          unitPrice: createPayload.unitPrice,
          lengthCm: createPayload.lengthCm,
          widthCm: createPayload.widthCm,
          remark: createPayload.remark,
        };
        const result = (await fabricReturnsApi.update(editReturn.returnId, updatePayload)) as {
          variantResolved?: { created: boolean; sku: string };
        };
        const msg = result.variantResolved?.created
          ? `Fabric return updated. New fabric type created: ${savedFabricName()}`
          : `Fabric return updated.`;
        onSaved(msg);
        return;
      }

      const result = (await fabricReturnsApi.create(payload as Parameters<typeof fabricReturnsApi.create>[0])) as {
        variantResolved?: { created: boolean; sku: string };
      };

      const msg = result.variantResolved?.created
        ? `Fabric recorded. New fabric type created: ${savedFabricName()}`
        : `Fabric recorded: ${savedFabricName()}`;
      onSaved(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form fabric-form" onSubmit={handleSubmit}>
      <h3>
        {isEdit ? "ጨርቅ ማስተካከል / Edit Fabric Return" : "ጨርቅ መመዝገብ / Record Fabric"}
      </h3>
      <p className="muted">
        From zig: {product.name}
        {fv.warpColor && ` · warp: ${fv.warpColor.name}`}
        {fv.weftColor && ` · weft: ${fv.weftColor.name}`}
        {fv.design && ` · ${fv.design.name}`}
      </p>

      <VariantSearch
        label="Find existing fabric / ጨርቅ ፈልግ"
        placeholder="Type a name, e.g. medebegna-biret-geberdin"
        items={fabricVariants}
        getId={(v) => String(v.fabricVariantId)}
        getLabel={fabricVariantName}
        getSearchText={(v) => v.sku}
        selectedId={entryMode === "variant" ? line.fabricVariantId : ""}
        onSelect={(variant) => {
          setEntryMode("variant");
          setLine(applyFabricVariantToLine(line, variant));
          if (variant.basePrice) setUnitPrice(String(variant.basePrice));
        }}
        onClear={() => editDetails({})}
      />
      <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
        Not in the list? Fill in the details below. The product is always the zig's product
        ({product.name}).
      </p>

      <label>
        Design
        <select value={line.designId} onChange={(e) => editDetails({ designId: e.target.value })}>
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
          Warp color
          <select
            value={line.warpColorId}
            onChange={(e) => editDetails({ warpColorId: e.target.value })}
            required
          >
            {lookup.colors.map((c) => (
              <option key={c.colorId} value={c.colorId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Weft color
          <select
            value={line.weftColorId}
            onChange={(e) => editDetails({ weftColorId: e.target.value })}
            required
          >
            {lookup.colors.map((c) => (
              <option key={c.colorId} value={c.colorId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Missing a color or design?{" "}
        <Link to="/admin/catalog" target="_blank">
          Add in Catalog
        </Link>
      </p>

      <label>
        Quantity
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      </label>
      <label>
        Total weight (g)
        <input value={totalWeight} onChange={(e) => setTotalWeight(e.target.value)} required />
      </label>
      <div className="form-row">
        <label>
          Length (cm)
          <input value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
        </label>
        <label>
          Width (cm)
          <input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
        </label>
      </div>
      <label>
        Unit price
        <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
      </label>
      <label>
        Remark
        <input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional" />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update Fabric Return" : "Save Fabric Return"}
        </button>
      </div>
    </form>
  );
}