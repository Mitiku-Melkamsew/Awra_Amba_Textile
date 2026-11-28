import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  catalogApi,
  type Color,
  type Design,
  type Fabric,
  type FabricVariant,
  type Weaver,
} from "../../../api";
import { userService, workOrderService } from "../../../infrastructure/services";
import { fabricVariantName } from "../../../utils/variantNames";
import { findZigZagDesignId } from "../../../utils/defaultDesign";
import { useCreateFabricVariant } from "../../../components/useCreateFabricVariant";

export interface YarnLineItem {
  id: string;
  yarnVariantId: string;
  quantity: string;
  unitPrice: string;
}

export interface UseIssueZigProps {
  targetUserId?: string;
}

function resolveVariantWeaverRate(variant: any, fabrics: Fabric[]): number {
  const direct = Number(
    variant?.currentPrice?.weaverRate ??
      variant?.fabric?.prices?.[0]?.weaverRate ??
      variant?.prices?.[0]?.weaverRate ??
      variant?.weaverRate ??
      variant?.basePrice ??
      0
  );
  if (direct > 0) return direct;
  const fId = Number(variant?.fabricId ?? variant?.fabric?.fabricId ?? 0);
  const fab = fabrics.find((f) => f.fabricId === fId);
  const fabPrice = (fab as any)?.prices?.[0] ?? (fab as any)?.currentPrice;
  return fabPrice ? Number(fabPrice.weaverRate ?? 0) : 0;
}

export function useIssueZig({ targetUserId }: UseIssueZigProps) {
  const navigate = useNavigate();

  // Core data states
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);

  // Selected Fabric Variant state
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [weaverRate, setWeaverRate] = useState("0");

  // Yarn Lines
  const [yarnLines, setYarnLines] = useState<YarnLineItem[]>([
    { id: "yarn-1", yarnVariantId: "", quantity: "", unitPrice: "" },
  ]);

  // Submission & Feedback
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  function applySelectedVariant(variant: FabricVariant | undefined, fabricList: Fabric[] = fabrics) {
    if (!variant) {
      setSelectedVariantId("");
      setWeaverRate("0");
      return;
    }
    setSelectedVariantId(String(variant.fabricVariantId));
    setWeaverRate(String(resolveVariantWeaverRate(variant, fabricList)));
  }

  const variantModal = useCreateFabricVariant({
    fabrics,
    setFabrics,
    colors,
    setColors,
    designs,
    setDesigns,
    setFabricVariants,
    onSelectCreated: (created) => applySelectedVariant(created),
  });

  // Load initial data
  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);
    const wid = Number(targetUserId);

    Promise.all([
      userService.getUser(wid).then((u) => {
        const parts = u.fullName.split(" ");
        return {
          userId: u.userId,
          fullName: u.fullName,
          firstName: parts[0] || u.fullName,
          lastName: parts.slice(1).join(" ") || "",
          phone: u.phone,
          email: u.email ?? null,
          isActive: u.isActive,
        } as Weaver;
      }),
      catalogApi.lookup(),
      catalogApi.fabricVariants(),
      catalogApi.yarnVariants(),
    ])
      .then(([w, lookup, fv, yv]) => {
        setWeaver(w);
        setFabrics(lookup.fabrics);
        setColors(lookup.colors);
        setDesigns(lookup.designs);
        setFabricVariants(fv);

        const enrichedYarnVariants = (yv as any[]).map((y) => ({
          ...y,
          stockSnapshot: Number(y.stockSnapshot ?? 0),
          sellingPrice: Number(y.sellingPrice ?? y.purchasePrice ?? y.basePrice ?? 0),
        }));
        setYarnVariants(enrichedYarnVariants);

        // Initialize default fabric variant selection
        const initialFabricId = String(lookup.fabrics[0]?.fabricId ?? "");
        const initialColorId = String(lookup.colors[0]?.colorId ?? "");
        const initialDesignId = String(
          findZigZagDesignId(lookup.designs as any) ?? lookup.designs[0]?.designId ?? ""
        );
        const defaultMatch =
          fv.find(
            (v) =>
              String(v.fabricId ?? v.fabric?.fabricId) === initialFabricId &&
              String(v.warpColorId ?? v.warpColor?.colorId) === initialColorId &&
              String(v.weftColorId ?? v.weftColor?.colorId) === initialColorId &&
              String(v.designId ?? v.design?.designId) === initialDesignId
          ) ?? fv[0];

        applySelectedVariant(defaultMatch, lookup.fabrics);

        const inStockYarns = enrichedYarnVariants.filter((y) => y.stockSnapshot > 0);
        const defaultYarn = inStockYarns[0] ?? null;
        if (defaultYarn) {
          const safeQty = Math.min(10, defaultYarn.stockSnapshot);
          setYarnLines([
            {
              id: `yarn-${Date.now()}-1`,
              yarnVariantId: String(defaultYarn.yarnVariantId),
              quantity: String(safeQty),
              unitPrice: String(defaultYarn.sellingPrice || defaultYarn.basePrice || "0"),
            },
          ]);
        } else {
          setYarnLines([]);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load data"))
      .finally(() => setLoading(false));
  }, [targetUserId]);

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return undefined;
    return fabricVariants.find((v) => String(v.fabricVariantId) === selectedVariantId);
  }, [fabricVariants, selectedVariantId]);

  const selectedFabric = useMemo(() => {
    if (!selectedVariant) return undefined;
    const fId = selectedVariant.fabricId ?? selectedVariant.fabric?.fabricId;
    return fabrics.find((f) => f.fabricId === Number(fId)) ?? selectedVariant.fabric;
  }, [selectedVariant, fabrics]);

  const fabricDisplayName = useMemo(() => {
    if (!selectedVariant) return "Select a fabric variant...";
    return fabricVariantName(selectedVariant, " · ");
  }, [selectedVariant]);

  const fabricSpecs = useMemo(() => {
    const weight = selectedFabric?.standardWeightG ?? 64;
    const length = selectedFabric?.standardLengthCm ?? 200;
    const width = selectedFabric?.standardWidthCm ?? 100;
    return { weight, length, width };
  }, [selectedFabric]);

  function handleSelectVariantById(variantIdStr: string) {
    if (!variantIdStr) {
      applySelectedVariant(undefined);
      return;
    }
    const match = fabricVariants.find((v) => String(v.fabricVariantId) === variantIdStr);
    applySelectedVariant(match);
  }

  function handleOpenAddNewFabric(query?: string) {
    variantModal.open({
      searchQuery: query,
      currentVariant: selectedVariant ?? null,
    });
  }

  function handleAddYarnLine() {
    const inStock = yarnVariants.filter((y) => y.stockSnapshot > 0);
    const chosen = inStock[0] ?? yarnVariants[0];
    const newRow: YarnLineItem = {
      id: `yarn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      yarnVariantId: chosen ? String(chosen.yarnVariantId) : "",
      quantity: "40",
      unitPrice: chosen ? String(chosen.sellingPrice ?? chosen.basePrice ?? "0") : "0",
    };
    setYarnLines((prev) => [...prev, newRow]);
  }

  function handleRemoveYarnLine(id: string) {
    setYarnLines((prev) => prev.filter((l) => l.id !== id));
  }

  function handleYarnVariantChange(lineId: string, variantIdStr: string) {
    const matched = yarnVariants.find((y) => String(y.yarnVariantId) === variantIdStr);
    const price = matched?.sellingPrice ?? matched?.basePrice ?? 0;
    setYarnLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              yarnVariantId: variantIdStr,
              unitPrice: price ? String(price) : l.unitPrice,
            }
          : l
      )
    );
  }

  function handleQuantityChange(lineId: string, qtyStr: string) {
    setYarnLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, quantity: qtyStr } : l))
    );
  }

  function handleUnitPriceChange(lineId: string, priceStr: string) {
    setYarnLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, unitPrice: priceStr } : l))
    );
  }

  const lineCalculations = useMemo(() => {
    return yarnLines.map((line, idx) => {
      const variant = yarnVariants.find((y) => String(y.yarnVariantId) === line.yarnVariantId);
      const stock = variant ? Number(variant.stockSnapshot ?? 0) : 0;
      const qty = Number(line.quantity || 0);
      const price = Number(line.unitPrice || variant?.sellingPrice || 0);
      const stockAfter = stock - qty;
      const isExceeded = Boolean(line.yarnVariantId && qty > stock);
      const isMissingVariant = !line.yarnVariantId;
      const isInvalidQty = Number.isNaN(qty) || qty < 0;

      return {
        line,
        idx,
        variant,
        stock,
        qty,
        price,
        lineTotal: qty * price,
        stockAfter,
        isExceeded,
        isMissingVariant,
        isInvalidQty,
      };
    });
  }, [yarnLines, yarnVariants]);

  const totalLines = useMemo(
    () => lineCalculations.filter((c) => !c.isMissingVariant && c.qty > 0).length,
    [lineCalculations]
  );

  const totalQuantity = useMemo(
    () => lineCalculations.reduce((acc, c) => acc + (c.qty > 0 ? c.qty : 0), 0),
    [lineCalculations]
  );

  const totalYarnValue = useMemo(
    () => lineCalculations.reduce((acc, c) => acc + (c.qty > 0 ? c.lineTotal : 0), 0),
    [lineCalculations]
  );

  const validationProblems = useMemo(() => {
    const problems: string[] = [];
    if (!selectedVariantId) problems.push("Please select a fabric type.");

    lineCalculations.forEach((c) => {
      const hasAnyInput = Boolean(c.line.yarnVariantId || c.line.quantity);
      if (hasAnyInput) {
        if (!c.line.yarnVariantId) {
          problems.push(`Yarn line ${c.idx + 1}: please choose a yarn variant or remove this line.`);
        } else if (c.isInvalidQty || c.qty <= 0) {
          problems.push(`Yarn line ${c.idx + 1}: quantity must be greater than zero.`);
        } else if (c.isExceeded) {
          problems.push(
            `Yarn line ${c.idx + 1} is more than the stock available (only ${c.stock} in stock).`
          );
        }
      }
    });

    return problems;
  }, [selectedVariantId, lineCalculations]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!targetUserId) {
      setError("Weaver ID is missing.");
      return;
    }
    if (validationProblems.length > 0) {
      setError(validationProblems[0]);
      return;
    }
    setSaving(true);
    setError("");

    try {
      const finalVariantId = selectedVariantId ? Number(selectedVariantId) : 0;
      if (!finalVariantId) {
        throw new Error("Please select a valid fabric variant");
      }

      await workOrderService.createWorkOrder({
        weaverUserId: Number(targetUserId),
        fabricVariantId: finalVariantId,
        yarnLines: lineCalculations
          .filter((c) => c.line.yarnVariantId && c.qty > 0)
          .map((c) => ({
            yarnVariantId: Number(c.line.yarnVariantId),
            quantity: c.qty,
            unitPrice: c.price,
          })),
      });

      navigate(`/admin/weavers/${targetUserId}`);
    } catch (err: any) {
      setError(err.message || "Failed to issue work order");
    } finally {
      setSaving(false);
    }
  }

  const weaverDisplayName = weaver ? weaver.fullName || `Weaver #${weaver.userId}` : "";
  const isDeactivated = Boolean(weaver && (weaver.isActive === false || weaver.user?.isActive === false));

  return {
    weaver,
    weaverDisplayName,
    isDeactivated,
    selectedVariantId,
    fabricVariants,
    yarnVariants,
    fabricDisplayName,
    fabricSpecs,
    weaverRate,
    yarnLines,
    lineCalculations,
    totalLines,
    totalQuantity,
    totalYarnValue,
    validationProblems,
    notes,
    setNotes,
    error,
    saving,
    loading,
    variantModal,
    handleSelectVariantById,
    handleOpenAddNewFabric,
    handleAddYarnLine,
    handleRemoveYarnLine,
    handleYarnVariantChange,
    handleQuantityChange,
    handleUnitPriceChange,
    handleSubmit,
  };
}
