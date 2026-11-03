import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { catalogApi } from "../../api";
import type { FabricVariant, FabricPriceRow, YarnPriceRow, QualityRuleRow } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

type CatalogTab =
  | "fabrics"
  | "fabricPrices"
  | "fabricVariants"
  | "yarns"
  | "yarnPrices"
  | "yarnVariants"
  | "colors"
  | "designs"
  | "suppliers"
  | "qualityRules";

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as CatalogTab) || "fabrics";
  const [tab, setTab] = useState<CatalogTab>(initialTab);

  // Data states
  const [fabrics, setFabrics] = useState<
    Array<{
      fabricId: number;
      name: string;
      standardLengthCm: number;
      standardWidthCm: number;
      standardWeightG: number;
      isActive: boolean;
      prices?: FabricPriceRow[];
    }>
  >([]);
  const [yarns, setYarns] = useState<
    Array<{
      yarnId: number;
      name: string;
      isActive: boolean;
    }>
  >([]);
  const [colors, setColors] = useState<Array<{ colorId: number; colorCode: string; name: string }>>([]);
  const [designs, setDesigns] = useState<Array<{ designId: number; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<
    Array<{ supplierId: number; name: string; contactPhone: string | null; isActive: boolean }>
  >([]);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarnVariants, setYarnVariants] = useState<
    Array<{
      yarnVariantId: number;
      sku: string;
      stockSnapshot: string;
      basePrice: string | null;
      isActive?: boolean;
      yarnType: { materialName: string };
      yarn?: { name: string };
      color: { name: string };
      supplier: { name: string };
    }>
  >([]);
  const [fabricPrices, setFabricPrices] = useState<FabricPriceRow[]>([]);
  const [yarnPrices, setYarnPrices] = useState<YarnPriceRow[]>([]);
  const [qualityRules, setQualityRules] = useState<QualityRuleRow[]>([]);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Form states for creating new entities
  // Fabrics
  const [fabricName, setFabricName] = useState("");
  const [fabricLength, setFabricLength] = useState("");
  const [fabricWidth, setFabricWidth] = useState("");
  const [fabricWeight, setFabricWeight] = useState("");

  // Fabric Prices
  const [priceFabricId, setPriceFabricId] = useState("");
  const [priceWeaverRate, setPriceWeaverRate] = useState("");
  const [priceSellingPrice, setPriceSellingPrice] = useState("");
  const [priceEffectiveDate, setPriceEffectiveDate] = useState("");

  // Fabric Variants
  const [fvFabricId, setFvFabricId] = useState("");
  const [fvWarpColorId, setFvWarpColorId] = useState("");
  const [fvWeftColorId, setFvWeftColorId] = useState("");
  const [fvDesignId, setFvDesignId] = useState("");
  const [fvCustomSku, setFvCustomSku] = useState("");

  // Yarns
  const [yarnName, setYarnName] = useState("");

  // Yarn Prices
  const [priceYarnId, setPriceYarnId] = useState("");
  const [priceYarnSupplierId, setPriceYarnSupplierId] = useState("");
  const [priceYarnPurchasePrice, setPriceYarnPurchasePrice] = useState("");
  const [priceYarnSellingPrice, setPriceYarnSellingPrice] = useState("");
  const [priceYarnEffectiveDate, setPriceYarnEffectiveDate] = useState("");

  // Yarn Variants
  const [yvYarnId, setYvYarnId] = useState("");
  const [yvSupplierId, setYvSupplierId] = useState("");
  const [yvColorId, setYvColorId] = useState("");

  // Colors & Designs & Suppliers
  const [colorName, setColorName] = useState("");
  const [designName, setDesignName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");

  // Quality Rules
  const [ruleFactor, setRuleFactor] = useState("weight");
  const [ruleUnit, setRuleUnit] = useState("g");
  const [ruleDeduction, setRuleDeduction] = useState("");

  // Inline Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  async function loadAll() {
    setLoading(true);
    try {
      const [fabList, yarnList, colList, desList, supList, fvList, yvList, fpList, ypList, qrList] =
        await Promise.all([
          catalogApi.fabrics(),
          catalogApi.yarns(),
          catalogApi.colors(),
          catalogApi.designs(),
          catalogApi.suppliers(),
          catalogApi.fabricVariants(),
          catalogApi.yarnVariants(),
          catalogApi.fabricPrices(),
          catalogApi.yarnPrices(),
          catalogApi.qualityRules(),
        ]);

      setFabrics(fabList);
      setYarns(yarnList);
      setColors(colList);
      setDesigns(desList);
      setSuppliers(supList);
      setFabricVariants(fvList);
      setYarnVariants(yvList);
      setFabricPrices(fpList);
      setYarnPrices(ypList);
      setQualityRules(qrList);

      // Set default form selections
      if (fabList[0] && !priceFabricId) setPriceFabricId(String(fabList[0].fabricId));
      if (fabList[0] && !fvFabricId) setFvFabricId(String(fabList[0].fabricId));
      if (colList[0] && !fvWarpColorId) {
        setFvWarpColorId(String(colList[0].colorId));
        setFvWeftColorId(String(colList[0].colorId));
      }
      if (desList[0] && !fvDesignId) setFvDesignId(String(desList[0].designId));
      if (yarnList[0] && !priceYarnId) setPriceYarnId(String(yarnList[0].yarnId));
      if (yarnList[0] && !yvYarnId) setYvYarnId(String(yarnList[0].yarnId));
      if (supList[0] && !priceYarnSupplierId) setPriceYarnSupplierId(String(supList[0].supplierId));
      if (supList[0] && !yvSupplierId) setYvSupplierId(String(supList[0].supplierId));
      if (colList[0] && !yvColorId) setYvColorId(String(colList[0].colorId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleTabChange(newTab: CatalogTab) {
    setTab(newTab);
    setSearchParams({ tab: newTab });
    setMessage("");
    setError("");
    setEditingId(null);
    setSearch("");
  }

  // Handle Form Creations
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      if (tab === "fabrics") {
        await catalogApi.createProduct({
          name: fabricName.trim(),
          standardLengthCm: Number(fabricLength) || 200,
          standardWidthCm: Number(fabricWidth) || 100,
          standardWeightG: Number(fabricWeight) || 500,
        });
        setFabricName("");
        setFabricLength("");
        setFabricWidth("");
        setFabricWeight("");
        setMessage("Fabric created successfully.");
      } else if (tab === "fabricPrices") {
        await catalogApi.createFabricPrice({
          fabricId: Number(priceFabricId),
          weaverRate: Number(priceWeaverRate),
          sellingPrice: Number(priceSellingPrice),
          effectiveFrom: priceEffectiveDate || undefined,
        });
        setPriceWeaverRate("");
        setPriceSellingPrice("");
        setPriceEffectiveDate("");
        setMessage("Fabric price version added.");
      } else if (tab === "fabricVariants") {
        await catalogApi.createFabricVariant({
          fabricId: Number(fvFabricId),
          warpColorId: Number(fvWarpColorId),
          weftColorId: Number(fvWeftColorId),
          designId: Number(fvDesignId),
          sku: fvCustomSku.trim() || undefined,
        });
        setFvCustomSku("");
        setMessage("Fabric variant registered.");
      } else if (tab === "yarns") {
        await catalogApi.createYarnType({ materialName: yarnName.trim() });
        setYarnName("");
        setMessage("Yarn material added.");
      } else if (tab === "yarnPrices") {
        await catalogApi.createYarnPrice({
          yarnId: Number(priceYarnId),
          supplierId: Number(priceYarnSupplierId),
          purchasePrice: Number(priceYarnPurchasePrice),
          sellingPrice: Number(priceYarnSellingPrice),
          effectiveFrom: priceYarnEffectiveDate || undefined,
        });
        setPriceYarnPurchasePrice("");
        setPriceYarnSellingPrice("");
        setPriceYarnEffectiveDate("");
        setMessage("Yarn price schedule updated.");
      } else if (tab === "yarnVariants") {
        await catalogApi.createYarnVariant({
          yarnId: Number(yvYarnId),
          supplierId: Number(yvSupplierId),
          colorId: Number(yvColorId),
        });
        setMessage("Yarn variant created.");
      } else if (tab === "colors") {
        await catalogApi.createColor({ name: colorName.trim() });
        setColorName("");
        setMessage("Color added.");
      } else if (tab === "designs") {
        await catalogApi.createDesign({ name: designName.trim() });
        setDesignName("");
        setMessage("Design pattern added.");
      } else if (tab === "suppliers") {
        await catalogApi.createSupplier({
          name: supplierName.trim(),
          contactPhone: supplierPhone.trim() || undefined,
        });
        setSupplierName("");
        setSupplierPhone("");
        setMessage("Supplier registered.");
      } else if (tab === "qualityRules") {
        await catalogApi.createQualityRule({
          factor: ruleFactor,
          unit: ruleUnit,
          deductionPerUnit: Number(ruleDeduction),
        });
        setRuleDeduction("");
        setMessage("Quality rule created.");
      }

      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setSaving(false);
    }
  }

  // Toggle deactivation for entities
  async function toggleActive(type: string, id: number, currentActive: boolean) {
    setError("");
    setMessage("");
    try {
      if (type === "fabric") {
        await catalogApi.updateFabric(id, { isActive: !currentActive });
        setMessage(`Fabric ${currentActive ? "deactivated" : "reactivated"}.`);
      } else if (type === "yarn") {
        await catalogApi.updateYarn(id, { isActive: !currentActive });
        setMessage(`Yarn ${currentActive ? "deactivated" : "reactivated"}.`);
      } else if (type === "supplier") {
        await catalogApi.updateSupplier(id, { isActive: !currentActive });
        setMessage(`Supplier ${currentActive ? "deactivated" : "reactivated"}.`);
      } else if (type === "fabricVariant") {
        await catalogApi.updateFabricVariant(id, { isActive: !currentActive });
        setMessage(`Fabric variant ${currentActive ? "deactivated" : "reactivated"}.`);
      } else if (type === "yarnVariant") {
        await catalogApi.updateYarnVariant(id, { isActive: !currentActive });
        setMessage(`Yarn variant ${currentActive ? "deactivated" : "reactivated"}.`);
      } else if (type === "fabricPrice") {
        await catalogApi.updateFabricPrice(id, { isActive: !currentActive });
        setMessage(`Fabric price ${currentActive ? "closed" : "reactivated"}.`);
      } else if (type === "yarnPrice") {
        await catalogApi.updateYarnPrice(id, { isActive: !currentActive });
        setMessage(`Yarn price ${currentActive ? "closed" : "reactivated"}.`);
      } else if (type === "qualityRule") {
        await catalogApi.updateQualityRule(id, { isActive: !currentActive });
        setMessage(`Quality rule ${currentActive ? "deactivated" : "reactivated"}.`);
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  // Delete entity (Color or Design)
  async function handleDelete(type: "color" | "design", id: number, name: string) {
    if (!window.confirm(`Are you sure you want to delete ${type} "${name}"?`)) return;
    setError("");
    setMessage("");
    try {
      if (type === "color") await catalogApi.deleteColor(id);
      else if (type === "design") await catalogApi.deleteDesign(id);
      setMessage(`${type} deleted successfully.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete ${type}`);
    }
  }

  // Save inline edits
  async function saveInlineEdit(type: string, id: number) {
    setError("");
    setMessage("");
    try {
      if (type === "fabric") {
        await catalogApi.updateFabric(id, {
          standardLengthCm: Number(editValues.length) || undefined,
          standardWidthCm: Number(editValues.width) || undefined,
          standardWeightG: Number(editValues.weight) || undefined,
        });
        setMessage("Fabric dimensions updated.");
      } else if (type === "yarn") {
        await catalogApi.updateYarn(id, { name: editValues.name });
        setMessage("Yarn name updated.");
      } else if (type === "color") {
        await catalogApi.updateColor(id, { name: editValues.name });
        setMessage("Color updated.");
      } else if (type === "design") {
        await catalogApi.updateDesign(id, { name: editValues.name });
        setMessage("Design updated.");
      } else if (type === "supplier") {
        await catalogApi.updateSupplier(id, {
          name: editValues.name,
          contactPhone: editValues.phone || null,
        });
        setMessage("Supplier updated.");
      } else if (type === "qualityRule") {
        await catalogApi.updateQualityRule(id, {
          deductionPerUnit: Number(editValues.deduction),
          unit: editValues.unit,
        });
        setMessage("Quality rule updated.");
      }
      setEditingId(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save edits");
    }
  }

  // Filtered Lists
  const q = search.toLowerCase().trim();

  const filteredFabrics = useMemo(() => {
    return fabrics.filter((f) => {
      if (!showInactive && !f.isActive) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || String(f.fabricId).includes(q);
    });
  }, [fabrics, showInactive, q]);

  const filteredFabricPrices = useMemo(() => {
    return fabricPrices.filter((p) => {
      if (!showInactive && !p.isActive) return false;
      if (!q) return true;
      return p.fabric?.name?.toLowerCase().includes(q) || String(p.fabricId).includes(q);
    });
  }, [fabricPrices, showInactive, q]);

  const filteredFabricVariants = useMemo(() => {
    return fabricVariants.filter((v) => {
      if (!showInactive && v.isActive === false) return false;
      if (!q) return true;
      const fName = v.fabric?.name ?? v.product?.name ?? "";
      return (
        v.sku.toLowerCase().includes(q) ||
        fName.toLowerCase().includes(q) ||
        (v.warpColor?.name && v.warpColor.name.toLowerCase().includes(q)) ||
        (v.weftColor?.name && v.weftColor.name.toLowerCase().includes(q)) ||
        (v.design?.name && v.design.name.toLowerCase().includes(q))
      );
    });
  }, [fabricVariants, showInactive, q]);

  const filteredYarns = useMemo(() => {
    return yarns.filter((y) => {
      if (!showInactive && !y.isActive) return false;
      if (!q) return true;
      return y.name.toLowerCase().includes(q) || String(y.yarnId).includes(q);
    });
  }, [yarns, showInactive, q]);

  const filteredYarnPrices = useMemo(() => {
    return yarnPrices.filter((p) => {
      if (!showInactive && !p.isActive) return false;
      if (!q) return true;
      return (
        p.yarn?.name?.toLowerCase().includes(q) ||
        p.supplier?.name?.toLowerCase().includes(q) ||
        String(p.yarnId).includes(q)
      );
    });
  }, [yarnPrices, showInactive, q]);

  const filteredYarnVariants = useMemo(() => {
    return yarnVariants.filter((v) => {
      if (!showInactive && v.isActive === false) return false;
      if (!q) return true;
      const yName = v.yarn?.name ?? v.yarnType?.materialName ?? "";
      return (
        v.sku.toLowerCase().includes(q) ||
        yName.toLowerCase().includes(q) ||
        (v.color?.name && v.color.name.toLowerCase().includes(q)) ||
        (v.supplier?.name && v.supplier.name.toLowerCase().includes(q))
      );
    });
  }, [yarnVariants, showInactive, q]);

  const filteredColors = useMemo(() => {
    return colors.filter((c) => {
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || String(c.colorId).includes(q);
    });
  }, [colors, q]);

  const filteredDesigns = useMemo(() => {
    return designs.filter((d) => {
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || String(d.designId).includes(q);
    });
  }, [designs, q]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (!showInactive && !s.isActive) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.contactPhone && s.contactPhone.includes(q));
    });
  }, [suppliers, showInactive, q]);

  const filteredQualityRules = useMemo(() => {
    return qualityRules.filter((r) => {
      if (!showInactive && !r.isActive) return false;
      if (!q) return true;
      return r.factor.toLowerCase().includes(q) || r.unit.toLowerCase().includes(q);
    });
  }, [qualityRules, showInactive, q]);

  const tabs: Array<{ key: CatalogTab; label: string; icon: string; count: number }> = [
    { key: "fabrics", label: "Fabrics", icon: "🧣", count: fabrics.length },
    { key: "fabricPrices", label: "Fabric Prices", icon: "🏷️", count: fabricPrices.length },
    { key: "fabricVariants", label: "Fabric Variants", icon: "🪢", count: fabricVariants.length },
    { key: "yarns", label: "Yarns", icon: "🧶", count: yarns.length },
    { key: "yarnPrices", label: "Yarn Prices", icon: "💵", count: yarnPrices.length },
    { key: "yarnVariants", label: "Yarn Variants", icon: "🧵", count: yarnVariants.length },
    { key: "colors", label: "Colors", icon: "🎨", count: colors.length },
    { key: "designs", label: "Designs", icon: "✨", count: designs.length },
    { key: "suppliers", label: "Suppliers", icon: "🏢", count: suppliers.length },
    { key: "qualityRules", label: "Quality Rules", icon: "⚖️", count: qualityRules.length },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">ካታሎግ እና የዋጋ አስተዳደር / Master Catalog & Rates</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Catalog & Price Management</h1>
          </div>
          <p className="page-subtitle">
            Configure textile products, standard dimensions, weaver rates, commercial selling prices, yarns, and quality deduction schedules.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "tab-pill active" : "tab-pill"}
            onClick={() => handleTabChange(t.key)}
            style={{ whiteSpace: "nowrap" }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Notifications */}
      {message && <div className="success-msg"><span>✅</span> {message}</div>}
      {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

      {/* Search and Filter Toolbar */}
      <div className="card" style={{ padding: "0.85rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 300px" }}>
          <span style={{ fontSize: "16px" }}>🔍</span>
          <input
            type="text"
            placeholder={`Search ${tabs.find((t) => t.key === tab)?.label} by name, SKU, or attribute…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: "100%", padding: "0.45rem 0.85rem", fontSize: "13.5px" }}
          />
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          <span>Show Deactivated / Closed Items</span>
        </label>
      </div>

      {/* Creation Forms */}
      <form className="card form" onSubmit={handleCreate}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <span>➕</span> Add New {tabs.find((t) => t.key === tab)?.label}
        </h3>

        {/* Tab 1: Fabrics */}
        {tab === "fabrics" && (
          <>
            <div className="form-row">
              <label>
                <span>Fabric Name / የምርት ስም</span>
                <input
                  value={fabricName}
                  onChange={(e) => setFabricName(e.target.value)}
                  placeholder="e.g. Gabi / ጋቢ"
                  required
                />
              </label>
              <label>
                <span>Standard Weight (g) / መደበኛ ክብደት</span>
                <input
                  type="number"
                  step="1"
                  value={fabricWeight}
                  onChange={(e) => setFabricWeight(e.target.value)}
                  placeholder="e.g. 520"
                  required
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                <span>Standard Length (cm) / ቁመት</span>
                <input
                  type="number"
                  step="1"
                  value={fabricLength}
                  onChange={(e) => setFabricLength(e.target.value)}
                  placeholder="e.g. 240"
                  required
                />
              </label>
              <label>
                <span>Standard Width (cm) / ስፋት</span>
                <input
                  type="number"
                  step="1"
                  value={fabricWidth}
                  onChange={(e) => setFabricWidth(e.target.value)}
                  placeholder="e.g. 150"
                  required
                />
              </label>
            </div>
          </>
        )}

        {/* Tab 2: Fabric Prices */}
        {tab === "fabricPrices" && (
          <div className="form-row">
            <label>
              <span>Fabric / ጨርቅ</span>
              <select value={priceFabricId} onChange={(e) => setPriceFabricId(e.target.value)} required>
                {fabrics.map((f) => (
                  <option key={f.fabricId} value={f.fabricId}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Weaver Rate (ETB) / የሸማኔ ዋጋ</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceWeaverRate}
                onChange={(e) => setPriceWeaverRate(e.target.value)}
                placeholder="e.g. 350.00"
                required
              />
            </label>
            <label>
              <span>Selling Price (ETB) / የሽያጭ ዋጋ</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceSellingPrice}
                onChange={(e) => setPriceSellingPrice(e.target.value)}
                placeholder="e.g. 850.00"
                required
              />
            </label>
            <label>
              <span>Effective From (Date)</span>
              <input
                type="date"
                value={priceEffectiveDate}
                onChange={(e) => setPriceEffectiveDate(e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Tab 3: Fabric Variants */}
        {tab === "fabricVariants" && (
          <>
            <div className="form-row">
              <label>
                <span>Fabric / ጨርቅ</span>
                <select value={fvFabricId} onChange={(e) => setFvFabricId(e.target.value)} required>
                  {fabrics.map((f) => (
                    <option key={f.fabricId} value={f.fabricId}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Design Pattern / ዲዛይን</span>
                <select value={fvDesignId} onChange={(e) => setFvDesignId(e.target.value)} required>
                  {designs.map((d) => (
                    <option key={d.designId} value={d.designId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                <span>Warp Color / ውርፍ</span>
                <select value={fvWarpColorId} onChange={(e) => setFvWarpColorId(e.target.value)} required>
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Weft Color / ስፍ</span>
                <select value={fvWeftColorId} onChange={(e) => setFvWeftColorId(e.target.value)} required>
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Custom SKU (optional)</span>
                <input
                  value={fvCustomSku}
                  onChange={(e) => setFvCustomSku(e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </label>
            </div>
          </>
        )}

        {/* Tab 4: Yarns */}
        {tab === "yarns" && (
          <label>
            <span>Yarn Material Name / የጥጥ ዓይነት</span>
            <input
              value={yarnName}
              onChange={(e) => setYarnName(e.target.value)}
              placeholder="e.g. Cotton 20/2, Pure Acrylic"
              required
            />
          </label>
        )}

        {/* Tab 5: Yarn Prices */}
        {tab === "yarnPrices" && (
          <div className="form-row">
            <label>
              <span>Yarn / ጥጥ</span>
              <select value={priceYarnId} onChange={(e) => setPriceYarnId(e.target.value)} required>
                {yarns.map((y) => (
                  <option key={y.yarnId} value={y.yarnId}>
                    {y.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Supplier / አቅራቢ</span>
              <select value={priceYarnSupplierId} onChange={(e) => setPriceYarnSupplierId(e.target.value)} required>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Purchase Price (ETB/kg)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceYarnPurchasePrice}
                onChange={(e) => setPriceYarnPurchasePrice(e.target.value)}
                placeholder="e.g. 450.00"
                required
              />
            </label>
            <label>
              <span>Selling Price (ETB/kg)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceYarnSellingPrice}
                onChange={(e) => setPriceYarnSellingPrice(e.target.value)}
                placeholder="e.g. 520.00"
                required
              />
            </label>
            <label>
              <span>Effective Date</span>
              <input
                type="date"
                value={priceYarnEffectiveDate}
                onChange={(e) => setPriceYarnEffectiveDate(e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Tab 6: Yarn Variants */}
        {tab === "yarnVariants" && (
          <div className="form-row">
            <label>
              <span>Yarn Material / ዓይነት</span>
              <select value={yvYarnId} onChange={(e) => setYvYarnId(e.target.value)} required>
                {yarns.map((y) => (
                  <option key={y.yarnId} value={y.yarnId}>
                    {y.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Supplier / አቅራቢ</span>
              <select value={yvSupplierId} onChange={(e) => setYvSupplierId(e.target.value)} required>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Color / ቀለም</span>
              <select value={yvColorId} onChange={(e) => setYvColorId(e.target.value)} required>
                {colors.map((c) => (
                  <option key={c.colorId} value={c.colorId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Tab 7: Colors */}
        {tab === "colors" && (
          <label>
            <span>Color Name / የቀለም ስም</span>
            <input
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="e.g. Indigo Blue / ሰማያዊ"
              required
            />
          </label>
        )}

        {/* Tab 8: Designs */}
        {tab === "designs" && (
          <label>
            <span>Pattern / Design Name / የዲዛይን ስም</span>
            <input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="e.g. ZigZag, Diamond, Plain"
              required
            />
          </label>
        )}

        {/* Tab 9: Suppliers */}
        {tab === "suppliers" && (
          <div className="form-row">
            <label>
              <span>Supplier Name / የአቅራቢ ስም</span>
              <input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Bahir Dar Textile SC"
                required
              />
            </label>
            <label>
              <span>Contact Phone / ስልክ ቁጥር</span>
              <input
                type="tel"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="+251 9xx xxx xxx"
              />
            </label>
          </div>
        )}

        {/* Tab 10: Quality Rules */}
        {tab === "qualityRules" && (
          <div className="form-row">
            <label>
              <span>Quality Factor / ሁኔታ</span>
              <select value={ruleFactor} onChange={(e) => setRuleFactor(e.target.value)} required>
                <option value="weight">Weight (ክብደት)</option>
                <option value="length">Length (ቁመት)</option>
                <option value="width">Width (ስፋት)</option>
              </select>
            </label>
            <label>
              <span>Measurement Unit / መለኪያ</span>
              <input
                value={ruleUnit}
                onChange={(e) => setRuleUnit(e.target.value)}
                placeholder="e.g. g or cm"
                required
              />
            </label>
            <label>
              <span>Deduction Rate (ETB / unit)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={ruleDeduction}
                onChange={(e) => setRuleDeduction(e.target.value)}
                placeholder="e.g. 1.00"
                required
              />
            </label>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Add to Catalog / መዝግብ"}
          </button>
        </div>
      </form>

      {/* Catalog Table Card */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading" style={{ padding: "2rem", textAlign: "center" }}>
            <span>⏳</span> Loading catalog data…
          </div>
        ) : (
          <>
            {/* Tab 1 Table: Fabrics */}
            {tab === "fabrics" && (
              <table>
                <thead>
                  <tr>
                    <th>Fabric Name</th>
                    <th>Standard Length</th>
                    <th>Standard Width</th>
                    <th>Standard Weight</th>
                    <th>Current Weaver Rate</th>
                    <th>Current Selling Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFabrics.map((f) => {
                    const isEditing = editingId === f.fabricId;
                    const latestPrice = f.prices?.[0];
                    return (
                      <tr key={f.fabricId}>
                        <td style={{ fontWeight: 700 }}>{f.name}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.length ?? f.standardLengthCm}
                              onChange={(e) => setEditValues({ ...editValues, length: e.target.value })}
                              style={{ width: 80 }}
                            />
                          ) : (
                            `${f.standardLengthCm} cm`
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.width ?? f.standardWidthCm}
                              onChange={(e) => setEditValues({ ...editValues, width: e.target.value })}
                              style={{ width: 80 }}
                            />
                          ) : (
                            `${f.standardWidthCm} cm`
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.weight ?? f.standardWeightG}
                              onChange={(e) => setEditValues({ ...editValues, weight: e.target.value })}
                              style={{ width: 80 }}
                            />
                          ) : (
                            `${f.standardWeightG} g`
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--accent)" }}>
                          {latestPrice ? `${latestPrice.weaverRate} ETB` : "—"}
                        </td>
                        <td style={{ fontWeight: 600, color: "#0284C7" }}>
                          {latestPrice ? `${latestPrice.sellingPrice} ETB` : "—"}
                        </td>
                        <td>
                          <span className={`badge ${f.isActive ? "badge-green" : "badge-gray"}`}>
                            {f.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-sm primary"
                                onClick={() => saveInlineEdit("fabric", f.fabricId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-link"
                                onClick={() => {
                                  setEditingId(f.fabricId);
                                  setEditValues({
                                    length: f.standardLengthCm,
                                    width: f.standardWidthCm,
                                    weight: f.standardWeightG,
                                  });
                                }}
                              >
                                Edit Specs
                              </button>
                              <button
                                type="button"
                                className="btn-link"
                                style={{ color: f.isActive ? "var(--red)" : "var(--green)" }}
                                onClick={() => toggleActive("fabric", f.fabricId, f.isActive)}
                              >
                                {f.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 2 Table: Fabric Prices */}
            {tab === "fabricPrices" && (
              <table>
                <thead>
                  <tr>
                    <th>Fabric</th>
                    <th>Weaver Rate (ETB)</th>
                    <th>Selling Price (ETB)</th>
                    <th>Effective From</th>
                    <th>Effective To</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFabricPrices.map((p) => (
                    <tr key={p.fabricPriceId}>
                      <td style={{ fontWeight: 700 }}>{p.fabric?.name ?? `Fabric #${p.fabricId}`}</td>
                      <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                        {Number(p.weaverRate).toLocaleString()} ETB
                      </td>
                      <td style={{ fontWeight: 700, color: "#0284C7" }}>
                        {Number(p.sellingPrice).toLocaleString()} ETB
                      </td>
                      <td>{formatDateDDMMYY(p.effectiveFrom)}</td>
                      <td>{p.effectiveTo ? formatDateDDMMYY(p.effectiveTo) : "Active"}</td>
                      <td>
                        <span className={`badge ${p.isActive ? "badge-green" : "badge-gray"}`}>
                          {p.isActive ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-link"
                          style={{ color: p.isActive ? "var(--red)" : "var(--green)" }}
                          onClick={() => toggleActive("fabricPrice", p.fabricPriceId, p.isActive)}
                        >
                          {p.isActive ? "Close Rate" : "Reopen Rate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tab 3 Table: Fabric Variants */}
            {tab === "fabricVariants" && (
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Fabric</th>
                    <th>Warp Color</th>
                    <th>Weft Color</th>
                    <th>Design Pattern</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFabricVariants.map((v) => (
                    <tr key={v.fabricVariantId}>
                      <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                        {v.sku}
                      </td>
                      <td style={{ fontWeight: 700 }}>{v.fabric?.name ?? v.product?.name ?? "Fabric"}</td>
                      <td>{v.warpColor?.name ?? "—"}</td>
                      <td>{v.weftColor?.name ?? "—"}</td>
                      <td>{v.design?.name ?? "—"}</td>
                      <td>
                        <span className={`badge ${v.isActive !== false ? "badge-green" : "badge-gray"}`}>
                          {v.isActive !== false ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-link"
                          style={{ color: v.isActive !== false ? "var(--red)" : "var(--green)" }}
                          onClick={() => toggleActive("fabricVariant", v.fabricVariantId, v.isActive !== false)}
                        >
                          {v.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tab 4 Table: Yarns */}
            {tab === "yarns" && (
              <table>
                <thead>
                  <tr>
                    <th>Yarn Material Name</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredYarns.map((y) => {
                    const isEditing = editingId === y.yarnId;
                    return (
                      <tr key={y.yarnId}>
                        <td style={{ fontWeight: 700 }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.name ?? y.name}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            />
                          ) : (
                            y.name
                          )}
                        </td>
                        <td>
                          <span className={`badge ${y.isActive ? "badge-green" : "badge-gray"}`}>
                            {y.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-sm primary"
                                onClick={() => saveInlineEdit("yarn", y.yarnId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-link"
                                onClick={() => {
                                  setEditingId(y.yarnId);
                                  setEditValues({ name: y.name });
                                }}
                              >
                                Edit Name
                              </button>
                              <button
                                type="button"
                                className="btn-link"
                                style={{ color: y.isActive ? "var(--red)" : "var(--green)" }}
                                onClick={() => toggleActive("yarn", y.yarnId, y.isActive)}
                              >
                                {y.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 5 Table: Yarn Prices */}
            {tab === "yarnPrices" && (
              <table>
                <thead>
                  <tr>
                    <th>Yarn Material</th>
                    <th>Supplier</th>
                    <th>Purchase Price (ETB/kg)</th>
                    <th>Selling Price (ETB/kg)</th>
                    <th>Effective From</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredYarnPrices.map((p) => (
                    <tr key={p.yarnPriceId}>
                      <td style={{ fontWeight: 700 }}>{p.yarn?.name ?? `Yarn #${p.yarnId}`}</td>
                      <td>{p.supplier?.name ?? `Supplier #${p.supplierId}`}</td>
                      <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                        {Number(p.purchasePrice).toLocaleString()} ETB
                      </td>
                      <td style={{ fontWeight: 700, color: "#0284C7" }}>
                        {Number(p.sellingPrice).toLocaleString()} ETB
                      </td>
                      <td>{formatDateDDMMYY(p.effectiveFrom)}</td>
                      <td>
                        <span className={`badge ${p.isActive ? "badge-green" : "badge-gray"}`}>
                          {p.isActive ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-link"
                          style={{ color: p.isActive ? "var(--red)" : "var(--green)" }}
                          onClick={() => toggleActive("yarnPrice", p.yarnPriceId, p.isActive)}
                        >
                          {p.isActive ? "Close Rate" : "Reopen Rate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tab 6 Table: Yarn Variants */}
            {tab === "yarnVariants" && (
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Material</th>
                    <th>Supplier</th>
                    <th>Color</th>
                    <th>Stock (kg)</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredYarnVariants.map((v) => (
                    <tr key={v.yarnVariantId}>
                      <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                        {v.sku}
                      </td>
                      <td style={{ fontWeight: 700 }}>{v.yarn?.name ?? v.yarnType?.materialName}</td>
                      <td>{v.supplier?.name ?? "—"}</td>
                      <td>{v.color?.name ?? "—"}</td>
                      <td style={{ fontWeight: 700 }}>{v.stockSnapshot ?? 0} kg</td>
                      <td>
                        <span className={`badge ${v.isActive !== false ? "badge-green" : "badge-gray"}`}>
                          {v.isActive !== false ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-link"
                          style={{ color: v.isActive !== false ? "var(--red)" : "var(--green)" }}
                          onClick={() => toggleActive("yarnVariant", v.yarnVariantId, v.isActive !== false)}
                        >
                          {v.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tab 7 Table: Colors */}
            {tab === "colors" && (
              <table>
                <thead>
                  <tr>
                    <th>Color Name</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColors.map((c) => {
                    const isEditing = editingId === c.colorId;
                    return (
                      <tr key={c.colorId}>
                        <td style={{ fontWeight: 700 }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.name ?? c.name}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            />
                          ) : (
                            c.name
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-sm primary"
                                onClick={() => saveInlineEdit("color", c.colorId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-link"
                                onClick={() => {
                                  setEditingId(c.colorId);
                                  setEditValues({ name: c.name });
                                }}
                              >
                                Edit Name
                              </button>
                              <button
                                type="button"
                                className="btn-link"
                                style={{ color: "var(--red)" }}
                                onClick={() => handleDelete("color", c.colorId, c.name)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 8 Table: Designs */}
            {tab === "designs" && (
              <table>
                <thead>
                  <tr>
                    <th>Pattern Name</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesigns.map((d) => {
                    const isEditing = editingId === d.designId;
                    return (
                      <tr key={d.designId}>
                        <td style={{ fontWeight: 700 }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.name ?? d.name}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            />
                          ) : (
                            d.name
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-sm primary"
                                onClick={() => saveInlineEdit("design", d.designId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-link"
                                onClick={() => {
                                  setEditingId(d.designId);
                                  setEditValues({ name: d.name });
                                }}
                              >
                                Edit Name
                              </button>
                              <button
                                type="button"
                                className="btn-link"
                                style={{ color: "var(--red)" }}
                                onClick={() => handleDelete("design", d.designId, d.name)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 9 Table: Suppliers */}
            {tab === "suppliers" && (
              <table>
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Contact Phone</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((s) => {
                    const isEditing = editingId === s.supplierId;
                    return (
                      <tr key={s.supplierId}>
                        <td style={{ fontWeight: 700 }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.name ?? s.name}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            />
                          ) : (
                            s.name
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editValues.phone ?? s.contactPhone ?? ""}
                              onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                            />
                          ) : (
                            s.contactPhone ?? "—"
                          )}
                        </td>
                        <td>
                          <span className={`badge ${s.isActive ? "badge-green" : "badge-gray"}`}>
                            {s.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-sm primary"
                                onClick={() => saveInlineEdit("supplier", s.supplierId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-link"
                                onClick={() => {
                                  setEditingId(s.supplierId);
                                  setEditValues({ name: s.name, phone: s.contactPhone ?? "" });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-link"
                                style={{ color: s.isActive ? "var(--red)" : "var(--green)" }}
                                onClick={() => toggleActive("supplier", s.supplierId, s.isActive)}
                              >
                                {s.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 10 Table: Quality Rules */}
            {tab === "qualityRules" && (
              <table>
                <thead>
                  <tr>
                    <th>Factor / Dimension</th>
                    <th>Unit</th>
                    <th>Deduction Rate (ETB / unit)</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQualityRules.map((r) => {
                    const isEditing = editingId === r.qualityRuleId;
                    return (
                      <tr key={r.qualityRuleId}>
                        <td style={{ fontWeight: 700, textTransform: "capitalize" }}>{r.factor}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.unit ?? r.unit}
                              onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                              style={{ width: 60 }}
                            />
                          ) : (
                            r.unit
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--red)" }}>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.deduction ?? r.deductionPerUnit}
                              onChange={(e) => setEditValues({ ...editValues, deduction: e.target.value })}
                              style={{ width: 90 }}
                            />
                          ) : (
                            `${r.deductionPerUnit} ETB`
                          )}
                        </td>
                        <td>
                          <span className={`badge ${r.isActive ? "badge-green" : "badge-gray"}`}>
                            {r.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-sm primary"
                                onClick={() => saveInlineEdit("qualityRule", r.qualityRuleId)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                className="btn-link"
                                onClick={() => {
                                  setEditingId(r.qualityRuleId);
                                  setEditValues({
                                    deduction: r.deductionPerUnit,
                                    unit: r.unit,
                                  });
                                }}
                              >
                                Edit Rate
                              </button>
                              <button
                                type="button"
                                className="btn-link"
                                style={{ color: r.isActive ? "var(--red)" : "var(--green)" }}
                                onClick={() => toggleActive("qualityRule", r.qualityRuleId, r.isActive)}
                              >
                                {r.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
