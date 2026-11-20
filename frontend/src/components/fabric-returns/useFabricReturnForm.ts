import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  catalogApi,
  fabricReturnsApi,
  type Color,
  type DeductionEntry,
  type Design,
  type Fabric,
  type FabricVariant,
  type WorkOrderDetail,
} from "../../api";
import { fabricVariantName } from "../../utils/variantNames";
import { findZigZagDesignId } from "../../utils/defaultDesign";

export type FabricReturnRow = WorkOrderDetail["fabricReturns"][number];

export const DEDUCTION_FACTORS: Array<{ value: string; label: string }> = [
  { value: "weight", label: "Weight Deficit" },
  { value: "low_quality", label: "Low Quality / Coarse Weave" },
  { value: "stain", label: "Stain / Discoloration" },
  { value: "weaving_defect", label: "Weaving Defect / Broken Threads" },
  { value: "custom", label: "Other / Custom Factor" },
];

export interface UseFabricReturnFormProps {
  order: WorkOrderDetail;
  onSaved: (message?: string) => void;
  editReturn?: FabricReturnRow;
  onCancel?: () => void;
  canRecord?: boolean;
}

export function useFabricReturnForm({
  order,
  onSaved,
  editReturn,
  onCancel,
  canRecord = true,
}: UseFabricReturnFormProps) {
  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  // Catalog lookups & variants
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);

  // Oxlint-safe order variant id reference
  const orderVariant = order.fabricVariant;
  const initialVariantId = Number(
    editReturn?.fabricVariant?.fabricVariantId ??
    editReturn?.fabricVariantId ??
    order.fabricVariantId ??
    orderVariant?.fabricVariantId ??
    0
  );
  const [selectedVariantId, setSelectedVariantId] = useState<number>(initialVariantId);

  // Active return form inputs
  const [editingReturnId, setEditingReturnId] = useState<number | null>(
    editReturn ? editReturn.returnId : null
  );
  const [quantity, setQuantity] = useState(
    editReturn ? String(editReturn.quantityReturned) : ""
  );
  const [totalWeight, setTotalWeight] = useState(
    editReturn ? String(editReturn.totalWeight) : ""
  );
  const [unitPrice, setUnitPrice] = useState(
    editReturn
      ? String(editReturn.unitPrice)
      : String((orderVariant as any)?.basePrice ?? (orderVariant as any)?.currentPrice?.weaverRate ?? 1380)
  );
  const [lengthCm, setLengthCm] = useState(
    editReturn && editReturn.lengthCm
      ? String(editReturn.lengthCm)
      : orderVariant?.fabric?.standardLengthCm
      ? String(orderVariant.fabric.standardLengthCm)
      : "64"
  );
  const [widthCm, setWidthCm] = useState(
    editReturn && editReturn.widthCm
      ? String(editReturn.widthCm)
      : orderVariant?.fabric?.standardWidthCm
      ? String(orderVariant.fabric.standardWidthCm)
      : "120"
  );
  const [remark, setRemark] = useState(editReturn?.remark ?? "");

  // Quality Deductions state
  const [deductions, setDeductions] = useState<DeductionEntry[]>(
    editReturn?.deductions ? [...(editReturn.deductions as any)] : []
  );
  const [addFactorOpen, setAddFactorOpen] = useState(false);
  const [factorType, setFactorType] = useState("low_quality");
  const [factorPerPiece, setFactorPerPiece] = useState("");
  const [factorRemark, setFactorRemark] = useState("");

  // Status
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalFabricId, setModalFabricId] = useState("");
  const [modalWarpColorId, setModalWarpColorId] = useState("");
  const [modalWeftColorId, setModalWeftColorId] = useState("");
  const [modalDesignId, setModalDesignId] = useState("");

  // Load catalog lookup & variants
  useEffect(() => {
    Promise.all([catalogApi.lookup(), catalogApi.fabricVariants()])
      .then(([lookup, variants]) => {
        setFabrics(lookup.fabrics);
        setColors(lookup.colors);
        setDesigns(lookup.designs);
        setFabricVariants(variants);

        if (lookup.fabrics[0]) setModalFabricId(String(lookup.fabrics[0].fabricId));
        if (lookup.colors[0]) {
          setModalWarpColorId(String(lookup.colors[0].colorId));
          setModalWeftColorId(String(lookup.colors[0].colorId));
        }
        const defaultDesign =
          findZigZagDesignId(lookup.designs as any) ?? lookup.designs[0]?.designId;
        if (defaultDesign) setModalDesignId(String(defaultDesign));
      })
      .catch((err) => {
        console.error("Failed to load catalog lookup for fabric return:", err);
      });
  }, []);

  // Update form if external editReturn prop changes
  useEffect(() => {
    if (editReturn) {
      setEditingReturnId(editReturn.returnId);
      setQuantity(String(editReturn.quantityReturned));
      setTotalWeight(String(editReturn.totalWeight));
      setUnitPrice(String(editReturn.unitPrice));
      if (editReturn.lengthCm) setLengthCm(String(editReturn.lengthCm));
      if (editReturn.widthCm) setWidthCm(String(editReturn.widthCm));
      setRemark(editReturn.remark ?? "");
      setDeductions(editReturn.deductions ? [...(editReturn.deductions as any)] : []);
      const varId = Number(editReturn.fabricVariant?.fabricVariantId ?? editReturn.fabricVariantId);
      if (varId) setSelectedVariantId(varId);
    }
  }, [editReturn]);

  // Resolved selected FabricVariant (safe dependency)
  const orderVariantId = order.fabricVariant?.fabricVariantId ?? order.fabricVariantId;
  const selectedVariant = useMemo(() => {
    const match = fabricVariants.find((v) => v.fabricVariantId === selectedVariantId);
    if (match) return match;
    if (order.fabricVariant) return order.fabricVariant;
    return undefined;
  }, [fabricVariants, selectedVariantId, order.fabricVariant]);

  const selectedVariantDisplayName = useMemo(() => {
    if (!selectedVariant) return "medebegna · biret · geberdin";
    return fabricVariantName(selectedVariant).split("-").join(" · ");
  }, [selectedVariant]);

  const standardWeight = selectedVariant?.fabric?.standardWeightG ?? 64;

  // Real-time averages for the current form entry
  const numQty = parseFloat(quantity) || 0;
  const numWeight = parseFloat(totalWeight) || 0;
  const currentAvgWeight = numQty > 0 ? numWeight / numQty : 0;
  const flooredAvg = Math.floor(currentAvgWeight);
  const isCurrentUnderweight = numQty > 0 && flooredAvg < standardWeight;
  const weightDeficit = isCurrentUnderweight ? standardWeight - flooredAvg : 0;
  const suggestedWeightPerPiece = weightDeficit * 10;
  const hasWeightDeduction = deductions.some((d) => d.factor === "weight");

  const totalDeductionPerPiece = useMemo(
    () => deductions.reduce((sum, d) => sum + (Number(d.perPiece) || 0), 0),
    [deductions]
  );
  const liveGross = useMemo(
    () => numQty * (parseFloat(unitPrice) || 0),
    [numQty, unitPrice]
  );
  const liveDeductionAmount = useMemo(
    () => totalDeductionPerPiece * numQty,
    [totalDeductionPerPiece, numQty]
  );
  const liveNetFabricValue = useMemo(
    () => liveGross - liveDeductionAmount,
    [liveGross, liveDeductionAmount]
  );

  function handleApplyWeightDeduction() {
    if (suggestedWeightPerPiece <= 0) return;
    setDeductions((prev) => {
      const rest = prev.filter((d) => d.factor !== "weight");
      return [
        ...rest,
        {
          factor: "weight",
          perPiece: suggestedWeightPerPiece,
          remark: `Avg ${flooredAvg}g is ${weightDeficit}g below standard ${standardWeight}g (-${suggestedWeightPerPiece} ETB/piece)`,
        },
      ];
    });
  }

  function handleAddCustomFactor() {
    const p = parseFloat(factorPerPiece);
    if (isNaN(p) || p <= 0) {
      setError("Please specify a deduction amount per piece greater than 0");
      return;
    }
    setDeductions((prev) => {
      const rest = prev.filter((d) => d.factor !== factorType);
      return [
        ...rest,
        {
          factor: factorType,
          perPiece: p,
          remark: factorRemark.trim() || undefined,
        },
      ];
    });
    setFactorPerPiece("");
    setFactorRemark("");
    setAddFactorOpen(false);
  }

  function handleRemoveDeduction(factor: string) {
    setDeductions((prev) => prev.filter((d) => d.factor !== factor));
  }

  function handleOpenModal() {
    setModalSearch("");
    if (selectedVariant) {
      if (selectedVariant.fabricId || selectedVariant.fabric?.fabricId) {
        setModalFabricId(String(selectedVariant.fabricId ?? selectedVariant.fabric?.fabricId));
      }
      if (selectedVariant.warpColorId || selectedVariant.warpColor?.colorId) {
        setModalWarpColorId(String(selectedVariant.warpColorId ?? selectedVariant.warpColor?.colorId));
      }
      if (selectedVariant.weftColorId || selectedVariant.weftColor?.colorId) {
        setModalWeftColorId(String(selectedVariant.weftColorId ?? selectedVariant.weftColor?.colorId));
      }
      if (selectedVariant.designId || selectedVariant.design?.designId) {
        setModalDesignId(String(selectedVariant.designId ?? selectedVariant.design?.designId));
      }
    }
    setIsModalOpen(true);
  }

  function handleSelectModalVariant(variant: FabricVariant) {
    setSelectedVariantId(variant.fabricVariantId);
    const p =
      (variant as any).basePrice ??
      (variant as any).currentPrice?.weaverRate ??
      variant.fabric?.standardWeightG;
    if (p && !editReturn) {
      setUnitPrice(String(p));
    }
    setIsModalOpen(false);
  }

  async function handleApplyCustomModalFabric() {
    try {
      if (!modalFabricId || !modalWarpColorId || !modalWeftColorId || !modalDesignId) {
        setIsModalOpen(false);
        return;
      }
      const match = fabricVariants.find(
        (v) =>
          String(v.fabricId ?? v.fabric?.fabricId) === modalFabricId &&
          String(v.warpColorId ?? v.warpColor?.colorId) === modalWarpColorId &&
          String(v.weftColorId ?? v.weftColor?.colorId) === modalWeftColorId &&
          String(v.designId ?? v.design?.designId) === modalDesignId
      );
      if (match) {
        handleSelectModalVariant(match);
        return;
      }
      const created = await catalogApi.createFabricVariant({
        fabricId: Number(modalFabricId),
        warpColorId: Number(modalWarpColorId),
        weftColorId: Number(modalWeftColorId),
        designId: Number(modalDesignId),
      });
      setFabricVariants((prev) => [created, ...prev]);
      handleSelectModalVariant(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fabric variant");
      setIsModalOpen(false);
    }
  }

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!canRecord) return;

    setError("");
    const qty = parseFloat(quantity);
    const weight = parseFloat(totalWeight);
    const price = parseFloat(unitPrice) || 0;

    if (!qty || qty <= 0) {
      setError("Please enter a valid quantity greater than 0.");
      quantityInputRef.current?.focus();
      return;
    }
    if (!weight || weight <= 0) {
      setError("Please enter a valid total weight (g) greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const zigId = String(order.zigId ?? "");
      const varId = selectedVariantId || order.fabricVariantId || orderVariantId;
      if (!varId) {
        throw new Error("Please select a fabric variant.");
      }

      if (editingReturnId) {
        await fabricReturnsApi.update(editingReturnId, {
          quantityReturned: qty,
          totalWeight: weight,
          unitPrice: price,
          lengthCm: lengthCm ? Number(lengthCm) : undefined,
          widthCm: widthCm ? Number(widthCm) : undefined,
          remark: remark || undefined,
          deductions,
        });
        onSaved("Fabric return updated.");
        handleCancelEdit();
      } else {
        await fabricReturnsApi.create({
          zigId,
          fabricVariantId: varId,
          quantityReturned: qty,
          totalWeight: weight,
          unitPrice: price,
          lengthCm: lengthCm ? Number(lengthCm) : undefined,
          widthCm: widthCm ? Number(widthCm) : undefined,
          remark: remark || undefined,
          deductions,
        });
        onSaved(`Fabric return recorded: ${selectedVariantDisplayName}`);

        setQuantity("");
        setTotalWeight("");
        setRemark("");
        setDeductions([]);
        setAddFactorOpen(false);
        setTimeout(() => {
          quantityInputRef.current?.focus();
        }, 50);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to save fabric return");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditingReturnId(null);
    setQuantity("");
    setTotalWeight("");
    setRemark("");
    setDeductions([]);
    setAddFactorOpen(false);
    setSelectedVariantId(Number(order.fabricVariantId ?? orderVariantId ?? 0));
    if (onCancel) onCancel();
    quantityInputRef.current?.focus();
  }

  function handleStartEdit(ret: FabricReturnRow) {
    setEditingReturnId(ret.returnId);
    setQuantity(String(ret.quantityReturned));
    setTotalWeight(String(ret.totalWeight));
    setUnitPrice(String(ret.unitPrice));
    if (ret.lengthCm) setLengthCm(String(ret.lengthCm));
    if (ret.widthCm) setWidthCm(String(ret.widthCm));
    setRemark(ret.remark ?? "");
    setDeductions(ret.deductions ? [...(ret.deductions as any)] : []);
    const vId = Number(ret.fabricVariant?.fabricVariantId ?? ret.fabricVariantId);
    if (vId) setSelectedVariantId(vId);
    setError("");
    quantityInputRef.current?.focus();
  }

  async function handleDeleteReturn(returnId: number) {
    if (!window.confirm("Are you sure you want to delete this fabric return?")) return;
    try {
      await fabricReturnsApi.delete(returnId);
      onSaved("Fabric return deleted.");
      if (editingReturnId === returnId) {
        handleCancelEdit();
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to delete return");
    }
  }

  // Grouped returns calculation for the right card
  const groupedReturns = useMemo(() => {
    const rawList = Array.isArray(order.fabricReturns) ? order.fabricReturns : [];
    const map = new Map<
      number,
      {
        variantId: number;
        variant: FabricVariant | null;
        label: string;
        standardWeightG: number;
        totalQty: number;
        totalWeight: number;
        avgG: number;
        grossTotal: number;
        deductionTotal: number;
        netTotal: number;
        returns: FabricReturnRow[];
      }
    >();

    rawList.forEach((ret: any) => {
      const v = (ret.fabricVariant ?? order.fabricVariant) as FabricVariant;
      const vId = Number(v?.fabricVariantId ?? ret.fabricVariantId ?? 0);
      const retQty = Number(ret.quantityReturned || 0);
      const retWeight = Number(ret.totalWeight || 0);
      const retPrice = Number(ret.unitPrice || 0);
      const gross =
        ret.grossFabricValue !== undefined ? Number(ret.grossFabricValue) : retQty * retPrice;
      const deduction = ret.deductionAmount !== undefined ? Number(ret.deductionAmount) : 0;
      const net = gross - deduction;

      if (!map.has(vId)) {
        const label = v
          ? fabricVariantName(v).split("-").join(" · ")
          : "medebegna · biret · geberdin";
        const stdW = v?.fabric?.standardWeightG ?? 64;
        map.set(vId, {
          variantId: vId,
          variant: v,
          label,
          standardWeightG: stdW,
          totalQty: 0,
          totalWeight: 0,
          avgG: 0,
          grossTotal: 0,
          deductionTotal: 0,
          netTotal: 0,
          returns: [],
        });
      }

      const group = map.get(vId)!;
      group.totalQty += retQty;
      group.totalWeight += retWeight;
      group.grossTotal += gross;
      group.deductionTotal += deduction;
      group.netTotal += net;
      group.returns.push(ret);
    });

    map.forEach((g) => {
      g.avgG = g.totalQty > 0 ? Math.round(g.totalWeight / g.totalQty) : 0;
    });

    return Array.from(map.values());
  }, [order.fabricReturns, order.fabricVariant]);

  const grandTotal = useMemo(() => {
    return groupedReturns.reduce((acc, g) => acc + g.netTotal, 0);
  }, [groupedReturns]);

  return {
    quantityInputRef,
    fabrics,
    colors,
    designs,
    fabricVariants,
    selectedVariant,
    selectedVariantDisplayName,
    editingReturnId,
    quantity,
    setQuantity,
    totalWeight,
    setTotalWeight,
    unitPrice,
    setUnitPrice,
    lengthCm,
    setLengthCm,
    widthCm,
    setWidthCm,
    remark,
    setRemark,
    deductions,
    addFactorOpen,
    setAddFactorOpen,
    factorType,
    setFactorType,
    factorPerPiece,
    setFactorPerPiece,
    factorRemark,
    setFactorRemark,
    detailsOpen,
    setDetailsOpen,
    saving,
    error,
    setError,
    standardWeight,
    flooredAvg,
    isCurrentUnderweight,
    weightDeficit,
    suggestedWeightPerPiece,
    hasWeightDeduction,
    totalDeductionPerPiece,
    liveGross,
    liveDeductionAmount,
    liveNetFabricValue,
    handleApplyWeightDeduction,
    handleAddCustomFactor,
    handleRemoveDeduction,
    isModalOpen,
    setIsModalOpen,
    modalSearch,
    setModalSearch,
    modalFabricId,
    setModalFabricId,
    modalWarpColorId,
    setModalWarpColorId,
    modalWeftColorId,
    setModalWeftColorId,
    modalDesignId,
    setModalDesignId,
    handleOpenModal,
    handleSelectModalVariant,
    handleApplyCustomModalFabric,
    handleSubmit,
    handleCancelEdit,
    handleStartEdit,
    handleDeleteReturn,
    groupedReturns,
    grandTotal,
  };
}
