import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { catalogApi, fabricReturnsApi } from "../api";
import type { WorkOrderDetail } from "../api";
import { findZigZagDesignId } from "../utils/defaultDesign";

interface CatalogLookup {
  colors: Array<{ colorId: number; colorCode: string; name: string }>;
  designs: Array<{ designId: number; name: string }>;
}

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

  const [lookup, setLookup] = useState<CatalogLookup>({ colors: [], designs: [] });
  const [warpColorId, setWarpColorId] = useState(
    fv.warpColor ? String(fv.warpColor.colorId) : "",
  );
  const [weftColorId, setWeftColorId] = useState(
    fv.weftColor ? String(fv.weftColor.colorId) : "",
  );
  const [designId, setDesignId] = useState(fv.design ? String(fv.design.designId) : "");
  const [quantity, setQuantity] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [lengthCm, setLengthCm] = useState(String(defaultLength));
  const [widthCm, setWidthCm] = useState(String(defaultWidth));
  const [unitPrice, setUnitPrice] = useState(String(defaultPrice));
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    catalogApi.lookup().then((data) => {
      setLookup(data);
      if (!fv.design?.designId) {
        const zigZagId = findZigZagDesignId(data.designs);
        if (zigZagId) setDesignId(String(zigZagId));
      }
    });
  }, [fv.design?.designId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = (await fabricReturnsApi.create({
        zigId: order.zigId,
        warpColorId: Number(warpColorId),
        weftColorId: Number(weftColorId),
        designId: designId ? Number(designId) : null,
        quantityReturned: Number(quantity),
        totalWeight: Number(totalWeight),
        unitPrice: Number(unitPrice),
        lengthCm: lengthCm ? Number(lengthCm) : undefined,
        widthCm: widthCm ? Number(widthCm) : undefined,
        remark: remark || undefined,
      })) as { variantResolved?: { created: boolean; sku: string } };

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

      <label>
        ዲዛይን / Design
        <select value={designId} onChange={(e) => setDesignId(e.target.value)}>
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
          ውርፍ ቀለም / Warp color
          <select value={warpColorId} onChange={(e) => setWarpColorId(e.target.value)} required>
            {lookup.colors.map((c) => (
              <option key={c.colorId} value={c.colorId}>
                {c.name} ({c.colorCode})
              </option>
            ))}
          </select>
        </label>
        <label>
          ስፍ warp ቀለም / Weft color
          <select value={weftColorId} onChange={(e) => setWeftColorId(e.target.value)} required>
            {lookup.colors.map((c) => (
              <option key={c.colorId} value={c.colorId}>
                {c.name} ({c.colorCode})
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
        ብዛት (ቁጥር) / Quantity
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      </label>
      <label>
        ጠቅላላ ክብደት (ግራም) / Total weight
        <input value={totalWeight} onChange={(e) => setTotalWeight(e.target.value)} required />
      </label>
      <div className="form-row">
        <label>
          ርዝመት (ሴ.ሜ) / Length
          <input value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} />
        </label>
        <label>
          ስፋት (ሴ.ሜ) / Width
          <input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
        </label>
      </div>
      <label>
        ዋጋ / Unit price
        <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
      </label>
      <label>
        ማስታወሻ / Remark
        <input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional note" />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Saving..." : "Save Fabric Return"}
      </button>
    </form>
  );
}