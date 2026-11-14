import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { catalogApi, fabricReturnsApi } from "../api";
import type { FabricVariant, WorkOrderDetail } from "../api";
import {
  applyFabricVariantToLine,
  createFabricLineDraft,
  type FabricLineDraft,
} from "../utils/fabricLines";
import { fabricVariantName } from "../utils/variantNames";
import { VariantSearch } from "./VariantSearch";

type FabricReturnRow = WorkOrderDetail["fabricReturns"][number];

interface FabricReturnFormProps {
  order: WorkOrderDetail;
  onSaved: (message?: string) => void;
  editReturn?: FabricReturnRow;
  onCancel?: () => void;
}

/**
 * Record / edit fabric return using schema fields only:
 * fabricVariantId, quantityReturned, totalWeight, unitPrice, lengthCm, widthCm, remark
 */
export function FabricReturnForm({
  order,
  onSaved,
  editReturn,
  onCancel,
}: FabricReturnFormProps) {
  const isEdit = Boolean(editReturn);
  const orderVariant = order.fabricVariant ?? ({} as FabricVariant);

  const defaultLength = orderVariant.fabric?.standardLengthCm
    ? String(orderVariant.fabric.standardLengthCm)
    : "";
  const defaultWidth = orderVariant.fabric?.standardWidthCm
    ? String(orderVariant.fabric.standardWidthCm)
    : "";
  const defaultPrice =
    (orderVariant as any).basePrice ??
    (orderVariant as any).currentPrice?.weaverUnitPrice ??
    (orderVariant as any).fabric?.prices?.[0]?.weaverRate ??
    0;

  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [line, setLine] = useState<FabricLineDraft>(
    applyFabricVariantToLine(
      createFabricLineDraft(undefined, "variant"),
      {
        ...orderVariant,
        fabricVariantId:
          orderVariant.fabricVariantId ?? order.fabricVariantId ?? 0,
      } as FabricVariant,
    ),
  );

  const [quantity, setQuantity] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [lengthCm, setLengthCm] = useState(defaultLength);
  const [widthCm, setWidthCm] = useState(defaultWidth);
  const [unitPrice, setUnitPrice] = useState(String(defaultPrice || 0));
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    catalogApi.fabricVariants().then((variants) => {
      setFabricVariants(variants);

      if (editReturn) {
        const rv = (editReturn.fabricVariant ?? orderVariant) as FabricVariant;
        setLine(
          applyFabricVariantToLine(createFabricLineDraft(undefined, "variant"), rv),
        );
        setQuantity(String(editReturn.quantityReturned));
        setTotalWeight(String(editReturn.totalWeight));
        setLengthCm(editReturn.lengthCm ? String(editReturn.lengthCm) : "");
        setWidthCm(editReturn.widthCm ? String(editReturn.widthCm) : "");
        setUnitPrice(String(editReturn.unitPrice));
        setRemark(editReturn.remark ?? "");
        return;
      }

      // Default to the work order's fabric variant
      const defaultId =
        order.fabricVariantId ?? orderVariant.fabricVariantId;
      if (defaultId) {
        const match =
          variants.find((v) => v.fabricVariantId === defaultId) ?? orderVariant;
        setLine(
          applyFabricVariantToLine(
            createFabricLineDraft(undefined, "variant"),
            match as FabricVariant,
          ),
        );
      }
    });
  }, [order.fabricVariantId, editReturn]);

  const selectedVariant = fabricVariants.find(
    (v) => String(v.fabricVariantId) === line.fabricVariantId,
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const zigId = String(order.zigId ?? (order as any).workOrderId ?? "");
      const fabricVariantId = Number(
        line.fabricVariantId || order.fabricVariantId,
      );
      if (!fabricVariantId) {
        throw new Error("Select a fabric variant");
      }
      if (!quantity || Number(quantity) <= 0) {
        throw new Error("Quantity returned must be greater than 0");
      }
      if (!totalWeight || Number(totalWeight) <= 0) {
        throw new Error("Total weight must be greater than 0");
      }

      if (isEdit && editReturn) {
        const targetId = editReturn.returnId ?? (editReturn as any).fabricReturnId ?? 0;
        await fabricReturnsApi.update(targetId, {
          quantityReturned: Number(quantity),
          totalWeight: Number(totalWeight),
          unitPrice: Number(unitPrice || 0),
          remark: remark || undefined,
        });
        onSaved("Fabric return updated.");
        return;
      }

      await fabricReturnsApi.create({
        zigId,
        fabricVariantId,
        quantityReturned: Number(quantity),
        totalWeight: Number(totalWeight),
        unitPrice: Number(unitPrice || 0),
        lengthCm: lengthCm ? Number(lengthCm) : undefined,
        widthCm: widthCm ? Number(widthCm) : undefined,
        remark: remark || undefined,
      });

      const name = selectedVariant
        ? fabricVariantName(selectedVariant)
        : "Fabric";
      onSaved(`Fabric recorded: ${name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const activeVariants = fabricVariants.filter((v) => v.isActive !== false);

  return (
    <form className="card form fabric-form" onSubmit={handleSubmit}>
      <h3>
        {isEdit
          ? "ጨርቅ ማስተካከል / Edit Fabric Return"
          : "ጨርቅ መመዝገብ / Record Fabric"}
      </h3>
      <p className="muted">
        From zig: {order.zigId}
        {orderVariant.fabric?.name && ` · ${orderVariant.fabric.name}`}
        {orderVariant.warpColor && ` · warp: ${orderVariant.warpColor.name}`}
        {orderVariant.weftColor && ` · weft: ${orderVariant.weftColor.name}`}
        {orderVariant.design && ` · ${orderVariant.design.name}`}
      </p>

      {!isEdit && (
        <div className="field">
          <label>Fabric variant</label>
          <VariantSearch
            variants={activeVariants}
            selectedId={line.fabricVariantId}
            onSelect={(v) => {
              setLine(applyFabricVariantToLine(line, v));
              const price =
                (v as any).basePrice ??
                (v as any).fabric?.prices?.[0]?.weaverRate ??
                unitPrice;
              if (price) setUnitPrice(String(price));
            }}
            onClear={() =>
              setLine({ ...line, fabricVariantId: "" })
            }
            placeholder="Search fabric variant (SKU, name, color…)"
          />
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label>Quantity returned (pieces)</label>
          <input
            type="number"
            min={1}
            step={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Total weight (g)</label>
          <input
            type="number"
            min={0.01}
            step="any"
            required
            value={totalWeight}
            onChange={(e) => setTotalWeight(e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Length (cm)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={lengthCm}
            onChange={(e) => setLengthCm(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Width (cm)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={widthCm}
            onChange={(e) => setWidthCm(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Unit price</label>
          <input
            type="number"
            min={0}
            step="any"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Remark</label>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Optional"
        />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update return" : "Record fabric"}
        </button>
      </div>
    </form>
  );
}
