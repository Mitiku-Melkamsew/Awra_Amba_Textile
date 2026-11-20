import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { catalogApi } from "../../api";
import type { FabricVariant, FabricPriceRow } from "../../api";

type CatalogTab =
  | "fabrics"
  | "fabricVariants"
  | "yarns"
  | "yarnVariants"
  | "colors"
  | "designs"
  | "suppliers";

interface FabricWithRates {
  fabricId: number;
  name: string;
  standardLengthCm: number;
  standardWidthCm: number;
  standardWeightG: number;
  weaverRate: number;
  sellingPrice: number;
  isActive: boolean;
}

const DEFAULT_FABRICS: FabricWithRates[] = [
  {
    fabricId: 1,
    name: "medebegna",
    standardLengthCm: 240,
    standardWidthCm: 150,
    standardWeightG: 64,
    weaverRate: 1300,
    sellingPrice: 1900,
    isActive: true,
  },
  {
    fabricId: 2,
    name: "gabi",
    standardLengthCm: 240,
    standardWidthCm: 150,
    standardWeightG: 520,
    weaverRate: 950,
    sellingPrice: 1400,
    isActive: true,
  },
  {
    fabricId: 3,
    name: "netela",
    standardLengthCm: 200,
    standardWidthCm: 100,
    standardWeightG: 150,
    weaverRate: 700,
    sellingPrice: 1050,
    isActive: true,
  },
];

export function CatalogPage() {
  const [tab, setTab] = useState<CatalogTab>("fabrics");
  const [search, setSearch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);

  // Data states
  const [fabrics, setFabrics] = useState<FabricWithRates[]>(DEFAULT_FABRICS);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarns, setYarns] = useState<any[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Selection state for master-detail
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(2); // defaults to gabi

  // Edit form states for right panel
  const [editWeight, setEditWeight] = useState("520");
  const [editLength, setEditLength] = useState("240");
  const [editWidth, setEditWidth] = useState("150");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);

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
  const [newFvSku, setNewFvSku] = useState("");

  // Add Yarn Variant fields
  const [newYvYarnId, setNewYvYarnId] = useState<number | "">("");
  const [newYvColorId, setNewYvColorId] = useState<number | "">("");
  const [newYvSupplierId, setNewYvSupplierId] = useState<number | "">("");
  const [newYvSku, setNewYvSku] = useState("");

  // Add Simple items (Yarn, Color, Design, Supplier)
  const [newSimpleName, setNewSimpleName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAllData() {
    setLoading(true);
    try {
      const [fabList, fpList, fvList, yList, yvList, colList, desList, supList] =
        await Promise.all([
          catalogApi.fabrics().catch(() => []),
          catalogApi.fabricPrices().catch(() => []),
          catalogApi.fabricVariants().catch(() => []),
          catalogApi.yarns().catch(() => []),
          catalogApi.yarnVariants().catch(() => []),
          catalogApi.colors().catch(() => []),
          catalogApi.designs().catch(() => []),
          catalogApi.suppliers().catch(() => []),
        ]);

      if (fabList && fabList.length > 0) {
        const defaultRates: Record<string, { weaver: number; sell: number }> = {
          medebegna: { weaver: 1300, sell: 1900 },
          gabi: { weaver: 950, sell: 1400 },
          netela: { weaver: 700, sell: 1050 },
        };

        const combined: FabricWithRates[] = fabList.map((f: any) => {
          const matchedPrices = fpList.filter((p: FabricPriceRow) => p.fabricId === f.fabricId && p.isActive !== false);
          matchedPrices.sort(
            (a: FabricPriceRow, b: FabricPriceRow) =>
              new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime()
          );
          const currentPrice = matchedPrices[0];
          const fname = (f.name || "").toLowerCase();
          const fallback = defaultRates[fname] || { weaver: 1000, sell: 1500 };

          return {
            fabricId: f.fabricId,
            name: fname,
            standardLengthCm: Number(f.standardLengthCm ?? 240),
            standardWidthCm: Number(f.standardWidthCm ?? 150),
            standardWeightG: Number(f.standardWeightG ?? 520),
            weaverRate: currentPrice ? Number(currentPrice.weaverRate) : fallback.weaver,
            sellingPrice: currentPrice ? Number(currentPrice.sellingPrice) : fallback.sell,
            isActive: f.isActive !== false,
          };
        });

        setFabrics(combined);
        const gabi = combined.find((f) => f.name.includes("gabi")) || combined[0];
        if (gabi) {
          setSelectedFabricId(gabi.fabricId);
          setEditWeight(String(gabi.standardWeightG));
          setEditLength(String(gabi.standardLengthCm));
          setEditWidth(String(gabi.standardWidthCm));
        }
      } else {
        setFabrics(DEFAULT_FABRICS);
        setSelectedFabricId(2);
        setEditWeight("520");
        setEditLength("240");
        setEditWidth("150");
      }

      setFabricVariants(fvList || []);
      setYarns(yList || []);
      setYarnVariants(yvList || []);
      setColors(colList || []);
      setDesigns(desList || []);
      setSuppliers(supList || []);
    } catch {
      setFabrics(DEFAULT_FABRICS);
      setSelectedFabricId(2);
      setEditWeight("520");
      setEditLength("240");
      setEditWidth("150");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  // Update selected fabric edit fields when selectedFabricId changes
  const selectedFabric = useMemo(() => {
    return fabrics.find((f) => f.fabricId === selectedFabricId) || null;
  }, [fabrics, selectedFabricId]);

  function handleSelectFabric(f: FabricWithRates) {
    setSelectedFabricId(f.fabricId);
    setEditWeight(String(f.standardWeightG));
    setEditLength(String(f.standardLengthCm));
    setEditWidth(String(f.standardWidthCm));
    setStatusMessage("");
    setErrorMessage("");
  }

  function resetAddModalFields() {
    setNewFabricName("");
    setNewFabricWeight("");
    setNewFabricLength("");
    setNewFabricWidth("");
    setNewFvFabricId(fabrics[0]?.fabricId || "");
    setNewFvWarpColorId(colors[0]?.colorId || "");
    setNewFvWeftColorId(colors[0]?.colorId || "");
    setNewFvDesignId(designs[0]?.designId || "");
    setNewFvSku("");
    setNewYvYarnId(yarns[0]?.yarnId || "");
    setNewYvColorId(colors[0]?.colorId || "");
    setNewYvSupplierId(suppliers[0]?.supplierId || "");
    setNewYvSku("");
    setNewSimpleName("");
    setNewSupplierPhone("");
    setErrorMessage("");
  }

  function openAddModal() {
    resetAddModalFields();
    setShowAddModal(true);
  }

  async function handleSaveFabricChanges(e: FormEvent) {
    e.preventDefault();
    if (!selectedFabric) return;

    const wNum = parseFloat(editWeight);
    const lNum = parseFloat(editLength);
    const wdNum = parseFloat(editWidth);

    if (isNaN(wNum) || isNaN(lNum) || isNaN(wdNum)) {
      setErrorMessage("Please enter valid numeric dimensions and weight.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.updateFabric(selectedFabric.fabricId, {
        standardWeightG: wNum,
        standardLengthCm: lNum,
        standardWidthCm: wdNum,
      });

      setStatusMessage(`Fabric "${selectedFabric.name}" specifications updated.`);
      setFabrics((prev) =>
        prev.map((f) =>
          f.fabricId === selectedFabric.fabricId
            ? { ...f, standardWeightG: wNum, standardLengthCm: lNum, standardWidthCm: wdNum }
            : f
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update fabric");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFabricStatus() {
    if (!selectedFabric) return;
    const nextActive = !selectedFabric.isActive;

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.updateFabric(selectedFabric.fabricId, { isActive: nextActive });
      setStatusMessage(
        `Fabric "${selectedFabric.name}" ${nextActive ? "reactivated" : "deactivated"}.`
      );
      setFabrics((prev) =>
        prev.map((f) =>
          f.fabricId === selectedFabric.fabricId ? { ...f, isActive: nextActive } : f
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update fabric status");
    } finally {
      setSaving(false);
    }
  }

  // Add Form Handlers
  async function handleCreateFabric(e: FormEvent) {
    e.preventDefault();
    if (!newFabricName.trim() || !newFabricWeight || !newFabricLength || !newFabricWidth) {
      setErrorMessage("All three measurements and fabric name are required.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const created = await catalogApi.createFabric({
        name: newFabricName.trim().toLowerCase(),
        standardWeightG: Number(newFabricWeight),
        standardLengthCm: Number(newFabricLength),
        standardWidthCm: Number(newFabricWidth),
      });

      setShowAddModal(false);
      resetAddModalFields();
      setStatusMessage(`Fabric added successfully.`);
      await loadAllData();
      if (created && (created as any).fabricId) {
        setSelectedFabricId((created as any).fabricId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create fabric");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFabricVariant(e: FormEvent) {
    e.preventDefault();
    if (!newFvFabricId || !newFvWarpColorId || !newFvWeftColorId || !newFvDesignId) {
      setErrorMessage("Please select Fabric, Warp color, Weft color, and Design.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.createFabricVariant({
        fabricId: Number(newFvFabricId),
        warpColorId: Number(newFvWarpColorId),
        weftColorId: Number(newFvWeftColorId),
        designId: Number(newFvDesignId),
        sku: newFvSku.trim() || undefined,
      });

      setShowAddModal(false);
      resetAddModalFields();
      setStatusMessage("Fabric type (variant) added successfully.");
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create fabric variant");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateYarn(e: FormEvent) {
    e.preventDefault();
    if (!newSimpleName.trim()) {
      setErrorMessage("Yarn name is required.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.createYarn({ name: newSimpleName.trim() });
      setShowAddModal(false);
      resetAddModalFields();
      setStatusMessage("Yarn added successfully.");
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create yarn");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateYarnVariant(e: FormEvent) {
    e.preventDefault();
    if (!newYvYarnId || !newYvColorId || !newYvSupplierId) {
      setErrorMessage("Please select Yarn, Color, and Supplier.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.createYarnVariant({
        yarnId: Number(newYvYarnId),
        colorId: Number(newYvColorId),
        supplierId: Number(newYvSupplierId),
        sku: newYvSku.trim() || undefined,
      });

      setShowAddModal(false);
      resetAddModalFields();
      setStatusMessage("Yarn type (variant) added successfully.");
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create yarn variant");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateColor(e: FormEvent) {
    e.preventDefault();
    if (!newSimpleName.trim()) {
      setErrorMessage("Color name is required.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.createColor({ name: newSimpleName.trim() });
      setShowAddModal(false);
      resetAddModalFields();
      setStatusMessage("Color added successfully.");
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create color");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateDesign(e: FormEvent) {
    e.preventDefault();
    if (!newSimpleName.trim()) {
      setErrorMessage("Design name is required.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.createDesign({ name: newSimpleName.trim() });
      setShowAddModal(false);
      resetAddModalFields();
      setStatusMessage("Design added successfully.");
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create design");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSupplier(e: FormEvent) {
    e.preventDefault();
    if (!newSimpleName.trim()) {
      setErrorMessage("Supplier name is required.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.createSupplier({
        name: newSimpleName.trim(),
        contactPhone: newSupplierPhone.trim() || undefined,
      });
      setShowAddModal(false);
      resetAddModalFields();
      setStatusMessage("Supplier added successfully.");
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create supplier");
    } finally {
      setSaving(false);
    }
  }

  // Filtered fabrics
  const q = search.toLowerCase().trim();
  const displayedFabrics = useMemo(() => {
    return fabrics.filter((f) => {
      if (!showDeactivated && !f.isActive) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q);
    });
  }, [fabrics, showDeactivated, q]);

  // Tab counts for the sidebar
  const tabsList = [
    { key: "fabrics" as const, label: "Fabrics", count: fabrics.length || 3 },
    { key: "fabricVariants" as const, label: "Fabric types", count: fabricVariants.length || 6 },
    { key: "yarns" as const, label: "Yarns", count: yarns.length || 2 },
    { key: "yarnVariants" as const, label: "Yarn types", count: yarnVariants.length || 5 },
    { key: "colors" as const, label: "Colors", count: colors.length || 8 },
    { key: "designs" as const, label: "Designs", count: designs.length || 3 },
    { key: "suppliers" as const, label: "Suppliers", count: suppliers.length || 2 },
  ];

  return (
    <div className="page" style={{ maxWidth: "100%", width: "100%" }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 800,
            color: "#111827",
            margin: 0,
            display: "flex",
            alignItems: "baseline",
            gap: "0.5rem",
          }}
        >
          Catalog <span style={{ color: "#6B7280", fontWeight: 400, fontSize: "20px" }}>· ካታሎግ</span>
        </h1>

        <button
          type="button"
          className="btn-primary-rust"
          onClick={openAddModal}
        >
          {tab === "fabrics"
            ? "+ Add fabric"
            : tab === "fabricVariants"
            ? "+ Add fabric type"
            : tab === "yarns"
            ? "+ Add yarn"
            : tab === "yarnVariants"
            ? "+ Add yarn type"
            : tab === "colors"
            ? "+ Add color"
            : tab === "designs"
            ? "+ Add design"
            : "+ Add supplier"}
        </button>
      </div>

      {statusMessage && (
        <div className="success-msg" style={{ marginBottom: "1rem" }}>
          <span>✅</span> {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* ── Main Layout: Vertical Tabs Sidebar + Content ── */}
      <div className="catalog-outer-layout">
        {/* Left vertical navigation */}
        <aside className="catalog-nav-vertical">
          {tabsList.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`catalog-nav-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => {
                setTab(t.key);
                setSearch("");
                setStatusMessage("");
                setErrorMessage("");
              }}
            >
              <span>{t.label}</span>
              <span className="badge-count">{t.count}</span>
            </button>
          ))}
        </aside>

        {/* Right Area: Search + Master Detail */}
        <div style={{ minWidth: 0, width: "100%" }}>
          {/* Search bar & Deactivated toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ position: "relative", flex: 1, maxWidth: 480 }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "14px",
                  color: "#94A3B8",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder={`Search ${tabsList.find((t) => t.key === tab)?.label.toLowerCase()} by name`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "36px" }}
              />
            </div>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={showDeactivated}
                onChange={(e) => setShowDeactivated(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#C2410C", cursor: "pointer" }}
              />
              Show deactivated
            </label>
          </div>

          {/* ── Tab Content: Fabrics ── */}
          {tab === "fabrics" && (
            <div className={`catalog-master-detail-grid ${selectedFabric ? "" : "no-panel"}`}>
              {/* Left: Fabrics Table */}
              <div className="prices-table-container">
                <div className="prices-table-card">
                  <table className="prices-table">
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: "nowrap" }}>Fabric · ጨርቅ</th>
                        <th style={{ whiteSpace: "nowrap" }}>Weight (g)</th>
                        <th style={{ whiteSpace: "nowrap" }}>Length (cm)</th>
                        <th style={{ whiteSpace: "nowrap" }}>Width (cm)</th>
                        <th style={{ whiteSpace: "nowrap" }}>Weaver rate</th>
                        <th style={{ whiteSpace: "nowrap" }}>Selling price</th>
                        <th style={{ whiteSpace: "nowrap" }}>Status</th>
                        <th style={{ width: "70px", textAlign: "right", whiteSpace: "nowrap" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && fabrics.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                            Loading fabrics…
                          </td>
                        </tr>
                      ) : displayedFabrics.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                            No fabrics found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        displayedFabrics.map((fabric) => {
                          const isSelected = selectedFabric?.fabricId === fabric.fabricId;

                          return (
                            <tr
                              key={fabric.fabricId}
                              className={`price-row ${isSelected ? "price-row-selected" : ""}`}
                              onClick={() => handleSelectFabric(fabric)}
                            >
                              <td style={{ whiteSpace: "nowrap" }}>
                                <span className="price-item-name">{fabric.name}</span>
                              </td>
                              <td style={{ fontSize: "13.5px", color: "#111827", whiteSpace: "nowrap" }}>
                                {fabric.standardWeightG}
                              </td>
                              <td style={{ fontSize: "13.5px", color: "#111827", whiteSpace: "nowrap" }}>
                                {fabric.standardLengthCm}
                              </td>
                              <td style={{ fontSize: "13.5px", color: "#111827", whiteSpace: "nowrap" }}>
                                {fabric.standardWidthCm}
                              </td>
                              <td style={{ fontSize: "13.5px", fontWeight: 500, color: "#111827", whiteSpace: "nowrap" }}>
                                {fabric.weaverRate.toLocaleString()}
                              </td>
                              <td style={{ fontSize: "13.5px", fontWeight: 500, color: "#111827", whiteSpace: "nowrap" }}>
                                {fabric.sellingPrice.toLocaleString()}
                              </td>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {fabric.isActive ? (
                                  <span className="status-pill-green">✓ Active</span>
                                ) : (
                                  <span className="status-pill-gray">Deactivated</span>
                                )}
                              </td>
                              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                <button
                                  type="button"
                                  className="btn-secondary-white btn-sm"
                                  style={{ padding: "0.35rem 0.65rem", fontSize: "12.5px" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectFabric(fabric);
                                  }}
                                >
                                  <span style={{ fontSize: "12px", opacity: 0.8 }}>✏️</span> Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Edit fabric detail panel */}
              {selectedFabric && (
                <div className="edit-detail-panel">
                  <div className="detail-panel-header">
                    <div>
                      <h3 className="detail-panel-title">Edit fabric · {selectedFabric.name}</h3>
                      <p className="detail-panel-sub">Name can't be changed here</p>
                    </div>
                    <button
                      type="button"
                      className="detail-close-btn"
                      onClick={() => setSelectedFabricId(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveFabricChanges}>
                    <div className="field-label">
                      Standard weight (g)
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="field-label">
                        Length (cm)
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={editLength}
                          onChange={(e) => setEditLength(e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="field-label">
                        Width (cm)
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={editWidth}
                          onChange={(e) => setEditWidth(e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                      <button
                        type="submit"
                        className="btn-primary-rust"
                        style={{ flex: 1 }}
                        disabled={saving}
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary-white"
                        onClick={() => setSelectedFabricId(null)}
                      >
                        Cancel
                      </button>
                    </div>

                    <p style={{ margin: "1rem 0 0", fontSize: "12px", color: "#64748B", lineHeight: 1.45 }}>
                      Weight below the standard is deducted at settlement. Rates are set in Prices.
                    </p>

                    <button
                      type="button"
                      className="danger-link-btn"
                      onClick={handleToggleFabricStatus}
                      disabled={saving}
                    >
                      {selectedFabric.isActive
                        ? "Deactivate this fabric…"
                        : "Reactivate this fabric…"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── Tab Content: Fabric Types (Variants) ── */}
          {tab === "fabricVariants" && (
            <div className="prices-table-card">
              <table className="prices-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Fabric</th>
                    <th>Warp color</th>
                    <th>Weft color</th>
                    <th>Design pattern</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fabricVariants.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                        No fabric variants configured.
                      </td>
                    </tr>
                  ) : (
                    fabricVariants
                      .filter((v) => (showDeactivated ? true : v.isActive !== false))
                      .map((fv) => (
                        <tr key={fv.fabricVariantId} className="price-row">
                          <td style={{ fontWeight: 700, color: "#C2410C" }}>{fv.sku}</td>
                          <td>{fv.fabric?.name ?? "Fabric"}</td>
                          <td>{fv.warpColor?.name ?? "Natural"}</td>
                          <td>{fv.weftColor?.name ?? "Natural"}</td>
                          <td>{fv.design?.name ?? "Standard"}</td>
                          <td>
                            {fv.isActive !== false ? (
                              <span className="status-pill-green">✓ Active</span>
                            ) : (
                              <span className="status-pill-gray">Deactivated</span>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tab Content: Yarns ── */}
          {tab === "yarns" && (
            <div className="prices-table-card">
              <table className="prices-table">
                <thead>
                  <tr>
                    <th>Yarn name · ክር</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {yarns.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                        No yarns recorded.
                      </td>
                    </tr>
                  ) : (
                    yarns.map((y) => (
                      <tr key={y.yarnId} className="price-row">
                        <td style={{ fontWeight: 700 }}>{y.name}</td>
                        <td>
                          {y.isActive !== false ? (
                            <span className="status-pill-green">✓ Active</span>
                          ) : (
                            <span className="status-pill-gray">Deactivated</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tab Content: Yarn Types (Variants) ── */}
          {tab === "yarnVariants" && (
            <div className="prices-table-card">
              <table className="prices-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Yarn</th>
                    <th>Color</th>
                    <th>Supplier</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {yarnVariants.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                        No yarn variants recorded.
                      </td>
                    </tr>
                  ) : (
                    yarnVariants.map((yv) => (
                      <tr key={yv.yarnVariantId} className="price-row">
                        <td style={{ fontWeight: 700, color: "#C2410C" }}>{yv.sku}</td>
                        <td>{yv.yarn?.name ?? "Yarn"}</td>
                        <td>{yv.color?.name ?? "Natural"}</td>
                        <td>{yv.supplier?.name ?? "Supplier"}</td>
                        <td>
                          {yv.isActive !== false ? (
                            <span className="status-pill-green">✓ Active</span>
                          ) : (
                            <span className="status-pill-gray">Deactivated</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tab Content: Colors ── */}
          {tab === "colors" && (
            <div className="prices-table-card">
              <table className="prices-table">
                <thead>
                  <tr>
                    <th>Color name · ቀለም</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                        No colors recorded.
                      </td>
                    </tr>
                  ) : (
                    colors.map((c) => (
                      <tr key={c.colorId} className="price-row">
                        <td style={{ fontWeight: 700 }}>{c.name}</td>
                        <td style={{ color: "#64748B" }}>#{c.colorId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tab Content: Designs ── */}
          {tab === "designs" && (
            <div className="prices-table-card">
              <table className="prices-table">
                <thead>
                  <tr>
                    <th>Design pattern · ጥበብ/ስልት</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {designs.length === 0 ? (
                    <tr>
                      <td colSpan={2} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                        No designs recorded.
                      </td>
                    </tr>
                  ) : (
                    designs.map((d) => (
                      <tr key={d.designId} className="price-row">
                        <td style={{ fontWeight: 700 }}>{d.name}</td>
                        <td style={{ color: "#64748B" }}>#{d.designId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Tab Content: Suppliers ── */}
          {tab === "suppliers" && (
            <div className="prices-table-card">
              <table className="prices-table">
                <thead>
                  <tr>
                    <th>Supplier · አቅራቢ</th>
                    <th>Contact phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                        No suppliers recorded.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.supplierId} className="price-row">
                        <td style={{ fontWeight: 700 }}>{s.name}</td>
                        <td style={{ color: "#64748B" }}>{s.contactPhone || "—"}</td>
                        <td>
                          {s.isActive !== false ? (
                            <span className="status-pill-green">✓ Active</span>
                          ) : (
                            <span className="status-pill-gray">Deactivated</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Fabric Modal ── */}
      {showAddModal && tab === "fabrics" && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add fabric</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFabric}>
              <div className="field-label">
                Name · የሞርት ስም
                <input
                  type="text"
                  placeholder="e.g. Gabi / ጋቢ"
                  value={newFabricName}
                  onChange={(e) => setNewFabricName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="field-label">
                Standard weight (g) · መደበኛ ክብደት
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Required"
                  value={newFabricWeight}
                  onChange={(e) => setNewFabricWeight(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="field-label">
                  Length (cm)
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Required"
                    value={newFabricLength}
                    onChange={(e) => setNewFabricLength(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div className="field-label">
                  Width (cm)
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Required"
                    value={newFabricWidth}
                    onChange={(e) => setNewFabricWidth(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <p style={{ margin: "0.5rem 0 1.25rem", fontSize: "12.5px", color: "#64748B", lineHeight: 1.45 }}>
                All three measurements are required. Weight below the standard is deducted at settlement.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={saving}
                >
                  {saving ? "Adding…" : "Add fabric"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Fabric Type (Variant) Modal ── */}
      {showAddModal && tab === "fabricVariants" && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add fabric type</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFabricVariant}>
              <div className="field-label">
                Fabric
                <select
                  value={newFvFabricId}
                  onChange={(e) => setNewFvFabricId(Number(e.target.value))}
                  className="input-field"
                  required
                >
                  <option value="">Select fabric</option>
                  {fabrics.map((f) => (
                    <option key={f.fabricId} value={f.fabricId}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="field-label">
                  Warp color
                  <select
                    value={newFvWarpColorId}
                    onChange={(e) => setNewFvWarpColorId(Number(e.target.value))}
                    className="input-field"
                    required
                  >
                    <option value="">Select color</option>
                    {colors.map((c) => (
                      <option key={c.colorId} value={c.colorId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-label">
                  Weft color
                  <select
                    value={newFvWeftColorId}
                    onChange={(e) => setNewFvWeftColorId(Number(e.target.value))}
                    className="input-field"
                    required
                  >
                    <option value="">Select color</option>
                    {colors.map((c) => (
                      <option key={c.colorId} value={c.colorId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-label">
                Design pattern
                <select
                  value={newFvDesignId}
                  onChange={(e) => setNewFvDesignId(Number(e.target.value))}
                  className="input-field"
                  required
                >
                  <option value="">Select design</option>
                  {designs.map((d) => (
                    <option key={d.designId} value={d.designId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-label">
                SKU (optional)
                <input
                  type="text"
                  placeholder="e.g. F-GAB-001"
                  value={newFvSku}
                  onChange={(e) => setNewFvSku(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={saving}
                >
                  {saving ? "Adding…" : "Add fabric type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Yarn Modal ── */}
      {showAddModal && tab === "yarns" && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add yarn</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateYarn}>
              <div className="field-label">
                Yarn material name · የክር ስም
                <input
                  type="text"
                  placeholder="e.g. Cotton / ጥጥ"
                  value={newSimpleName}
                  onChange={(e) => setNewSimpleName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Add yarn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Yarn Type (Variant) Modal ── */}
      {showAddModal && tab === "yarnVariants" && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add yarn type</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateYarnVariant}>
              <div className="field-label">
                Yarn
                <select
                  value={newYvYarnId}
                  onChange={(e) => setNewYvYarnId(Number(e.target.value))}
                  className="input-field"
                  required
                >
                  <option value="">Select yarn</option>
                  {yarns.map((y) => (
                    <option key={y.yarnId} value={y.yarnId}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-label">
                Color
                <select
                  value={newYvColorId}
                  onChange={(e) => setNewYvColorId(Number(e.target.value))}
                  className="input-field"
                  required
                >
                  <option value="">Select color</option>
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-label">
                Supplier
                <select
                  value={newYvSupplierId}
                  onChange={(e) => setNewYvSupplierId(Number(e.target.value))}
                  className="input-field"
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-label">
                SKU (optional)
                <input
                  type="text"
                  placeholder="e.g. Y-COT-RED"
                  value={newYvSku}
                  onChange={(e) => setNewYvSku(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={saving}
                >
                  {saving ? "Adding…" : "Add yarn type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Color Modal ── */}
      {showAddModal && tab === "colors" && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add color</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateColor}>
              <div className="field-label">
                Color name · ቀለም
                <input
                  type="text"
                  placeholder="e.g. Indigo / ሰማያዊ"
                  value={newSimpleName}
                  onChange={(e) => setNewSimpleName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Add color"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Design Modal ── */}
      {showAddModal && tab === "designs" && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add design</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDesign}>
              <div className="field-label">
                Design pattern · ጥበብ/ስልት
                <input
                  type="text"
                  placeholder="e.g. Diamond border"
                  value={newSimpleName}
                  onChange={(e) => setNewSimpleName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Add design"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Supplier Modal ── */}
      {showAddModal && tab === "suppliers" && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 className="modal-title">Add supplier</h3>
              <button
                type="button"
                className="detail-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier}>
              <div className="field-label">
                Supplier name · አቅራቢ
                <input
                  type="text"
                  placeholder="e.g. Bahir Dar Textile SC"
                  value={newSimpleName}
                  onChange={(e) => setNewSimpleName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="field-label">
                Contact phone
                <input
                  type="text"
                  placeholder="e.g. 0911000000"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn-secondary-white"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-rust"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Add supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogPage;
