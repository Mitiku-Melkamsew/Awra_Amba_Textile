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

export function FabricReturnForm({
  order,
  onSaved,
  editReturn,
  onCancel,
}: FabricReturnFormProps) {
  const isEdit = Boolean(editReturn);
  const fv = order.fabricVariant ?? ({} as any);
  const product = fv.product ?? {
    productId: fv.fabric?.fabricId ?? fv.fabricId ?? order.fabricVariantId ?? 0,
    name: fv.fabric?.name ?? "Fabric",
    category: "fabric",
    basePrice: "0",
    standardLengthCm: fv.fabric?.standardLengthCm
      ? String(fv.fabric.standardLengthCm)
      : null,
    standardWidthCm: fv.fabric?.standardWidthCm
      ? String(fv.fabric.standardWidthCm)
      : null,
  };
  const defaultLength = product.standardLengthCm
    ? Number(product.standardLengthCm)
    : "";
  const defaultWidth = product.standardWidthCm
    ? Number(product.standardWidthCm)
    : "";
  const defaultPrice =
    fv.basePrice ??
    (fv as any).currentPrice?.weaverUnitPrice ??
    (fv as any).fabric?.prices?.[0]?.weaverRate ??
    (fv as any).fabric?.prices?.[0]?.weaverUnitPrice ??
    product.basePrice ??
    0;

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
    Promise.all([catalogApi.lookup(), catalogApi.fabricVariants()]).then(
      ([data, variants]) => {
        setLookup(data);
        setFabricVariants(variants);

        if (editReturn) {
          const rv = editReturn.fabricVariant ?? fv;
          setEntryMode("variant");
          setLine(
            applyFabricVariantToLine(
              createFabricLineDraft(data, "variant"),
              rv as any,
            ),
          );
          setQuantity(String(editReturn.quantityReturned));
          setTotalWeight(String(editReturn.totalWeight));
          setLengthCm(editReturn.lengthCm ? String(editReturn.lengthCm) : "");
          setWidthCm(editReturn.widthCm ? String(editReturn.widthCm) : "");
          setUnitPrice(String(editReturn.unitPrice));
          setRemark(editReturn.remark ?? "");
          return;
        }

        const draft = createFabricLineDraft(data, "catalog");
        const prodId = String(
          product.productId ||
            fv.fabricId ||
            fv.fabric?.fabricId ||
            draft.productId ||
            (data.products?.[0]?.productId ?? ""),
        );
        setLine({
          ...draft,
          productId: prodId,
          warpColorId: fv.warpColor
            ? String(fv.warpColor.colorId)
            : draft.warpColorId,
          weftColorId: fv.weftColor
            ? String(fv.weftColor.colorId)
            : draft.weftColorId,
          designId: fv.design ? String(fv.design.designId) : draft.designId,
          unitPrice: String(defaultPrice),
        });
      },
    );
  }, [product.productId, fv, defaultPrice, editReturn]);

  const fabricProducts = (
    lookup.products?.length ? lookup.products : []
  ).filter((p) => p.category === "fabric" || !p.category);

  /** Readable name of what is being saved: the chosen variant, or the typed details on the zig's product. */
  function savedFabricName(): string {
    const chosen =
      entryMode === "variant" && line.fabricVariantId
        ? fabricVariants.find(
            (v) => String(v.fabricVariantId) === line.fabricVariantId,
          )
        : undefined;
    if (chosen) return fabricVariantName(chosen);
    const colorName = (id: string) =>
      lookup.colors.find((c) => String(c.colorId) === id)?.name;
    const designName = lookup.designs.find(
      (d) => String(d.designId) === line.designId,
    )?.name;
    const chosenProduct =
      lookup.products.find((p) => String(p.productId) === line.productId)
        ?.name ?? product?.name ?? fv?.fabric?.name ?? "Fabric";
    const name = fabricNameFromParts(
      chosenProduct || "Fabric",
      colorName(line.warpColorId),
      colorName(line.weftColorId),
      designName,
    );
    return name && name !== "undefined" ? name : "Fabric";
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
      const zigId = String(order.zigId ?? (order as any).workOrderId ?? "");
      const fvId =
        (entryMode === "variant" && line.fabricVariantId
          ? Number(line.fabricVariantId)
          : undefined) ??
        fv?.fabricVariantId ??
        order.fabricVariantId;

      const pId = line.productId
        ? Number(line.productId)
        : product.productId
          ? Number(product.productId)
          : undefined;
      const wColorId = line.warpColorId
        ? Number(line.warpColorId)
        : (fv.warpColor?.colorId ?? undefined);
      const wfColorId = line.weftColorId
        ? Number(line.weftColorId)
        : (fv.weftColor?.colorId ?? undefined);
      const dId = line.designId
        ? Number(line.designId)
        : (fv.design?.designId ?? null);

      const payload =
        entryMode === "variant" && line.fabricVariantId
          ? {
              zigId,
              fabricVariantId: fvId,
              quantityReturned: Number(quantity),
              totalWeight: Number(totalWeight),
              unitPrice: Number(unitPrice || 0),
              lengthCm: lengthCm ? Number(lengthCm) : undefined,
              widthCm: widthCm ? Number(widthCm) : undefined,
              remark: remark || undefined,
            }
          : {
              zigId,
              fabricVariantId: fvId,
              productId: pId,
              warpColorId: wColorId,
              weftColorId: wfColorId,
              designId: dId,
              quantityReturned: Number(quantity),
              totalWeight: Number(totalWeight),
              unitPrice: Number(unitPrice || 0),
              lengthCm: lengthCm ? Number(lengthCm) : undefined,
              widthCm: widthCm ? Number(widthCm) : undefined,
              remark: remark || undefined,
            };

      if (isEdit && editReturn) {
        const updatePayload = {
          quantityReturned: Number(quantity),
          totalWeight: Number(totalWeight),
          unitPrice: Number(unitPrice || 0),
          remark: remark || undefined,
        };
        const targetId = editReturn.returnId ?? editReturn.fabricReturnId ?? 0;
        await fabricReturnsApi.update(targetId, updatePayload);
        const msg = `Fabric return updated.`;
        onSaved(msg);
        return;
      }

      await fabricReturnsApi.create(payload as any);

      const savedName = savedFabricName();
      const msg =
        savedName && savedName !== "undefined"
          ? `Fabric recorded: ${savedName}`
          : "Fabric recorded successfully.";
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
        {isEdit
          ? "ጨርቅ ማስተካከል / Edit Fabric Return"
          : "ጨርቅ መመዝገብ / Record Fabric"}
      </h3>
      <p className="muted">
        From zig: {product.name || fv.fabric?.name || "Fabric"}
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
          const vPrice = (variant as any).weaverRate ?? (variant as any).product?.weaverRate ?? variant.basePrice;
          if (vPrice) setUnitPrice(String(vPrice));
          const prod = (variant as any).product ?? variant.fabric;
          if (prod?.standardLengthCm) setLengthCm(String(prod.standardLengthCm));
          if (prod?.standardWidthCm) setWidthCm(String(prod.standardWidthCm));
          const stdWt = prod?.standardWeightG;
          if (stdWt && quantity && !isNaN(Number(quantity))) {
            setTotalWeight(String(Number(stdWt) * Number(quantity)));
          }
        }}
        onClear={() => editDetails({})}
      />
      <p className="muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0" }}>
        Not in the list? Fill in the details below.
      </p>

      <label>
        Fabric type / ዓይነት
        <select
          value={line.productId}
          onChange={(e) => {
            const chosen = fabricProducts.find(
              (p) => String(p.productId) === e.target.value,
            );
            editDetails({ productId: e.target.value });
            if (chosen) {
              const r = (chosen as any).weaverRate ?? chosen.basePrice;
              if (r) setUnitPrice(String(r));
              if (chosen.standardLengthCm) setLengthCm(String(chosen.standardLengthCm));
              if (chosen.standardWidthCm) setWidthCm(String(chosen.standardWidthCm));
              const stdWt = (chosen as any).standardWeightG;
              if (stdWt && quantity && !isNaN(Number(quantity))) {
                setTotalWeight(String(Number(stdWt) * Number(quantity)));
              }
            }
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
          onChange={(e) => editDetails({ designId: e.target.value })}
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
        Quantity / ብዛት
        <input
          value={quantity}
          onChange={(e) => {
            const val = e.target.value;
            setQuantity(val);
            const chosen = fabricProducts.find((p) => String(p.productId) === line.productId);
            const stdWt = (chosen as any)?.standardWeightG ?? (fv as any)?.fabric?.standardWeightG ?? 500;
            if (val && !isNaN(Number(val)) && (!totalWeight || totalWeight === "0")) {
              setTotalWeight(String(Math.round(Number(val) * Number(stdWt))));
            }
          }}
          required
        />
      </label>
      <label>
        Total weight (g)
        <input
          value={totalWeight}
          onChange={(e) => setTotalWeight(e.target.value)}
          required
        />
      </label>
      <div className="form-row">
        <label>
          Length (cm)
          <input
            value={lengthCm}
            onChange={(e) => setLengthCm(e.target.value)}
          />
        </label>
        <label>
          Width (cm)
          <input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
        </label>
      </div>
      <label>
        Unit price
        <input
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          required
        />
      </label>
      <label>
        Remark
        <input
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Optional"
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving
            ? "Saving..."
            : isEdit
              ? "Update Fabric Return"
              : "Save Fabric Return"}
        </button>
      </div>
    </form>
  );
}
