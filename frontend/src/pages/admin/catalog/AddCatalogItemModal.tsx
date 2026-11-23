import React, { useState } from "react";
import type { CatalogTab, FabricWithRates } from "./useCatalogData";
import type { FabricVariant } from "../../../api";
import { catalogApi } from "../../../api";
import { Button, FormField, Modal, SearchableSelect } from "../../../components/common";

export interface AddCatalogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: CatalogTab;
  fabrics: FabricWithRates[];
  fabricVariants: FabricVariant[];
  yarns: any[];
  yarnVariants: any[];
  colors: any[];
  designs: any[];
  suppliers: any[];
  onItemCreated: (msg: string) => void;
  onRefreshData: () => Promise<void>;
}

export function AddCatalogItemModal({
  isOpen,
  onClose,
  activeTab,
  fabrics,
  yarns,
  colors,
  designs,
  suppliers,
  onItemCreated,
  onRefreshData,
}: AddCatalogItemModalProps) {
  // Add Fabric fields
  const [newFabricName, setNewFabricName] = useState("");
  const [newFabricWeight, setNewFabricWeight] = useState("");
  const [newFabricLength, setNewFabricLength] = useState("");
  const [newFabricWidth, setNewFabricWidth] = useState("");

  // Add Fabric Variant fields
  const [newFvFabricId, setNewFvFabricId] = useState<number | "">("");
  const [newFvWarpColorId, setNewFvWarpColorId] = useState<number | "">("");
  const [newFvWeftColorId, setNewFvWeftColorId] = useState<number | "">("");
  const [newFvDesignId, setNewFvDesignId] = useState<number | "">("");

  // Add Yarn Variant fields
  const [newYvYarnId, setNewYvYarnId] = useState<number | "">("");
  const [newYvColorId, setNewYvColorId] = useState<number | "">("");
  const [newYvSupplierId, setNewYvSupplierId] = useState<number | "">("");

  // Add Simple items (Yarn, Color, Design, Supplier)
  const [newSimpleName, setNewSimpleName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  // Inline creator toggles & state for Fabric Variant
  const [showNewFabricForm, setShowNewFabricForm] = useState(false);
  const [inlineFabricName, setInlineFabricName] = useState("");
  const [inlineFabricWeight, setInlineFabricWeight] = useState("");
  const [inlineFabricLength, setInlineFabricLength] = useState("");
  const [inlineFabricWidth, setInlineFabricWidth] = useState("");

  const [showNewWarpColorForm, setShowNewWarpColorForm] = useState(false);
  const [inlineWarpColorName, setInlineWarpColorName] = useState("");

  const [showNewWeftColorForm, setShowNewWeftColorForm] = useState(false);
  const [inlineWeftColorName, setInlineWeftColorName] = useState("");

  const [showNewDesignForm, setShowNewDesignForm] = useState(false);
  const [inlineDesignName, setInlineDesignName] = useState("");

  // Inline creator toggles & state for Yarn Variant
  const [showNewYarnForm, setShowNewYarnForm] = useState(false);
  const [inlineYarnName, setInlineYarnName] = useState("");

  const [showNewYarnColorForm, setShowNewYarnColorForm] = useState(false);
  const [inlineYarnColorName, setInlineYarnColorName] = useState("");

  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [inlineSupplierName, setInlineSupplierName] = useState("");
  const [inlineSupplierPhone, setInlineSupplierPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetFields = () => {
    setNewFabricName("");
    setNewFabricWeight("");
    setNewFabricLength("");
    setNewFabricWidth("");
    setNewFvFabricId(fabrics[0]?.fabricId || "");
    setNewFvWarpColorId(colors[0]?.colorId || "");
    setNewFvWeftColorId(colors[0]?.colorId || "");
    setNewFvDesignId(designs[0]?.designId || "");
    setNewYvYarnId(yarns[0]?.yarnId || "");
    setNewYvColorId(colors[0]?.colorId || "");
    setNewYvSupplierId(suppliers[0]?.supplierId || "");
    setNewSimpleName("");
    setNewSupplierPhone("");
    setNewColorHex("#000000");
    setShowNewFabricForm(false);
    setShowNewWarpColorForm(false);
    setShowNewWeftColorForm(false);
    setShowNewDesignForm(false);
    setShowNewYarnForm(false);
    setShowNewYarnColorForm(false);
    setShowNewSupplierForm(false);
    setError("");
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  // Inline creator actions
  const handleCreateInlineFabric = async () => {
    if (!inlineFabricName.trim() || !inlineFabricWeight || !inlineFabricLength || !inlineFabricWidth) {
      setError("Please fill in all fabric specs (name, weight, length, width).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res: any = await catalogApi.createFabric({
        name: inlineFabricName.trim().toLowerCase(),
        standardWeightG: Number(inlineFabricWeight),
        standardLengthCm: Number(inlineFabricLength),
        standardWidthCm: Number(inlineFabricWidth),
      });
      await onRefreshData();
      if (res?.fabricId) {
        setNewFvFabricId(res.fabricId);
      }
      setShowNewFabricForm(false);
      setInlineFabricName("");
      setInlineFabricWeight("");
      setInlineFabricLength("");
      setInlineFabricWidth("");
    } catch (err: any) {
      setError(err.message || "Failed to create inline fabric");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInlineWarpColor = async () => {
    if (!inlineWarpColorName.trim()) {
      setError("Color name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res: any = await catalogApi.createColor({ name: inlineWarpColorName.trim() });
      await onRefreshData();
      if (res?.colorId) {
        setNewFvWarpColorId(res.colorId);
      }
      setShowNewWarpColorForm(false);
      setInlineWarpColorName("");
    } catch (err: any) {
      setError(err.message || "Failed to create inline color");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInlineWeftColor = async () => {
    if (!inlineWeftColorName.trim()) {
      setError("Color name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res: any = await catalogApi.createColor({ name: inlineWeftColorName.trim() });
      await onRefreshData();
      if (res?.colorId) {
        setNewFvWeftColorId(res.colorId);
      }
      setShowNewWeftColorForm(false);
      setInlineWeftColorName("");
    } catch (err: any) {
      setError(err.message || "Failed to create inline color");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInlineDesign = async () => {
    if (!inlineDesignName.trim()) {
      setError("Design name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res: any = await catalogApi.createDesign({ name: inlineDesignName.trim() });
      await onRefreshData();
      if (res?.designId) {
        setNewFvDesignId(res.designId);
      }
      setShowNewDesignForm(false);
      setInlineDesignName("");
    } catch (err: any) {
      setError(err.message || "Failed to create inline design");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInlineYarn = async () => {
    if (!inlineYarnName.trim()) {
      setError("Yarn name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res: any = await catalogApi.createYarn({ name: inlineYarnName.trim() });
      await onRefreshData();
      if (res?.yarnId) {
        setNewYvYarnId(res.yarnId);
      }
      setShowNewYarnForm(false);
      setInlineYarnName("");
    } catch (err: any) {
      setError(err.message || "Failed to create inline yarn");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInlineYarnColor = async () => {
    if (!inlineYarnColorName.trim()) {
      setError("Color name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res: any = await catalogApi.createColor({ name: inlineYarnColorName.trim() });
      await onRefreshData();
      if (res?.colorId) {
        setNewYvColorId(res.colorId);
      }
      setShowNewYarnColorForm(false);
      setInlineYarnColorName("");
    } catch (err: any) {
      setError(err.message || "Failed to create inline color");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInlineSupplier = async () => {
    if (!inlineSupplierName.trim()) {
      setError("Supplier name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res: any = await catalogApi.createSupplier({
        name: inlineSupplierName.trim(),
        contactPhone: inlineSupplierPhone.trim() || undefined,
      });
      await onRefreshData();
      if (res?.supplierId) {
        setNewYvSupplierId(res.supplierId);
      }
      setShowNewSupplierForm(false);
      setInlineSupplierName("");
      setInlineSupplierPhone("");
    } catch (err: any) {
      setError(err.message || "Failed to create inline supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (activeTab === "fabrics") {
        if (!newFabricName.trim() || !newFabricWeight || !newFabricLength || !newFabricWidth) {
          setError("All measurements and name are required.");
          setSaving(false);
          return;
        }
        await catalogApi.createFabric({
          name: newFabricName.trim().toLowerCase(),
          standardWeightG: Number(newFabricWeight),
          standardLengthCm: Number(newFabricLength),
          standardWidthCm: Number(newFabricWidth),
        });
        onItemCreated(`Fabric "${newFabricName}" added successfully.`);
      } else if (activeTab === "fabricVariants") {
        if (!newFvFabricId || !newFvWarpColorId || !newFvWeftColorId || !newFvDesignId) {
          setError("Please select Fabric, Warp, Weft, and Design.");
          setSaving(false);
          return;
        }
        await catalogApi.createFabricVariant({
          fabricId: Number(newFvFabricId),
          warpColorId: Number(newFvWarpColorId),
          weftColorId: Number(newFvWeftColorId),
          designId: Number(newFvDesignId),
        });
        onItemCreated("Fabric type variant added successfully.");
      } else if (activeTab === "yarns") {
        if (!newSimpleName.trim()) {
          setError("Yarn name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createYarn({ name: newSimpleName.trim() });
        onItemCreated(`Yarn "${newSimpleName}" added successfully.`);
      } else if (activeTab === "yarnVariants") {
        if (!newYvYarnId || !newYvColorId || !newYvSupplierId) {
          setError("Please select Yarn, Color, and Supplier.");
          setSaving(false);
          return;
        }
        await catalogApi.createYarnVariant({
          yarnId: Number(newYvYarnId),
          colorId: Number(newYvColorId),
          supplierId: Number(newYvSupplierId),
        });
        onItemCreated("Yarn type variant added successfully.");
      } else if (activeTab === "colors") {
        if (!newSimpleName.trim()) {
          setError("Color name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createColor({
          name: newSimpleName.trim(),
        });
        onItemCreated(`Color "${newSimpleName}" added successfully.`);
      } else if (activeTab === "designs") {
        if (!newSimpleName.trim()) {
          setError("Design name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createDesign({ name: newSimpleName.trim() });
        onItemCreated(`Design "${newSimpleName}" added successfully.`);
      } else if (activeTab === "suppliers") {
        if (!newSimpleName.trim()) {
          setError("Supplier name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createSupplier({
          name: newSimpleName.trim(),
          contactPhone: newSupplierPhone.trim() || undefined,
        });
        onItemCreated(`Supplier "${newSimpleName}" added successfully.`);
      }

      handleClose();
      await onRefreshData();
    } catch (err: any) {
      setError(err.message || "Failed to create catalog entry");
    } finally {
      setSaving(false);
    }
  };

  const titles: Record<CatalogTab, string> = {
    fabrics: "Add New Fabric (አዲስ የጨርቅ አይነት)",
    fabricVariants: "Add New Fabric Type / Variant (አዲስ የጨርቅ አይነት)",
    yarns: "Add New Yarn (አዲስ ክር)",
    yarnVariants: "Add New Yarn Type (አዲስ የክር አይነት)",
    colors: "Add New Color (አዲስ ቀለም)",
    designs: "Add New Design / Pattern (አዲስ ጥበብ)",
    suppliers: "Add New Supplier (አዲስ አቅራቢ)",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={titles[activeTab] || "Add Catalog Item"}
      maxWidth={520}
    >
      {error && (
        <div className="alert-banner alert-banner--error" style={{ marginBottom: "var(--space-4)" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack">
        {/* Fabric fields */}
        {activeTab === "fabrics" && (
          <>
            <FormField label="Fabric Name (ስም)" required hint="e.g. gabi, netela, bulluko">
              <input
                type="text"
                className="input"
                required
                value={newFabricName}
                onChange={(e) => setNewFabricName(e.target.value)}
              />
            </FormField>
            <FormField label="Standard weight (ግራም)" required>
              <input
                type="number"
                className="input"
                required
                value={newFabricWeight}
                onChange={(e) => setNewFabricWeight(e.target.value)}
              />
            </FormField>
            <div className="form-row">
              <FormField label="Standard length (cm)" required>
                <input
                  type="number"
                  className="input"
                  required
                  value={newFabricLength}
                  onChange={(e) => setNewFabricLength(e.target.value)}
                />
              </FormField>
              <FormField label="Standard width (cm)" required>
                <input
                  type="number"
                  className="input"
                  required
                  value={newFabricWidth}
                  onChange={(e) => setNewFabricWidth(e.target.value)}
                />
              </FormField>
            </div>
          </>
        )}

        {/* Fabric Variant fields with Inline Creators */}
        {activeTab === "fabricVariants" && (
          <>
            {/* Fabric Selector + Inline Form */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>Fabric · ጨርቅ</label>
                <button
                  type="button"
                  onClick={() => setShowNewFabricForm(!showNewFabricForm)}
                  style={{ background: "none", border: "none", color: "var(--brand, #C2410C)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {showNewFabricForm ? "− Cancel" : "+ New fabric"}
                </button>
              </div>

              {showNewFabricForm && (
                <div style={{ background: "var(--orange-bg, #fff7ed)", border: "1px solid #ffedd5", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.6rem" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#9a3412", marginBottom: "0.4rem" }}>Create base fabric</div>
                  <input
                    type="text"
                    placeholder="Fabric name (e.g. Bulluko / ቡሉኮ)"
                    value={inlineFabricName}
                    onChange={(e) => setInlineFabricName(e.target.value)}
                    className="input"
                    style={{ fontSize: "13px", padding: "0.45rem", marginBottom: "0.4rem" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <input type="number" placeholder="Weight (g)" value={inlineFabricWeight} onChange={(e) => setInlineFabricWeight(e.target.value)} className="input" style={{ fontSize: "12px", padding: "0.4rem" }} />
                    <input type="number" placeholder="Length (cm)" value={inlineFabricLength} onChange={(e) => setInlineFabricLength(e.target.value)} className="input" style={{ fontSize: "12px", padding: "0.4rem" }} />
                    <input type="number" placeholder="Width (cm)" value={inlineFabricWidth} onChange={(e) => setInlineFabricWidth(e.target.value)} className="input" style={{ fontSize: "12px", padding: "0.4rem" }} />
                  </div>
                  <button type="button" onClick={handleCreateInlineFabric} className="btn btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "12px" }}>
                    Add & Select Fabric
                  </button>
                </div>
              )}

              <SearchableSelect
                value={newFvFabricId}
                onChange={(val) => setNewFvFabricId(val ? Number(val) : "")}
                options={fabrics.map((f) => ({ id: f.fabricId, title: f.name, subtitle: `${f.standardWeightG}g standard` }))}
                placeholder="Select fabric…"
                onAddNew={() => setShowNewFabricForm(true)}
                addNewLabel="New fabric"
              />
            </div>

            {/* Warp & Weft Color Selectors + Inline Forms */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <label className="form-label" style={{ fontSize: "12.5px", fontWeight: 600 }}>Warp color · የድረ</label>
                  <button
                    type="button"
                    onClick={() => setShowNewWarpColorForm(!showNewWarpColorForm)}
                    style={{ background: "none", border: "none", color: "var(--brand, #C2410C)", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {showNewWarpColorForm ? "−" : "+ New"}
                  </button>
                </div>

                {showNewWarpColorForm && (
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Color name"
                      value={inlineWarpColorName}
                      onChange={(e) => setInlineWarpColorName(e.target.value)}
                      className="input"
                      style={{ flex: 1, padding: "0.35rem", fontSize: "12px" }}
                    />
                    <button type="button" onClick={handleCreateInlineWarpColor} className="btn btn-primary" style={{ padding: "0.35rem 0.5rem", fontSize: "12px" }}>
                      Add
                    </button>
                  </div>
                )}

                <SearchableSelect
                  value={newFvWarpColorId}
                  onChange={(val) => setNewFvWarpColorId(val ? Number(val) : "")}
                  options={colors.map((c) => ({ id: c.colorId, title: c.name, badge: c.hexCode }))}
                  placeholder="Select warp color…"
                  onAddNew={() => setShowNewWarpColorForm(true)}
                  addNewLabel="New color"
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <label className="form-label" style={{ fontSize: "12.5px", fontWeight: 600 }}>Weft color · የማግ</label>
                  <button
                    type="button"
                    onClick={() => setShowNewWeftColorForm(!showNewWeftColorForm)}
                    style={{ background: "none", border: "none", color: "var(--brand, #C2410C)", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {showNewWeftColorForm ? "−" : "+ New"}
                  </button>
                </div>

                {showNewWeftColorForm && (
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Color name"
                      value={inlineWeftColorName}
                      onChange={(e) => setInlineWeftColorName(e.target.value)}
                      className="input"
                      style={{ flex: 1, padding: "0.35rem", fontSize: "12px" }}
                    />
                    <button type="button" onClick={handleCreateInlineWeftColor} className="btn btn-primary" style={{ padding: "0.35rem 0.5rem", fontSize: "12px" }}>
                      Add
                    </button>
                  </div>
                )}

                <SearchableSelect
                  value={newFvWeftColorId}
                  onChange={(val) => setNewFvWeftColorId(val ? Number(val) : "")}
                  options={colors.map((c) => ({ id: c.colorId, title: c.name, badge: c.hexCode }))}
                  placeholder="Select weft color…"
                  onAddNew={() => setShowNewWeftColorForm(true)}
                  addNewLabel="New color"
                />
              </div>
            </div>

            {/* Design Selector + Inline Form */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>Design Pattern · ጥበብ</label>
                <button
                  type="button"
                  onClick={() => setShowNewDesignForm(!showNewDesignForm)}
                  style={{ background: "none", border: "none", color: "var(--brand, #C2410C)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {showNewDesignForm ? "− Cancel" : "+ New design"}
                </button>
              </div>

              {showNewDesignForm && (
                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                  <input
                    type="text"
                    placeholder="Design pattern name"
                    value={inlineDesignName}
                    onChange={(e) => setInlineDesignName(e.target.value)}
                    className="input"
                    style={{ flex: 1, padding: "0.4rem", fontSize: "12.5px" }}
                  />
                  <button type="button" onClick={handleCreateInlineDesign} className="btn btn-primary" style={{ padding: "0.4rem 0.65rem", fontSize: "12px" }}>
                    Add
                  </button>
                </div>
              )}

              <SearchableSelect
                value={newFvDesignId}
                onChange={(val) => setNewFvDesignId(val ? Number(val) : "")}
                options={designs.map((d) => ({ id: d.designId, title: d.name }))}
                placeholder="Select design…"
                onAddNew={() => setShowNewDesignForm(true)}
                addNewLabel="New design"
              />
            </div>

            <div className="text-xs text-secondary mt-1">
              ℹ️ SKU is generated automatically with a deterministic format (e.g. FV-{'{fabric}'}-{'{design}'}-{'{warp}'}-{'{weft}'}).
            </div>
          </>
        )}

        {/* Yarn fields */}
        {activeTab === "yarns" && (
          <FormField label="Yarn Name (የክር ስም)" required hint="e.g. Cotton 21/2, Akaki Yarn">
            <input
              type="text"
              className="input"
              required
              value={newSimpleName}
              onChange={(e) => setNewSimpleName(e.target.value)}
            />
          </FormField>
        )}

        {/* Yarn Variant fields with Inline Creators */}
        {activeTab === "yarnVariants" && (
          <>
            {/* Yarn Selector + Inline Form */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>Yarn · ክር</label>
                <button
                  type="button"
                  onClick={() => setShowNewYarnForm(!showNewYarnForm)}
                  style={{ background: "none", border: "none", color: "var(--brand, #C2410C)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {showNewYarnForm ? "− Cancel" : "+ New yarn"}
                </button>
              </div>

              {showNewYarnForm && (
                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                  <input
                    type="text"
                    placeholder="Yarn material / name"
                    value={inlineYarnName}
                    onChange={(e) => setInlineYarnName(e.target.value)}
                    className="input"
                    style={{ flex: 1, padding: "0.4rem", fontSize: "12.5px" }}
                  />
                  <button type="button" onClick={handleCreateInlineYarn} className="btn btn-primary" style={{ padding: "0.4rem 0.65rem", fontSize: "12px" }}>
                    Add
                  </button>
                </div>
              )}

              <SearchableSelect
                value={newYvYarnId}
                onChange={(val) => setNewYvYarnId(val ? Number(val) : "")}
                options={yarns.map((y) => ({ id: y.yarnId, title: y.name }))}
                placeholder="Select yarn…"
                onAddNew={() => setShowNewYarnForm(true)}
                addNewLabel="New yarn"
              />
            </div>

            {/* Yarn Color Selector + Inline Form */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>Color · ቀለም</label>
                <button
                  type="button"
                  onClick={() => setShowNewYarnColorForm(!showNewYarnColorForm)}
                  style={{ background: "none", border: "none", color: "var(--brand, #C2410C)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {showNewYarnColorForm ? "− Cancel" : "+ New color"}
                </button>
              </div>

              {showNewYarnColorForm && (
                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                  <input
                    type="text"
                    placeholder="Color shade name"
                    value={inlineYarnColorName}
                    onChange={(e) => setInlineYarnColorName(e.target.value)}
                    className="input"
                    style={{ flex: 1, padding: "0.4rem", fontSize: "12.5px" }}
                  />
                  <button type="button" onClick={handleCreateInlineYarnColor} className="btn btn-primary" style={{ padding: "0.4rem 0.65rem", fontSize: "12px" }}>
                    Add
                  </button>
                </div>
              )}

              <SearchableSelect
                value={newYvColorId}
                onChange={(val) => setNewYvColorId(val ? Number(val) : "")}
                options={colors.map((c) => ({ id: c.colorId, title: c.name, badge: c.hexCode }))}
                placeholder="Select color…"
                onAddNew={() => setShowNewYarnColorForm(true)}
                addNewLabel="New color"
              />
            </div>

            {/* Supplier Selector + Inline Form */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: 600 }}>Supplier · አቅራቢ</label>
                <button
                  type="button"
                  onClick={() => setShowNewSupplierForm(!showNewSupplierForm)}
                  style={{ background: "none", border: "none", color: "var(--brand, #C2410C)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {showNewSupplierForm ? "− Cancel" : "+ New supplier"}
                </button>
              </div>

              {showNewSupplierForm && (
                <div style={{ background: "var(--orange-bg, #fff7ed)", border: "1px solid #ffedd5", borderRadius: "8px", padding: "0.6rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Supplier name"
                      value={inlineSupplierName}
                      onChange={(e) => setInlineSupplierName(e.target.value)}
                      className="input"
                      style={{ fontSize: "12.5px", padding: "0.4rem" }}
                    />
                    <input
                      type="text"
                      placeholder="Phone (optional)"
                      value={inlineSupplierPhone}
                      onChange={(e) => setInlineSupplierPhone(e.target.value)}
                      className="input"
                      style={{ fontSize: "12.5px", padding: "0.4rem" }}
                    />
                  </div>
                  <button type="button" onClick={handleCreateInlineSupplier} className="btn btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "12px" }}>
                    Add & Select Supplier
                  </button>
                </div>
              )}

              <SearchableSelect
                value={newYvSupplierId}
                onChange={(val) => setNewYvSupplierId(val ? Number(val) : "")}
                options={suppliers.map((s) => ({ id: s.supplierId, title: s.name, subtitle: s.contactPhone }))}
                placeholder="Select supplier…"
                onAddNew={() => setShowNewSupplierForm(true)}
                addNewLabel="New supplier"
              />
            </div>

            <div className="text-xs text-secondary mt-1">
              ℹ️ SKU is generated automatically with a deterministic format (e.g. YV-{'{yarn}'}-{'{supplier}'}-{'{color}'}).
            </div>
          </>
        )}

        {/* Color fields */}
        {activeTab === "colors" && (
          <>
            <FormField label="Color Name (የቀለም ስም)" required hint="e.g. White, Black, Red, Indigo">
              <input
                type="text"
                className="input"
                required
                value={newSimpleName}
                onChange={(e) => setNewSimpleName(e.target.value)}
              />
            </FormField>
            <FormField label="Color Hex Code (የቀለም ኮድ)">
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  style={{ width: 42, height: 38, padding: 0, border: "1.5px solid var(--border)", borderRadius: "6px", cursor: "pointer" }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="#000000"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </FormField>
          </>
        )}

        {/* Design fields */}
        {activeTab === "designs" && (
          <FormField label="Design Pattern Name (የጥበብ ስም)" required hint="e.g. Tibeb Classic, Border Weave">
            <input
              type="text"
              className="input"
              required
              value={newSimpleName}
              onChange={(e) => setNewSimpleName(e.target.value)}
            />
          </FormField>
        )}

        {/* Supplier fields */}
        {activeTab === "suppliers" && (
          <>
            <FormField label="Supplier Name (የአቅራቢ ስም)" required>
              <input
                type="text"
                className="input"
                required
                value={newSimpleName}
                onChange={(e) => setNewSimpleName(e.target.value)}
              />
            </FormField>
            <FormField label="Contact Phone (ስልክ ቁጥር)">
              <input
                type="text"
                className="input"
                placeholder="e.g. 0911234567"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
              />
            </FormField>
          </>
        )}

        <div className="cluster-end" style={{ marginTop: "var(--space-4)" }}>
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={saving}>
            Save to Catalog
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddCatalogItemModal;
