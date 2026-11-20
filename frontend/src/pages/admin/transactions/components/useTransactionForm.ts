import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  catalogApi,
  merchantsApi,
  transactionsApi,
  weaversApi,
  type Weaver,
} from "../../../../api";
import { txnTypeFromRoute } from "../../../../utils/transactionTypes";

export type TxnCategory =
  | "yarn_purchase"
  | "fabric_purchase_from_weaver"
  | "yarn_sale_to_weaver"
  | "fabric_sale_to_merchant";

export interface LineItemDraft {
  id: string;
  variantId: string;
  quantity: string;
  unitPrice: string;
}

export function useTransactionForm() {
  const { direction, goods } = useParams<{
    direction?: string;
    goods?: string;
  }>();
  const navigate = useNavigate();

  // Determine initial category from route or default to fabric_sale_to_merchant
  const initialCategory: TxnCategory = useMemo(() => {
    if (direction && goods) {
      const mapped = txnTypeFromRoute(direction, goods);
      if (mapped) return mapped as TxnCategory;
    }
    return "fabric_sale_to_merchant";
  }, [direction, goods]);

  const [category, setCategory] = useState<TxnCategory>(initialCategory);

  useEffect(() => {
    if (direction && goods) {
      const mapped = txnTypeFromRoute(direction, goods);
      if (mapped) setCategory(mapped as TxnCategory);
    }
  }, [direction, goods]);

  // Counterparty selection
  const [supplierId, setSupplierId] = useState("");
  const [weaverUserId, setWeaverUserId] = useState("");
  const [merchantUserId, setMerchantUserId] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  // Lines
  const [lines, setLines] = useState<LineItemDraft[]>([
    { id: "1", variantId: "", quantity: "10", unitPrice: "" },
  ]);

  // Catalogs & reference data
  const [suppliers, setSuppliers] = useState<
    Array<{ supplierId: number; name: string }>
  >([]);
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [merchants, setMerchants] = useState<
    Array<{ userId: number; companyName: string | null; contactPhone: string }>
  >([]);
  const [fabricVariants, setFabricVariants] = useState<any[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [yarns, setYarns] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);

  // Quick Add Party Modal state
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");

  // Quick Add Variant Modal state
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [targetLineIdForVariant, setTargetLineIdForVariant] = useState<
    string | null
  >(null);
  const [savingVariant, setSavingVariant] = useState(false);
  const [variantModalError, setVariantModalError] = useState("");

  // Fabric Variant Fields
  const [newFvFabricId, setNewFvFabricId] = useState("");
  const [newFvWarpColorId, setNewFvWarpColorId] = useState("");
  const [newFvWeftColorId, setNewFvWeftColorId] = useState("");
  const [newFvDesignId, setNewFvDesignId] = useState("");
  const [newFvSku, setNewFvSku] = useState("");

  // Yarn Variant Fields
  const [newYvYarnId, setNewYvYarnId] = useState("");
  const [newYvColorId, setNewYvColorId] = useState("");
  const [newYvSupplierId, setNewYvSupplierId] = useState("");
  const [newYvSku, setNewYvSku] = useState("");

  // Inline Creation Sub-Forms inside Add Variant Modal
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

  const [showNewYarnForm, setShowNewYarnForm] = useState(false);
  const [inlineYarnName, setInlineYarnName] = useState("");

  const [showNewYarnColorForm, setShowNewYarnColorForm] = useState(false);
  const [inlineYarnColorName, setInlineYarnColorName] = useState("");

  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [inlineSupplierName, setInlineSupplierName] = useState("");
  const [inlineSupplierPhone, setInlineSupplierPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load catalogs
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [lookup, w, m, f, y] = await Promise.all([
          catalogApi.lookup(),
          weaversApi.list({ active: true }).catch(() => []),
          merchantsApi.list({ active: true }).catch(() => []),
          catalogApi.fabricVariants().catch(() => []),
          catalogApi.yarnVariants().catch(() => []),
        ]);

        if (!isMounted) return;

        setSuppliers(lookup.suppliers || []);
        setFabrics(lookup.fabrics || []);
        setYarns(lookup.yarns || []);
        setColors(lookup.colors || []);
        setDesigns(lookup.designs || []);
        setWeavers(w || []);
        setMerchants(m || []);
        setFabricVariants(f || []);
        setYarnVariants(y || []);

        if (lookup.suppliers?.[0])
          setSupplierId(String(lookup.suppliers[0].supplierId));
        if (w?.[0]) setWeaverUserId(String(w[0].userId));
        if (m?.[0]) {
          setMerchantUserId(String(m[0].userId));
        }

        // Initialize first item default variant
        if (f.length > 0) {
          const inStock = f.filter(
            (v: any) => Number(v.stockSnapshot ?? 0) > 0
          );
          const pick = inStock[0] || f[0];
          setLines([
            {
              id: "1",
              variantId: String(pick.fabricVariantId),
              quantity: "10",
              unitPrice: pick.sellingPrice
                ? String(pick.sellingPrice)
                : String(pick.basePrice || "1380"),
            },
          ]);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load catalog data");
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const isFabric =
    category === "fabric_sale_to_merchant" ||
    category === "fabric_purchase_from_weaver";
  const isSale =
    category === "fabric_sale_to_merchant" ||
    category === "yarn_sale_to_weaver";

  const handleCategoryChange = (newCat: TxnCategory) => {
    setCategory(newCat);
    const isNowFabric =
      newCat === "fabric_sale_to_merchant" ||
      newCat === "fabric_purchase_from_weaver";
    if (isNowFabric && fabricVariants.length > 0) {
      const pick = fabricVariants[0];
      setLines([
        {
          id: "1",
          variantId: String(pick.fabricVariantId),
          quantity: "10",
          unitPrice: pick.sellingPrice
            ? String(pick.sellingPrice)
            : String(pick.basePrice || "1380"),
        },
      ]);
    } else if (!isNowFabric && yarnVariants.length > 0) {
      const pick = yarnVariants[0];
      setLines([
        {
          id: "1",
          variantId: String(pick.yarnVariantId),
          quantity: "10",
          unitPrice: pick.sellingPrice
            ? String(pick.sellingPrice)
            : String(pick.basePrice || "250"),
        },
      ]);
    }
  };

  const handleAddLine = () => {
    const nextId = String(Date.now());
    if (isFabric) {
      const pick = fabricVariants[0];
      setLines((prev) => [
        ...prev,
        {
          id: nextId,
          variantId: pick ? String(pick.fabricVariantId) : "",
          quantity: "10",
          unitPrice: pick
            ? pick.sellingPrice
              ? String(pick.sellingPrice)
              : String(pick.basePrice || "1380")
            : "",
        },
      ]);
    } else {
      const pick = yarnVariants[0];
      setLines((prev) => [
        ...prev,
        {
          id: nextId,
          variantId: pick ? String(pick.yarnVariantId) : "",
          quantity: "10",
          unitPrice: pick
            ? pick.sellingPrice
              ? String(pick.sellingPrice)
              : String(pick.basePrice || "250")
            : "",
        },
      ]);
    }
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLine = (
    id: string,
    field: keyof LineItemDraft,
    val: string
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: val };
        // Auto-fill price if variant changes
        if (field === "variantId") {
          if (isFabric) {
            const fv = fabricVariants.find(
              (f) => String(f.fabricVariantId) === val
            );
            if (fv) {
              updated.unitPrice = fv.sellingPrice
                ? String(fv.sellingPrice)
                : String(fv.basePrice || "");
            }
          } else {
            const yv = yarnVariants.find(
              (y) => String(y.yarnVariantId) === val
            );
            if (yv) {
              updated.unitPrice = yv.sellingPrice
                ? String(yv.sellingPrice)
                : String(yv.basePrice || "");
            }
          }
        }
        return updated;
      })
    );
  };

  const calculatedGrandTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const q = parseFloat(l.quantity) || 0;
      const p = parseFloat(l.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  }, [lines]);

  const totalQuantity = useMemo(() => {
    return lines.reduce((sum, l) => sum + (parseFloat(l.quantity) || 0), 0);
  }, [lines]);

  const counterpartySummaryName = useMemo(() => {
    if (category === "fabric_sale_to_merchant") {
      const m = merchants.find((x) => String(x.userId) === merchantUserId);
      return m ? m.companyName || `Merchant #${m.userId}` : "[merchant]";
    }
    if (category === "yarn_purchase") {
      const s = suppliers.find((x) => String(x.supplierId) === supplierId);
      return s ? s.name : "[supplier]";
    }
    const w = weavers.find((x) => String(x.userId) === weaverUserId);
    return w ? w.fullName : "[weaver]";
  }, [
    category,
    merchantUserId,
    supplierId,
    weaverUserId,
    merchants,
    suppliers,
    weavers,
  ]);

  const categoryLabel = useMemo(() => {
    switch (category) {
      case "fabric_sale_to_merchant":
        return "Sell fabric";
      case "fabric_purchase_from_weaver":
        return "Buy fabric";
      case "yarn_sale_to_weaver":
        return "Sell yarn";
      case "yarn_purchase":
        return "Buy yarn";
    }
  }, [category]);

  const handleQuickAddParty = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    try {
      if (category === "fabric_sale_to_merchant") {
        const m = await merchantsApi.create({
          companyName: newPartyName.trim(),
          contactPhone: newPartyPhone.trim(),
        });
        setMerchants((prev) => [...prev, m]);
        setMerchantUserId(String(m.userId));
      } else if (category === "yarn_purchase") {
        const supp = await catalogApi.createSupplier({
          name: newPartyName.trim(),
          contactPhone: newPartyPhone.trim() || undefined,
        });
        setSuppliers((prev) => [...prev, supp]);
        setSupplierId(String(supp.supplierId));
      } else {
        const w = await weaversApi.create({
          fullName: newPartyName.trim(),
          phone: newPartyPhone.trim(),
        });
        setWeavers((prev) => [...prev, w as any]);
        setWeaverUserId(String(w.userId));
      }
      setShowAddPartyModal(false);
      setNewPartyName("");
      setNewPartyPhone("");
    } catch (err: any) {
      setError(err.message || "Failed to create party");
    }
  };

  const handleOpenAddVariantModal = (lineId?: string, query?: string) => {
    setTargetLineIdForVariant(lineId || lines[0]?.id || null);
    setVariantModalError("");
    setShowNewFabricForm(false);
    setShowNewWarpColorForm(false);
    setShowNewWeftColorForm(false);
    setShowNewDesignForm(false);
    setShowNewYarnForm(false);
    setShowNewYarnColorForm(false);
    setShowNewSupplierForm(false);

    if (isFabric) {
      if (fabrics.length > 0 && !newFvFabricId)
        setNewFvFabricId(String(fabrics[0].fabricId));
      if (colors.length > 0 && !newFvWarpColorId)
        setNewFvWarpColorId(String(colors[0].colorId));
      if (colors.length > 0 && !newFvWeftColorId)
        setNewFvWeftColorId(String(colors[0].colorId));
      if (designs.length > 0 && !newFvDesignId)
        setNewFvDesignId(String(designs[0].designId));
      if (query && !newFvSku) setNewFvSku(query.trim());
    } else {
      if (yarns.length > 0 && !newYvYarnId)
        setNewYvYarnId(String(yarns[0].yarnId));
      if (colors.length > 0 && !newYvColorId)
        setNewYvColorId(String(colors[0].colorId));
      if (suppliers.length > 0 && !newYvSupplierId)
        setNewYvSupplierId(String(suppliers[0].supplierId));
      if (query && !newYvSku) setNewYvSku(query.trim());
    }
    setShowAddVariantModal(true);
  };

  const handleCreateInlineFabric = async () => {
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
      setVariantModalError(err.message || "Failed to create base fabric");
    }
  };

  const handleCreateInlineWarpColor = async () => {
    if (!inlineWarpColorName.trim()) return;
    try {
      const created = await catalogApi.createColor({
        name: inlineWarpColorName.trim(),
      });
      setColors((prev) => [...prev, created]);
      setNewFvWarpColorId(String(created.colorId));
      setInlineWarpColorName("");
      setShowNewWarpColorForm(false);
    } catch (err: any) {
      setVariantModalError(err.message || "Failed to create color");
    }
  };

  const handleCreateInlineWeftColor = async () => {
    if (!inlineWeftColorName.trim()) return;
    try {
      const created = await catalogApi.createColor({
        name: inlineWeftColorName.trim(),
      });
      setColors((prev) => [...prev, created]);
      setNewFvWeftColorId(String(created.colorId));
      setInlineWeftColorName("");
      setShowNewWeftColorForm(false);
    } catch (err: any) {
      setVariantModalError(err.message || "Failed to create color");
    }
  };

  const handleCreateInlineDesign = async () => {
    if (!inlineDesignName.trim()) return;
    try {
      const created = await catalogApi.createDesign({
        name: inlineDesignName.trim(),
      });
      setDesigns((prev) => [...prev, created]);
      setNewFvDesignId(String(created.designId));
      setInlineDesignName("");
      setShowNewDesignForm(false);
    } catch (err: any) {
      setVariantModalError(err.message || "Failed to create design");
    }
  };

  const handleCreateInlineYarn = async () => {
    if (!inlineYarnName.trim()) return;
    try {
      const created = await catalogApi.createYarn({
        name: inlineYarnName.trim(),
      });
      setYarns((prev) => [...prev, created]);
      setNewYvYarnId(String(created.yarnId));
      setInlineYarnName("");
      setShowNewYarnForm(false);
    } catch (err: any) {
      setVariantModalError(err.message || "Failed to create yarn material");
    }
  };

  const handleCreateInlineYarnColor = async () => {
    if (!inlineYarnColorName.trim()) return;
    try {
      const created = await catalogApi.createColor({
        name: inlineYarnColorName.trim(),
      });
      setColors((prev) => [...prev, created]);
      setNewYvColorId(String(created.colorId));
      setInlineYarnColorName("");
      setShowNewYarnColorForm(false);
    } catch (err: any) {
      setVariantModalError(err.message || "Failed to create color");
    }
  };

  const handleCreateInlineSupplier = async () => {
    if (!inlineSupplierName.trim()) return;
    try {
      const created = await catalogApi.createSupplier({
        name: inlineSupplierName.trim(),
        contactPhone: inlineSupplierPhone.trim() || undefined,
      });
      setSuppliers((prev) => [...prev, created]);
      setNewYvSupplierId(String(created.supplierId));
      setInlineSupplierName("");
      setInlineSupplierPhone("");
      setShowNewSupplierForm(false);
    } catch (err: any) {
      setVariantModalError(err.message || "Failed to create supplier");
    }
  };

  const handleSaveNewVariant = async (e: FormEvent) => {
    e.preventDefault();
    setSavingVariant(true);
    setVariantModalError("");
    try {
      if (isFabric) {
        if (!newFvFabricId || !newFvWarpColorId || !newFvWeftColorId) {
          throw new Error(
            "Please select fabric and both warp and weft colors."
          );
        }
        const effectiveDesignId = Number(
          newFvDesignId || designs[0]?.designId || 1
        );
        const created = await catalogApi.createFabricVariant({
          fabricId: Number(newFvFabricId),
          warpColorId: Number(newFvWarpColorId),
          weftColorId: Number(newFvWeftColorId),
          designId: effectiveDesignId,
          sku: newFvSku.trim() || undefined,
        });
        const updated = await catalogApi.fabricVariants();
        setFabricVariants(updated);
        if (targetLineIdForVariant) {
          handleUpdateLine(
            targetLineIdForVariant,
            "variantId",
            String(created.fabricVariantId)
          );
        }
      } else {
        if (!newYvYarnId || !newYvColorId || !newYvSupplierId) {
          throw new Error("Please select yarn, color, and supplier.");
        }
        const created = await catalogApi.createYarnVariant({
          yarnId: Number(newYvYarnId),
          colorId: Number(newYvColorId),
          supplierId: Number(newYvSupplierId),
          sku: newYvSku.trim() || undefined,
        });
        const updated = await catalogApi.yarnVariants();
        setYarnVariants(updated);
        if (targetLineIdForVariant) {
          handleUpdateLine(
            targetLineIdForVariant,
            "variantId",
            String(created.yarnVariantId)
          );
        }
      }
      setShowAddVariantModal(false);
      setNewFvSku("");
      setNewYvSku("");
    } catch (err: any) {
      setVariantModalError(err.message || "Failed to create variant");
    } finally {
      setSavingVariant(false);
    }
  };

  const handleSaveTransaction = async () => {
    setSaving(true);
    setError("");

    try {
      const parsedLines = lines.map((l) => ({
        fabricVariantId: isFabric
          ? l.variantId
            ? Number(l.variantId)
            : null
          : null,
        yarnVariantId: !isFabric
          ? l.variantId
            ? Number(l.variantId)
            : null
          : null,
        quantity: Number(l.quantity || 0),
        unitPrice: Number(l.unitPrice || 0),
      }));

      for (let i = 0; i < parsedLines.length; i++) {
        const line = parsedLines[i];
        if (isFabric && !line.fabricVariantId) {
          throw new Error(`Line ${i + 1}: Please select a fabric variant.`);
        }
        if (!isFabric && !line.yarnVariantId) {
          throw new Error(`Line ${i + 1}: Please select a yarn variant.`);
        }
        if (line.quantity <= 0) {
          throw new Error(`Line ${i + 1}: Quantity must be greater than 0.`);
        }
      }

      let effectiveSupplierId: number | undefined;
      if (category === "yarn_purchase") {
        if (supplierId) {
          effectiveSupplierId = Number(supplierId);
        } else {
          const firstLineYvId = parsedLines[0]?.yarnVariantId;
          const yv = yarnVariants.find((y) => y.yarnVariantId === firstLineYvId);
          if (yv?.supplierId) {
            effectiveSupplierId = yv.supplierId;
          }
        }
      }

      const res = await transactionsApi.create({
        type: category,
        supplierId: effectiveSupplierId,
        weaverUserId:
          category === "fabric_purchase_from_weaver" ||
          category === "yarn_sale_to_weaver"
            ? Number(weaverUserId)
            : undefined,
        merchantUserId:
          category === "fabric_sale_to_merchant"
            ? Number(merchantUserId)
            : undefined,
        notes: notes || undefined,
        lines: parsedLines,
      });

      navigate(`/admin/transactions/${res.transactionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to save transaction");
      setSaving(false);
    }
  };

  return {
    category,
    setCategory,
    handleCategoryChange,
    isFabric,
    isSale,
    categoryLabel,
    supplierId,
    setSupplierId,
    weaverUserId,
    setWeaverUserId,
    merchantUserId,
    setMerchantUserId,
    date,
    setDate,
    notes,
    setNotes,
    lines,
    setLines,
    handleAddLine,
    handleRemoveLine,
    handleUpdateLine,
    calculatedGrandTotal,
    totalQuantity,
    counterpartySummaryName,
    suppliers,
    weavers,
    merchants,
    fabricVariants,
    yarnVariants,
    fabrics,
    yarns,
    colors,
    designs,
    showAddPartyModal,
    setShowAddPartyModal,
    newPartyName,
    setNewPartyName,
    newPartyPhone,
    setNewPartyPhone,
    handleQuickAddParty,
    showAddVariantModal,
    setShowAddVariantModal,
    targetLineIdForVariant,
    handleOpenAddVariantModal,
    handleSaveNewVariant,
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
    newFvSku,
    setNewFvSku,
    newYvYarnId,
    setNewYvYarnId,
    newYvColorId,
    setNewYvColorId,
    newYvSupplierId,
    setNewYvSupplierId,
    newYvSku,
    setNewYvSku,
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
    showNewYarnForm,
    setShowNewYarnForm,
    inlineYarnName,
    setInlineYarnName,
    handleCreateInlineYarn,
    showNewYarnColorForm,
    setShowNewYarnColorForm,
    inlineYarnColorName,
    setInlineYarnColorName,
    handleCreateInlineYarnColor,
    showNewSupplierForm,
    setShowNewSupplierForm,
    inlineSupplierName,
    setInlineSupplierName,
    inlineSupplierPhone,
    setInlineSupplierPhone,
    handleCreateInlineSupplier,
    saving,
    error,
    setError,
    handleSaveTransaction,
  };
}
