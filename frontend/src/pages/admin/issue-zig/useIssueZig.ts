import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  catalogApi,
  workOrdersApi,
  type Color,
  type Design,
  type Fabric,
  type FabricVariant,
  type Weaver,
} from "../../../api";
import { userService, workOrderService } from "../../../infrastructure/services";
import { fabricNameFromParts } from "../../../utils/variantNames";
import { findZigZagDesignId } from "../../../utils/defaultDesign";

export interface YarnLineItem {
  id: string;
  yarnVariantId: string;
  quantity: string;
  unitPrice: string;
}

export interface UseIssueZigProps {
  targetUserId?: string;
}

export function useIssueZig({ targetUserId }: UseIssueZigProps) {
  const navigate = useNavigate();

  // Core data states
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [lastZig, setLastZig] = useState<any | null>(null);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);

  // Selected Fabric states
  const [fabricId, setFabricId] = useState("");
  const [warpColorId, setWarpColorId] = useState("");
  const [weftColorId, setWeftColorId] = useState("");
  const [designId, setDesignId] = useState("");
  const [weaverRate, setWeaverRate] = useState("0");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  // Yarn Lines
  const [yarnLines, setYarnLines] = useState<YarnLineItem[]>([
    { id: "yarn-1", yarnVariantId: "", quantity: "", unitPrice: "" },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalFabricId, setModalFabricId] = useState("");
  const [modalWarpColorId, setModalWarpColorId] = useState("");
  const [modalWeftColorId, setModalWeftColorId] = useState("");
  const [modalDesignId, setModalDesignId] = useState("");

  // Submission & Feedback
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
      workOrdersApi.list({ weaverUserId: wid }).catch(() => []),
    ])
      .then(([w, lookup, fv, yv, orders]) => {
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

        const rawOrders = Array.isArray(orders) ? orders : [];
        const previousOrders = rawOrders.filter((o: any) => {
          const orderWid = o.weaverUserId ?? o.weaver?.userId;
          return Number(orderWid) === wid;
        });
        const prev = previousOrders[0] ?? null;
        setLastZig(prev);

        // Initialize fabric selection
        let initialFabric = lookup.fabrics[0];
        let initialWarp = lookup.colors[0];
        let initialWeft = lookup.colors[0];
        let initialDesignId = String(
          findZigZagDesignId(lookup.designs as any) ??
          lookup.designs[0]?.designId ??
          ""
        );

        if (prev?.fabricVariant) {
          const pv = prev.fabricVariant;
          if (pv.fabric) initialFabric = pv.fabric;
          if (pv.warpColor) initialWarp = pv.warpColor;
          if (pv.weftColor) initialWeft = pv.weftColor;
          if (pv.design) initialDesignId = String(pv.design.designId);
        }

        if (initialFabric) {
          setFabricId(String(initialFabric.fabricId));
          const p = (initialFabric as any).prices?.[0] || (initialFabric as any).currentPrice;
          if (p) setWeaverRate(String(p.weaverRate ?? "0"));
        }
        if (initialWarp) setWarpColorId(String(initialWarp.colorId));
        if (initialWeft) setWeftColorId(String(initialWeft.colorId));
        if (initialDesignId) setDesignId(initialDesignId);

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

  const selectedFabric = useMemo(() => {
    return fabrics.find((f) => String(f.fabricId) === fabricId) ?? fabrics[0];
  }, [fabrics, fabricId]);

  const selectedWarpColor = useMemo(() => {
    return colors.find((c) => String(c.colorId) === warpColorId) ?? colors[0];
  }, [colors, warpColorId]);

  const selectedWeftColor = useMemo(() => {
    return colors.find((c) => String(c.colorId) === weftColorId) ?? colors[0];
  }, [colors, weftColorId]);

  const selectedDesign = useMemo(() => {
    return designs.find((d) => String(d.designId) === designId) ?? null;
  }, [designs, designId]);

  const fabricDisplayName = useMemo(() => {
    if (!selectedFabric) return "Selecting fabric...";
    const prodName = selectedFabric.name;
    const warp = selectedWarpColor?.name;
    const weft = selectedWeftColor?.name;
    const des = selectedDesign?.name;
    return fabricNameFromParts(prodName, warp, weft, des, " · ");
  }, [selectedFabric, selectedWarpColor, selectedWeftColor, selectedDesign]);

  const fabricSpecs = useMemo(() => {
    const weight = selectedFabric?.standardWeightG ?? 64;
    const length = selectedFabric?.standardLengthCm ?? 200;
    const width = selectedFabric?.standardWidthCm ?? 100;
    return { weight, length, width };
  }, [selectedFabric]);

  function handleUseSameSetup() {
    if (!lastZig) return;
    if (lastZig.fabricVariant) {
      const pv = lastZig.fabricVariant;
      if (pv.fabric?.fabricId) setFabricId(String(pv.fabric.fabricId));
      else if (pv.fabricId) setFabricId(String(pv.fabricId));

      if (pv.warpColor?.colorId) setWarpColorId(String(pv.warpColor.colorId));
      if (pv.weftColor?.colorId) setWeftColorId(String(pv.weftColor.colorId));
      if (pv.design?.designId) setDesignId(String(pv.design.designId));

      const price = pv.basePrice ?? pv.currentPrice?.weaverRate;
      if (price) setWeaverRate(String(price));
      setSelectedVariantId(String(pv.fabricVariantId));
    } else if (lastZig.fabric?.fabricId) {
      setFabricId(String(lastZig.fabric.fabricId));
    }

    if (lastZig.yarnGiven && Array.isArray(lastZig.yarnGiven) && lastZig.yarnGiven.length > 0) {
      setYarnLines(
        lastZig.yarnGiven.map((yg: any, idx: number) => {
          const matchedVariant = yarnVariants.find(
            (y) => y.yarnVariantId === (yg.yarnVariant?.yarnVariantId ?? yg.yarnVariantId)
          );
          const price = matchedVariant?.sellingPrice ?? yg.unitPrice ?? 0;
          return {
            id: `yarn-repeat-${Date.now()}-${idx}`,
            yarnVariantId: String(yg.yarnVariant?.yarnVariantId ?? yg.yarnVariantId ?? ""),
            quantity: String(yg.quantity ?? "40"),
            unitPrice: String(price),
          };
        })
      );
    }
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

  function openFabricModal() {
    setModalFabricId(fabricId);
    setModalWarpColorId(warpColorId);
    setModalWeftColorId(weftColorId);
    setModalDesignId(designId);
    setModalSearch("");
    setIsModalOpen(true);
  }

  function handleSelectModalVariant(variant: FabricVariant) {
    if (variant.fabric?.fabricId) setModalFabricId(String(variant.fabric.fabricId));
    else if (variant.fabricId) setModalFabricId(String(variant.fabricId));

    if (variant.warpColor?.colorId) setModalWarpColorId(String(variant.warpColor.colorId));
    if (variant.weftColor?.colorId) setModalWeftColorId(String(variant.weftColor.colorId));
    if (variant.design?.designId) setModalDesignId(String(variant.design.designId));
    setSelectedVariantId(String(variant.fabricVariantId));
  }

  function handleApplyModalFabric() {
    setFabricId(modalFabricId);
    setWarpColorId(modalWarpColorId);
    setWeftColorId(modalWeftColorId);
    setDesignId(modalDesignId);

    const match = fabricVariants.find(
      (v) =>
        String(v.fabricId ?? v.fabric?.fabricId) === modalFabricId &&
        String(v.warpColorId ?? v.warpColor?.colorId) === modalWarpColorId &&
        String(v.weftColorId ?? v.weftColor?.colorId) === modalWeftColorId &&
        String(v.designId ?? v.design?.designId) === modalDesignId
    );
    if (match) {
      setSelectedVariantId(String(match.fabricVariantId));
    }

    const fab = fabrics.find((f) => String(f.fabricId) === modalFabricId);
    if (fab) {
      const p = (fab as any).prices?.[0] || (fab as any).currentPrice;
      if (p) setWeaverRate(String(p.weaverRate ?? "0"));
    }
    setIsModalOpen(false);
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
    if (!fabricId) problems.push("Please select a fabric type.");

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
  }, [fabricId, lineCalculations]);

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
      let finalVariantId = selectedVariantId ? Number(selectedVariantId) : 0;
      if (!finalVariantId) {
        const match = fabricVariants.find(
          (v) =>
            String(v.fabricId ?? v.fabric?.fabricId) === fabricId &&
            String(v.warpColorId ?? v.warpColor?.colorId) === warpColorId &&
            String(v.weftColorId ?? v.weftColor?.colorId) === weftColorId &&
            String(v.designId ?? v.design?.designId) === designId
        );
        if (match) {
          finalVariantId = match.fabricVariantId;
        } else if (fabricId && warpColorId && weftColorId && designId) {
          const createdFv = await catalogApi.createFabricVariant({
            fabricId: Number(fabricId),
            warpColorId: Number(warpColorId),
            weftColorId: Number(weftColorId),
            designId: Number(designId),
          });
          finalVariantId = createdFv.fabricVariantId;
        }
      }

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
    lastZig,
    fabrics,
    colors,
    designs,
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
    handleUseSameSetup,
    handleAddYarnLine,
    handleRemoveYarnLine,
    handleYarnVariantChange,
    handleQuantityChange,
    openFabricModal,
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
    handleSelectModalVariant,
    handleApplyModalFabric,
    handleSubmit,
  };
}
