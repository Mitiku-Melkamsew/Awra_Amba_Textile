import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { catalogApi, fabricReturnsApi } from "../api";
import type { FabricVariant, WorkOrderDetail } from "../api";
import {
  applyFabricVariantToLine,
  createFabricLineDraft,
  type FabricCatalogLookup,
  type FabricLineDraft,
} from "../utils/fabricLines";
import type { LineEntryMode } from "../utils/yarnLines";

interface FabricReturnFormProps {
  order: WorkOrderDetail;
  onSaved: (message?: string) => void;
}

export function FabricReturnForm({ order, onSaved }: FabricReturnFormProps) {
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
  }, [product.productId, fv, defaultPrice]);

  const fabricProducts = lookup.products.filter((p) => p.category === "fabric");

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

      const result = (await fabricReturnsApi.create(payload as Parameters<typeof fabricReturnsApi.create>[0])) as {
        variantResolved?: { created: boolean; sku: string };
      };

      const msg = result.variantResolved?.created
        ? `Fabric recorded. New variant created: ${result.variantResolved.sku}`
        : `Fabric recorded. Used variant: ${result.variantResolved?.sku ?? ""}`;
      onSaved(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form fabric-form" onSubmit={handleSubmit}>
      <h3>ጨርቅ መመዝገብ / Record Fabric</h3>
      <p className="muted">
        From zig: {product.name}
        {fv.warpColor && ` · warp: ${fv.warpColor.name}`}
        {fv.weftColor && ` · weft: ${fv.weftColor.name}`}
        {fv.design && ` · ${fv.design.name}`}
      </p>

      <div className="entry-mode-toggle">
        <label>
          <input
            type="radio"
            checked={entryMode === "catalog"}
            onChange={() => setEntryMode("catalog")}
          />
          Describe fabric
        </label>
        <label>
          <input
            type="radio"
            checked={entryMode === "variant"}
            onChange={() => setEntryMode("variant")}
          />
          Pick existing variant
        </label>
      </div>

      {entryMode === "variant" ? (
        <label>
          Fabric variant
          <select
            value={line.fabricVariantId}
            onChange={(e) => {
              const variant = fabricVariants.find(
                (v) => String(v.fabricVariantId) === e.target.value,
              );
              if (variant) {
                setLine(applyFabricVariantToLine(line, variant));
                if (variant.basePrice) setUnitPrice(String(variant.basePrice));
              } else {
                setLine({ ...line, fabricVariantId: e.target.value });
              }
            }}
          >
            <option value="">Select...</option>
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
            Product
            <select
              value={line.productId}
              onChange={(e) => {
                const p = fabricProducts.find((x) => String(x.productId) === e.target.value);
                setLine({ ...line, productId: e.target.value });
                if (p) setUnitPrice(String(p.basePrice));
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
            Design
            <select
              value={line.designId}
              onChange={(e) => setLine({ ...line, designId: e.target.value })}
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
              Warp color
              <select
                value={line.warpColorId}
                onChange={(e) => setLine({ ...line, warpColorId: e.target.value })}
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
                onChange={(e) => setLine({ ...line, weftColorId: e.target.value })}
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
        </>
      )}

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
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Saving..." : "Save Fabric Return"}
      </button>
    </form>
  );
}