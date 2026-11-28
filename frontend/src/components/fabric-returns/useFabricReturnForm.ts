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
  type QualityRuleRow,
  type WorkOrderDetail,
} from "../../api";
import { fabricVariantName } from "../../utils/variantNames";
import { findZigZagDesignId } from "../../utils/defaultDesign";
import { toTitleCase } from "../../utils/formatters";

export type FabricReturnRow = WorkOrderDetail["fabricReturns"][number];

function resolveVariantWeaverRate(variant: any): number {
  if (!variant) return 0;
  return Number(
    variant.currentPrice?.weaverRate ??
      variant.fabric?.currentPrice?.weaverRate ??
      variant.fabric?.prices?.[0]?.weaverRate ??
      variant.prices?.[0]?.weaverRate ??
      variant.weaverRate ??
      variant.basePrice ??
      0
  );
}

export const DEDUCTION_FACTORS: Array<{ value: string; label: string }> = [
  { value: "weight", label: "Weight Deficit" },
  { value: "length", label: "Length Deficit" },
  { value: "width", label: "Width Deficit" },
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
  const [qualityRules, setQualityRules] = useState<QualityRuleRow[]>([]);

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
  const initialUnitPrice = editReturn
    ? String(editReturn.unitPrice)
    : String(resolveVariantWeaverRate(orderVariant));
  const [unitPrice, setUnitPrice] = useState(initialUnitPrice);
  const [lengthCm, setLengthCm] = useState(
    editReturn && editReturn.lengthCm
      ? String(editReturn.lengthCm)
      : orderVariant?.fabric?.standardLengthCm
      ? String(orderVariant.fabric.standardLengthCm)
      : ""
  );
  const [widthCm, setWidthCm] = useState(
    editReturn && editReturn.widthCm
      ? String(editReturn.widthCm)
      : orderVariant?.fabric?.standardWidthCm
      ? String(orderVariant.fabric.standardWidthCm)
      : ""
  );
  const [remark, setRemark] = useState(editReturn?.remark ?? "");

  // Quality Deductions state: custom entries, cancelled auto-factors
  const [customDeductions, setCustomDeductions] = useState<DeductionEntry[]>(
    editReturn?.deductions ? [...(editReturn.deductions as any)] : []
  );
  const [cancelledFactors, setCancelledFactors] = useState<string[]>([]);
  const [addFactorOpen, setAddFactorOpen] = useState(false);
  const [factorType, setFactorType] = useState("low_quality");
  const [factorPerPiece, setFactorPerPiece] = useState("");
  const [factorRemark, setFactorRemark] = useState("");

  // Status
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Create Variant Modal State (aligned with Transactions -> Buy fabric)
  const [showCreateVariantModal, setShowCreateVariantModal] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [variantModalError, setVariantModalError] = useState("");
  const [newFvFabricId, setNewFvFabricId] = useState("");
  const [newFvWarpColorId, setNewFvWarpColorId] = useState("");
  const [newFvWeftColorId, setNewFvWeftColorId] = useState("");
  const [newFvDesignId, setNewFvDesignId] = useState("");

  const [showNewFabricForm, setShowNewFabricForm] = useState(false);
  const [inlineFabricName, setInlineFabricName] = useState("");
  const [inlineFabricWeight, setInlineFabricWeight] = useState("500");
  const [inlineFabricLength, setInlineFabricLength] = useState("240");
  const [inlineFabricWidth, setInlineFabricWidth] = useState("150");

  const [showNewWarpColorForm, setShowNewWarpColorForm] = useState(false);
  const [inlineWarpColorName, setInlineWarpColorName] = useState("");

  const [showNewWeftColorForm, setShowNewWeftColorForm] = useState(false);
  const [inlineWeftColorName, setInlineWeftColorName] = useState("");

  const [showNewDesignForm, setShowNewDesignForm] = useState(false);
  const [inlineDesignName, setInlineDesignName] = useState("");

  // Load catalog lookup & variants
  useEffect(() => {
    Promise.all([catalogApi.lookup(), catalogApi.fabricVariants()])
      .then(([lookup, variants]) => {
        setFabrics(lookup.fabrics);
        setColors(lookup.colors);
        setDesigns(lookup.designs);
        setFabricVariants(variants);
        setQualityRules(lookup.qualityRules || []);

        if (lookup.fabrics[0]) setNewFvFabricId(String(lookup.fabrics[0].fabricId));
        if (lookup.colors[0]) {
          setNewFvWarpColorId(String(lookup.colors[0].colorId));
          setNewFvWeftColorId(String(lookup.colors[0].colorId));
        }
        const defaultDesign =
          findZigZagDesignId(lookup.designs as any) ?? lookup.designs[0]?.designId;
        if (defaultDesign) setNewFvDesignId(String(defaultDesign));
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
      const existingDeductions = editReturn.deductions ? [...(editReturn.deductions as any)] : [];
      setCustomDeductions(existingDeductions);
      const existingFactorNames = new Set(existingDeductions.map((d: any) => d.factor));
      const cancelled: string[] = [];
      if (!existingFactorNames.has("weight")) cancelled.push("weight");
      if (!existingFactorNames.has("length")) cancelled.push("length");
      if (!existingFactorNames.has("width")) cancelled.push("width");
      setCancelledFactors(cancelled);
      const varId = Number(editReturn.fabricVariant?.fabricVariantId ?? editReturn.fabricVariantId);
      if (varId) setSelectedVariantId(varId);
    }
  }, [editReturn]);

  // Resolved selected FabricVariant (safe dependency)
  const orderVariantId = order.fabricVariant?.fabricVariantId ?? order.fabricVariantId;
  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return undefined;
    const match = fabricVariants.find((v) => v.fabricVariantId === selectedVariantId);
    if (match) return match;
    if (order.fabricVariant && Number(order.fabricVariant.fabricVariantId ?? order.fabricVariantId) === selectedVariantId) {
      return order.fabricVariant;
    }
    return undefined;
  }, [fabricVariants, selectedVariantId, order.fabricVariant, order.fabricVariantId]);

  // Standard dimensions from selected fabric
  const standardWeight = selectedVariant?.fabric?.standardWeightG
    ? Number(selectedVariant.fabric.standardWeightG)
    : 64;
  const standardLength = selectedVariant?.fabric?.standardLengthCm
    ? Number(selectedVariant.fabric.standardLengthCm)
    : 0;
  const standardWidth = selectedVariant?.fabric?.standardWidthCm
    ? Number(selectedVariant.fabric.standardWidthCm)
    : 0;

  // Pre-fill unitPrice, length, and width when default variant or catalog prices finish loading
  useEffect(() => {
    if (!editingReturnId && selectedVariant) {
      const resolvedRate = resolveVariantWeaverRate(selectedVariant);
      if (resolvedRate > 0) {
        setUnitPrice((prev) => (prev === "" || Number(prev) <= 0 ? String(resolvedRate) : prev));
      }
      if (selectedVariant.fabric) {
        const stdLen = selectedVariant.fabric.standardLengthCm
          ? String(selectedVariant.fabric.standardLengthCm)
          : "";
        const stdWid = selectedVariant.fabric.standardWidthCm
          ? String(selectedVariant.fabric.standardWidthCm)
          : "";
        if (stdLen) {
          setLengthCm((prev) => prev || stdLen);
        }
        if (stdWid) {
          setWidthCm((prev) => prev || stdWid);
        }
      }
    }
  }, [selectedVariant, editingReturnId]);

  const selectedVariantDisplayName = useMemo(() => {
    if (!selectedVariant) return "Medebegna · Biret · Geberdin";
    return fabricVariantName(selectedVariant, " · ");
  }, [selectedVariant]);

  // Quality rule rates helper: ONLY returns a rate if an active rule exists in DB!
  const getRuleRate = (factorName: string): number | null => {
    const rule = qualityRules.find(
      (r) => String(r.factor || "").toLowerCase() === factorName.toLowerCase() && r.isActive !== false
    );
    if (!rule) return null;
    const rate = Number(rule.deductionPerUnit);
    return isNaN(rate) || rate <= 0 ? null : rate;
  };

  // Real-time measurements & averages
  const numQty = parseFloat(quantity) || 0;
  const numWeight = parseFloat(totalWeight) || 0;
  const numLength = parseFloat(lengthCm) || 0;
  const numWidth = parseFloat(widthCm) || 0;

  // 1. Weight Deficit (only active if weight rule exists in DB)
  const currentAvgWeight = numQty > 0 ? numWeight / numQty : 0;
  const flooredAvg = Math.floor(currentAvgWeight);
  const weightRate = getRuleRate("weight");
  const isCurrentUnderweight =
    numQty > 0 && flooredAvg > 0 && standardWeight > 0 && flooredAvg < standardWeight && weightRate !== null;
  const weightDeficit = isCurrentUnderweight ? standardWeight - flooredAvg : 0;
  const suggestedWeightPerPiece = weightRate !== null ? weightDeficit * weightRate : 0;

  // 2. Length Deficit (only active if length rule exists in DB)
  const flooredLength = Math.floor(numLength);
  const lengthRate = getRuleRate("length");
  const isCurrentUnderlength =
    numQty > 0 && flooredLength > 0 && standardLength > 0 && flooredLength < standardLength && lengthRate !== null;
  const lengthDeficit = isCurrentUnderlength ? standardLength - flooredLength : 0;
  const suggestedLengthPerPiece = lengthRate !== null ? lengthDeficit * lengthRate : 0;

  // 3. Width Deficit (only active if width rule exists in DB)
  const flooredWidth = Math.floor(numWidth);
  const widthRate = getRuleRate("width");
  const isCurrentUnderwidth =
    numQty > 0 && flooredWidth > 0 && standardWidth > 0 && flooredWidth < standardWidth && widthRate !== null;
  const widthDeficit = isCurrentUnderwidth ? standardWidth - flooredWidth : 0;
  const suggestedWidthPerPiece = widthRate !== null ? widthDeficit * widthRate : 0;

  // Available factors dynamically pulled from database quality rules + standards
  const availableFactors = useMemo(() => {
    const list: Array<{ value: string; label: string; rate?: number }> = [];

    if (weightRate !== null) {
      list.push({ value: "weight", label: `Weight Deficit (${weightRate} ETB/g)`, rate: weightRate });
    }
    if (lengthRate !== null) {
      list.push({ value: "length", label: `Length Deficit (${lengthRate} ETB/cm)`, rate: lengthRate });
    }
    if (widthRate !== null) {
      list.push({ value: "width", label: `Width Deficit (${widthRate} ETB/cm)`, rate: widthRate });
    }

    qualityRules.forEach((rule) => {
      const f = String(rule.factor || "").toLowerCase();
      if (f !== "weight" && f !== "length" && f !== "width") {
        list.push({
          value: rule.factor,
          label: `${toTitleCase(rule.factor)} (${Number(rule.deductionPerUnit)} ETB/${rule.unit})`,
          rate: Number(rule.deductionPerUnit),
        });
      }
    });

    const standardDefects = [
      { value: "low_quality", label: "Low Quality / Coarse Weave" },
      { value: "stain", label: "Stain / Discoloration" },
      { value: "weaving_defect", label: "Weaving Defect / Broken Threads" },
      { value: "custom", label: "Other / Custom Factor" },
    ];
    standardDefects.forEach((sd) => {
      if (!list.some((item) => item.value.toLowerCase() === sd.value.toLowerCase())) {
        list.push(sd);
      }
    });

    return list;
  }, [qualityRules, weightRate, lengthRate, widthRate]);

  function handleOpenAddFactor() {
    setAddFactorOpen(true);
    const initialFactor = availableFactors.find((f) => f.value === factorType) || availableFactors[0];
    if (initialFactor && initialFactor.rate !== undefined && !factorPerPiece) {
      setFactorPerPiece(String(initialFactor.rate));
    }
  }

  // Automatically applied quality deductions (unless user explicitly cancelled them)
  const deductions = useMemo<DeductionEntry[]>(() => {
    const list: DeductionEntry[] = [];
    const autoFactorNames = new Set<string>();

    if (isCurrentUnderweight && !cancelledFactors.includes("weight")) {
      list.push({
        factor: "weight",
        perPiece: suggestedWeightPerPiece,
        remark: `Avg ${flooredAvg}g is ${weightDeficit}g below standard ${standardWeight}g (-${suggestedWeightPerPiece} ETB/piece)`,
      });
      autoFactorNames.add("weight");
    }

    if (isCurrentUnderlength && !cancelledFactors.includes("length")) {
      list.push({
        factor: "length",
        perPiece: suggestedLengthPerPiece,
        remark: `Length ${flooredLength}cm is ${lengthDeficit}cm below standard ${standardLength}cm (-${suggestedLengthPerPiece} ETB/piece)`,
      });
      autoFactorNames.add("length");
    }

    if (isCurrentUnderwidth && !cancelledFactors.includes("width")) {
      list.push({
        factor: "width",
        perPiece: suggestedWidthPerPiece,
        remark: `Width ${flooredWidth}cm is ${widthDeficit}cm below standard ${standardWidth}cm (-${suggestedWidthPerPiece} ETB/piece)`,
      });
      autoFactorNames.add("width");
    }

    // Append custom / non-auto deductions
    for (const cd of customDeductions) {
      if (!autoFactorNames.has(cd.factor) && !cancelledFactors.includes(cd.factor)) {
        list.push(cd);
      }
    }

    return list;
  }, [
    isCurrentUnderweight,
    cancelledFactors,
    suggestedWeightPerPiece,
    flooredAvg,
    weightDeficit,
    standardWeight,
    isCurrentUnderlength,
    suggestedLengthPerPiece,
    flooredLength,
    lengthDeficit,
    standardLength,
    isCurrentUnderwidth,
    suggestedWidthPerPiece,
    flooredWidth,
    widthDeficit,
    standardWidth,
    customDeductions,
  ]);

  // List of active deficits that the user chose to cancel / waive
  const cancelledAutoDeductions = useMemo(() => {
    const list: Array<{
      factor: string;
      label: string;
      deficit: number;
      unit: string;
      standard: number;
      actual: number;
      perPiece: number;
      remark: string;
    }> = [];

    if (isCurrentUnderweight && cancelledFactors.includes("weight")) {
      list.push({
        factor: "weight",
        label: "Weight Deficit",
        deficit: weightDeficit,
        unit: "g",
        standard: standardWeight,
        actual: flooredAvg,
        perPiece: suggestedWeightPerPiece,
        remark: `Avg ${flooredAvg}g is ${weightDeficit}g below standard ${standardWeight}g`,
      });
    }

    if (isCurrentUnderlength && cancelledFactors.includes("length")) {
      list.push({
        factor: "length",
        label: "Length Deficit",
        deficit: lengthDeficit,
        unit: "cm",
        standard: standardLength,
        actual: flooredLength,
        perPiece: suggestedLengthPerPiece,
        remark: `Length ${flooredLength}cm is ${lengthDeficit}cm below standard ${standardLength}cm`,
      });
    }

    if (isCurrentUnderwidth && cancelledFactors.includes("width")) {
      list.push({
        factor: "width",
        label: "Width Deficit",
        deficit: widthDeficit,
        unit: "cm",
        standard: standardWidth,
        actual: flooredWidth,
        perPiece: suggestedWidthPerPiece,
        remark: `Width ${flooredWidth}cm is ${widthDeficit}cm below standard ${standardWidth}cm`,
      });
    }

    return list;
  }, [
    isCurrentUnderweight,
    cancelledFactors,
    weightDeficit,
    standardWeight,
    flooredAvg,
    suggestedWeightPerPiece,
    isCurrentUnderlength,
    lengthDeficit,
    standardLength,
    flooredLength,
    suggestedLengthPerPiece,
    isCurrentUnderwidth,
    widthDeficit,
    standardWidth,
    flooredWidth,
    suggestedWidthPerPiece,
  ]);

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

  function handleCancelDeduction(factor: string) {
    setCancelledFactors((prev) => (prev.includes(factor) ? prev : [...prev, factor]));
    setCustomDeductions((prev) => prev.filter((d) => d.factor !== factor));
  }

  function handleRestoreDeduction(factor: string) {
    setCancelledFactors((prev) => prev.filter((f) => f !== factor));
  }

  function handleAddCustomFactor() {
    const p = parseFloat(factorPerPiece);
    if (isNaN(p) || p <= 0) {
      setError("Please specify a deduction amount per piece greater than 0");
      return;
    }
    const factor = factorType.trim();
    setCancelledFactors((prev) => prev.filter((f) => f !== factor));
    setCustomDeductions((prev) => {
      const rest = prev.filter((d) => d.factor !== factor);
      return [
        ...rest,
        {
          factor,
          perPiece: p,
          remark: factorRemark.trim() || undefined,
        },
      ];
    });
    setFactorPerPiece("");
    setFactorRemark("");
    setAddFactorOpen(false);
  }

  const handleRemoveDeduction = handleCancelDeduction;

  function applySelectedVariant(variant: FabricVariant) {
    setSelectedVariantId(variant.fabricVariantId);
    const rate = resolveVariantWeaverRate(variant);
    if (!editingReturnId) {
      setUnitPrice(String(rate));
      if (variant.fabric?.standardLengthCm) {
        setLengthCm(String(variant.fabric.standardLengthCm));
      }
      if (variant.fabric?.standardWidthCm) {
        setWidthCm(String(variant.fabric.standardWidthCm));
      }
    }
  }

  function handleSelectVariantById(variantIdStr: string) {
    if (!variantIdStr) {
      setSelectedVariantId(0);
      return;
    }
    const idNum = Number(variantIdStr);
    const match = fabricVariants.find((v) => v.fabricVariantId === idNum);
    if (match) {
      applySelectedVariant(match);
    } else {
      setSelectedVariantId(idNum);
    }
  }

  function handleOpenCreateVariantModal(searchQuery?: string) {
    setVariantModalError("");
    setShowNewFabricForm(false);
    setShowNewWarpColorForm(false);
    setShowNewWeftColorForm(false);
    setShowNewDesignForm(false);
    if (searchQuery && searchQuery.trim()) {
      setInlineFabricName(searchQuery.trim());
    }
    if (selectedVariant) {
      const fId = selectedVariant.fabricId ?? selectedVariant.fabric?.fabricId;
      const wId = selectedVariant.warpColorId ?? selectedVariant.warpColor?.colorId;
      const fColorId = selectedVariant.weftColorId ?? selectedVariant.weftColor?.colorId;
      const dId = selectedVariant.designId ?? selectedVariant.design?.designId;
      if (fId) setNewFvFabricId(String(fId));
      if (wId) setNewFvWarpColorId(String(wId));
      if (fColorId) setNewFvWeftColorId(String(fColorId));
      if (dId) setNewFvDesignId(String(dId));
    } else {
      if (fabrics[0] && !newFvFabricId) setNewFvFabricId(String(fabrics[0].fabricId));
      if (colors[0] && !newFvWarpColorId) setNewFvWarpColorId(String(colors[0].colorId));
      if (colors[0] && !newFvWeftColorId) setNewFvWeftColorId(String(colors[0].colorId));
      if (designs[0] && !newFvDesignId) setNewFvDesignId(String(designs[0].designId));
    }
    setShowCreateVariantModal(true);
  }

  async function handleCreateInlineFabric() {
    if (!inlineFabricName.trim()) return;
    try {
      const created = await catalogApi.createFabric({
        name: inlineFabricName.trim().toLowerCase(),
        standardWeightG: Number(inlineFabricWeight) || 500,
        standardLengthCm: Number(inlineFabricLength) || 240,
        standardWidthCm: Number(inlineFabricWidth) || 150,
      });
      setFabrics((prev) => [...prev, created]);
      setNewFvFabricId(String(created.fabricId));
      setInlineFabricName("");
      setShowNewFabricForm(false);
    } catch (err: any) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create base fabric");
    }
  }

  async function handleCreateInlineWarpColor() {
    if (!inlineWarpColorName.trim()) return;
    try {
      const created = await catalogApi.createColor({ name: inlineWarpColorName.trim() });
      setColors((prev) => [...prev, created]);
      setNewFvWarpColorId(String(created.colorId));
      setInlineWarpColorName("");
      setShowNewWarpColorForm(false);
    } catch (err: any) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create color");
    }
  }

  async function handleCreateInlineWeftColor() {
    if (!inlineWeftColorName.trim()) return;
    try {
      const created = await catalogApi.createColor({ name: inlineWeftColorName.trim() });
      setColors((prev) => [...prev, created]);
      setNewFvWeftColorId(String(created.colorId));
      setInlineWeftColorName("");
      setShowNewWeftColorForm(false);
    } catch (err: any) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create color");
    }
  }

  async function handleCreateInlineDesign() {
    if (!inlineDesignName.trim()) return;
    try {
      const created = await catalogApi.createDesign({ name: inlineDesignName.trim() });
      setDesigns((prev) => [...prev, created]);
      setNewFvDesignId(String(created.designId));
      setInlineDesignName("");
      setShowNewDesignForm(false);
    } catch (err: any) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create design");
    }
  }

  async function handleSaveNewVariant(e: FormEvent) {
    e.preventDefault();
    setSavingVariant(true);
    setVariantModalError("");
    try {
      if (!newFvFabricId || !newFvWarpColorId || !newFvWeftColorId) {
        throw new Error("Please select fabric and both warp and weft colors.");
      }
      const effectiveDesignId = Number(newFvDesignId || designs[0]?.designId || 1);
      const created = await catalogApi.createFabricVariant({
        fabricId: Number(newFvFabricId),
        warpColorId: Number(newFvWarpColorId),
        weftColorId: Number(newFvWeftColorId),
        designId: effectiveDesignId,
      });
      const updated = await catalogApi.fabricVariants();
      setFabricVariants(updated);
      const matched = updated.find((v) => v.fabricVariantId === created.fabricVariantId) ?? created;
      applySelectedVariant(matched);
      setShowCreateVariantModal(false);
    } catch (err: any) {
      setVariantModalError(err instanceof Error ? err.message : "Failed to create fabric variant");
    } finally {
      setSavingVariant(false);
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
      const varId = selectedVariantId;
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
        setCustomDeductions([]);
        setCancelledFactors([]);
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
    setCustomDeductions([]);
    setCancelledFactors([]);
    setAddFactorOpen(false);
    const defaultVarId = Number(order.fabricVariantId ?? orderVariantId ?? 0);
    setSelectedVariantId(defaultVarId);
    const defaultVariant =
      fabricVariants.find((v) => v.fabricVariantId === defaultVarId) ?? order.fabricVariant;
    setUnitPrice(String(resolveVariantWeaverRate(defaultVariant)));
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
    const existingDeductions = ret.deductions ? [...(ret.deductions as any)] : [];
    setCustomDeductions(existingDeductions);
    const existingFactorNames = new Set(existingDeductions.map((d: any) => d.factor));
    const cancelled: string[] = [];
    if (!existingFactorNames.has("weight")) cancelled.push("weight");
    if (!existingFactorNames.has("length")) cancelled.push("length");
    if (!existingFactorNames.has("width")) cancelled.push("width");
    setCancelledFactors(cancelled);
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
          ? fabricVariantName(v, " · ")
          : "Medebegna · Biret · Geberdin";
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
    selectedVariantId,
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
    availableFactors,
    addFactorOpen,
    setAddFactorOpen,
    handleOpenAddFactor,
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
    standardLength,
    standardWidth,
    hasWeightRule: weightRate !== null,
    hasLengthRule: lengthRate !== null,
    hasWidthRule: widthRate !== null,
    flooredAvg,
    numLength,
    numWidth,
    flooredLength,
    flooredWidth,
    isCurrentUnderweight,
    isCurrentUnderlength,
    isCurrentUnderwidth,
    weightDeficit,
    lengthDeficit,
    widthDeficit,
    suggestedWeightPerPiece,
    suggestedLengthPerPiece,
    suggestedWidthPerPiece,
    cancelledAutoDeductions,
    handleCancelDeduction,
    handleRestoreDeduction,
    handleRemoveDeduction,
    handleAddCustomFactor,
    totalDeductionPerPiece,
    liveGross,
    liveDeductionAmount,
    liveNetFabricValue,
    showCreateVariantModal,
    setShowCreateVariantModal,
    savingVariant,
    variantModalError,
    newFvFabricId,
    setNewFvFabricId,
    newFvWarpColorId,
    setNewFvWarpColorId,
    newFvWeftColorId,
    setNewFvWeftColorId,
    newFvDesignId,
    setNewFvDesignId,
    showNewFabricForm,
    setShowNewFabricForm,
    inlineFabricName,
    setInlineFabricName,
    inlineFabricWeight,
    setInlineFabricWeight,
    inlineFabricLength,
    setInlineFabricLength,
    inlineFabricWidth,
    setInlineFabricWidth,
    handleCreateInlineFabric,
    showNewWarpColorForm,
    setShowNewWarpColorForm,
    inlineWarpColorName,
    setInlineWarpColorName,
    handleCreateInlineWarpColor,
    showNewWeftColorForm,
    setShowNewWeftColorForm,
    inlineWeftColorName,
    setInlineWeftColorName,
    handleCreateInlineWeftColor,
    showNewDesignForm,
    setShowNewDesignForm,
    inlineDesignName,
    setInlineDesignName,
    handleCreateInlineDesign,
    handleSelectVariantById,
    handleOpenCreateVariantModal,
    handleSaveNewVariant,
    handleSubmit,
    handleCancelEdit,
    handleStartEdit,
    handleDeleteReturn,
    groupedReturns,
    grandTotal,
  };
}
