import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  catalogApi,
  fabricReturnsApi,
  type Color,
  type Design,
  type Fabric,
  type FabricVariant,
  type WorkOrderDetail,
} from "../api";
import { fabricVariantName } from "../utils/variantNames";
import { findZigZagDesignId } from "../utils/defaultDesign";

type FabricReturnRow = WorkOrderDetail["fabricReturns"][number];

interface FabricReturnFormProps {
  order: WorkOrderDetail;
  onSaved: (message?: string) => void;
  editReturn?: FabricReturnRow;
  onCancel?: () => void;
  canRecord?: boolean;
}

export function FabricReturnForm({
  order,
  onSaved,
  editReturn,
  onCancel,
  canRecord = true,
}: FabricReturnFormProps) {
  // References
  const quantityInputRef = useRef<HTMLInputElement | null>(null);

  // Catalog lookups & variants
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);

  // Selected Fabric for the active return
  const orderVariant = order.fabricVariant ?? ({} as FabricVariant);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    Number(editReturn?.fabricVariant?.fabricVariantId ?? order.fabricVariantId ?? orderVariant.fabricVariantId ?? 0),
  );

  // Active return form inputs
  const [editingReturnId, setEditingReturnId] = useState<number | null>(
    editReturn ? editReturn.returnId : null,
  );
  const [quantity, setQuantity] = useState(
    editReturn ? String(editReturn.quantityReturned) : "",
  );
  const [totalWeight, setTotalWeight] = useState(
    editReturn ? String(editReturn.totalWeight) : "",
  );
  const [unitPrice, setUnitPrice] = useState(
    editReturn
      ? String(editReturn.unitPrice)
      : String((orderVariant as any).basePrice ?? (orderVariant as any).currentPrice?.weaverRate ?? 1380),
  );
  const [lengthCm, setLengthCm] = useState(
    editReturn && editReturn.lengthCm
      ? String(editReturn.lengthCm)
      : orderVariant.fabric?.standardLengthCm
      ? String(orderVariant.fabric.standardLengthCm)
      : "64",
  );
  const [widthCm, setWidthCm] = useState(
    editReturn && editReturn.widthCm
      ? String(editReturn.widthCm)
      : orderVariant.fabric?.standardWidthCm
      ? String(orderVariant.fabric.standardWidthCm)
      : "120",
  );
  const [remark, setRemark] = useState(editReturn?.remark ?? "");

  // Accordion & status
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal State (Image 1: Changing fabric)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalFabricId, setModalFabricId] = useState("");
  const [modalWarpColorId, setModalWarpColorId] = useState("");
  const [modalWeftColorId, setModalWeftColorId] = useState("");
  const [modalDesignId, setModalDesignId] = useState("");

  // Load catalog lookup & variants
  useEffect(() => {
    Promise.all([
      catalogApi.lookup(),
      catalogApi.fabricVariants(),
    ])
      .then(([lookup, variants]) => {
        setFabrics(lookup.fabrics);
        setColors(lookup.colors);
        setDesigns(lookup.designs);
        setFabricVariants(variants);

        // Pre-select modal dropdown fallbacks
        if (lookup.fabrics[0]) setModalFabricId(String(lookup.fabrics[0].fabricId));
        if (lookup.colors[0]) {
          setModalWarpColorId(String(lookup.colors[0].colorId));
          setModalWeftColorId(String(lookup.colors[0].colorId));
        }
        const defaultDesign = findZigZagDesignId(lookup.designs as any) ?? lookup.designs[0]?.designId;
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
      const varId = Number(editReturn.fabricVariant?.fabricVariantId ?? editReturn.fabricVariantId);
      if (varId) setSelectedVariantId(varId);
    }
  }, [editReturn]);

  // The resolved selected FabricVariant
  const selectedVariant: FabricVariant | undefined = useMemo(() => {
    const match = fabricVariants.find((v) => v.fabricVariantId === selectedVariantId);
    if (match) return match;
    if (orderVariant.fabricVariantId) return orderVariant as FabricVariant;
    return undefined;
  }, [fabricVariants, selectedVariantId, orderVariant]);

  // Readable name formatted with " · "
  const selectedVariantDisplayName = useMemo(() => {
    if (!selectedVariant) return "medebegna · biret · geberdin";
    return fabricVariantName(selectedVariant).split("-").join(" · ");
  }, [selectedVariant]);

  // Standard quality thresholds
  const standardWeight = selectedVariant?.fabric?.standardWeightG ?? 64;

  // Real-time averages for the current form entry
  const numQty = parseFloat(quantity) || 0;
  const numWeight = parseFloat(totalWeight) || 0;
  const currentAvgWeight = numQty > 0 ? numWeight / numQty : 0;
  const isCurrentUnderweight = currentAvgWeight > 0 && currentAvgWeight < standardWeight;

  // Handle opening modal (Image 1)
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

  // Filtered variants for Image 1 modal search
  const filteredModalVariants = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    const active = fabricVariants.filter((v) => v.isActive !== false);
    if (!q) return active.slice(0, 10);
    return active.filter((v) => {
      const name = fabricVariantName(v).toLowerCase();
      const dotName = name.split("-").join(" ");
      const sku = (v.sku ?? "").toLowerCase();
      return name.includes(q) || dotName.includes(q) || sku.includes(q);
    });
  }, [fabricVariants, modalSearch]);

  // Recently used pills for Image 1
  const recentlyUsedPills = useMemo(() => {
    const list: Array<{ label: string; variant: FabricVariant }> = [];
    fabricVariants.slice(0, 3).forEach((v) => {
      const label = fabricVariantName(v).split("-").join(" · ");
      list.push({ label, variant: v });
    });
    return list;
  }, [fabricVariants]);

  // Apply selected variant from modal
  function handleSelectModalVariant(variant: FabricVariant) {
    setSelectedVariantId(variant.fabricVariantId);
    const p = (variant as any).basePrice ?? (variant as any).currentPrice?.weaverRate ?? variant.fabric?.standardWeightG;
    if (p && !editReturn) {
      setUnitPrice(String(p));
    }
    setIsModalOpen(false);
  }

  // Handle "Use this fabric" from custom combination in modal
  async function handleApplyCustomModalFabric() {
    try {
      if (!modalFabricId || !modalWarpColorId || !modalWeftColorId || !modalDesignId) {
        setIsModalOpen(false);
        return;
      }
      // Check if existing variant matches
      const match = fabricVariants.find(
        (v) =>
          String(v.fabricId ?? v.fabric?.fabricId) === modalFabricId &&
          String(v.warpColorId ?? v.warpColor?.colorId) === modalWarpColorId &&
          String(v.weftColorId ?? v.weftColor?.colorId) === modalWeftColorId &&
          String(v.designId ?? v.design?.designId) === modalDesignId,
      );
      if (match) {
        handleSelectModalVariant(match);
        return;
      }
      // Create new variant
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

  // Handle Submit (Create or Update Fabric Return)
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
      const varId = selectedVariantId || order.fabricVariantId || orderVariant.fabricVariantId;
      if (!varId) {
        throw new Error("Please select a fabric variant.");
      }

      if (editingReturnId) {
        // Update existing return
        await fabricReturnsApi.update(editingReturnId, {
          quantityReturned: qty,
          totalWeight: weight,
          unitPrice: price,
          remark: remark || undefined,
        });
        onSaved("Fabric return updated.");
        handleCancelEdit();
      } else {
        // Record new fabric return
        await fabricReturnsApi.create({
          zigId,
          fabricVariantId: varId,
          quantityReturned: qty,
          totalWeight: weight,
          unitPrice: price,
          lengthCm: lengthCm ? Number(lengthCm) : undefined,
          widthCm: widthCm ? Number(widthCm) : undefined,
          remark: remark || undefined,
        });
        onSaved(`Fabric return recorded: ${selectedVariantDisplayName}`);

        // As specified in Image 2: "After saving, quantity and weight clear and the cursor returns to Quantity."
        setQuantity("");
        setTotalWeight("");
        setRemark("");
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

  // Cancel edit mode
  function handleCancelEdit() {
    setEditingReturnId(null);
    setQuantity("");
    setTotalWeight("");
    setRemark("");
    setSelectedVariantId(Number(order.fabricVariantId ?? orderVariant.fabricVariantId ?? 0));
    if (onCancel) onCancel();
    quantityInputRef.current?.focus();
  }

  // Start editing a specific return from the right card
  function handleStartEdit(ret: FabricReturnRow) {
    setEditingReturnId(ret.returnId);
    setQuantity(String(ret.quantityReturned));
    setTotalWeight(String(ret.totalWeight));
    setUnitPrice(String(ret.unitPrice));
    if (ret.lengthCm) setLengthCm(String(ret.lengthCm));
    if (ret.widthCm) setWidthCm(String(ret.widthCm));
    setRemark(ret.remark ?? "");
    const vId = Number(ret.fabricVariant?.fabricVariantId ?? ret.fabricVariantId);
    if (vId) setSelectedVariantId(vId);
    setError("");
    quantityInputRef.current?.focus();
  }

  // Delete return from right card
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

  // Enter key press in inputs to trigger submit
  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Group fabric returns for the Right Card (Image 2)
  // ─────────────────────────────────────────────────────────────
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
        subtotal: number;
        deductionPerPiece: number;
        totalDeduction: number;
        returns: FabricReturnRow[];
      }
    >();

    rawList.forEach((ret: any) => {
      const v = (ret.fabricVariant ?? orderVariant) as FabricVariant;
      const vId = Number(v?.fabricVariantId ?? ret.fabricVariantId ?? 0);
      const retQty = Number(ret.quantityReturned || 0);
      const retWeight = Number(ret.totalWeight || 0);
      const retPrice = Number(ret.unitPrice || 0);

      if (!map.has(vId)) {
        const label = v ? fabricVariantName(v).split("-").join(" · ") : "medebegna · biret · geberdin";
        const stdW = v?.fabric?.standardWeightG ?? 64;
        map.set(vId, {
          variantId: vId,
          variant: v,
          label,
          standardWeightG: stdW,
          totalQty: 0,
          totalWeight: 0,
          avgG: 0,
          subtotal: 0,
          deductionPerPiece: 0,
          totalDeduction: 0,
          returns: [],
        });
      }

      const group = map.get(vId)!;
      group.totalQty += retQty;
      group.totalWeight += retWeight;
      group.subtotal += retQty * retPrice;
      group.returns.push(ret);
    });

    // Compute merged averages and deductions for each group
    map.forEach((g) => {
      g.avgG = g.totalQty > 0 ? Math.round(g.totalWeight / g.totalQty) : 0;
      const deficit = Math.max(0, g.standardWeightG - Math.floor(g.avgG));
      const deductionRatePerUnit = 10; // 10 Birr per unit underweight
      g.deductionPerPiece = deficit * deductionRatePerUnit;
      g.totalDeduction = g.deductionPerPiece * g.totalQty;
    });

    return Array.from(map.values());
  }, [order.fabricReturns, orderVariant]);

  const grandTotal = useMemo(() => {
    return groupedReturns.reduce((acc, g) => acc + g.subtotal, 0);
  }, [groupedReturns]);

  return (
    <div style={{ width: "100%", margin: "0 0 1.5rem 0" }}>
      {/* 2-Column Responsive Layout matching Image 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: canRecord ? "repeat(auto-fit, minmax(360px, 1fr))" : "1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* ─────────────────────────────────────────────────────────────
            LEFT CARD: Record fabric return (Image 2)
           ───────────────────────────────────────────────────────────── */}
        {canRecord && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Card Title */}
            <h3
              style={{
                margin: "0 0 1.25rem 0",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {editingReturnId ? `Edit fabric return #${editingReturnId}` : "Record fabric return"}
            </h3>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  padding: "0.6rem 0.85rem",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                  color: "#b91c1c",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Fabric Variant Row (Image 2) */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.35rem",
                  }}
                >
                  Fabric
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      flex: 1,
                      background: "#fffdf5",
                      border: "1px solid #fed7aa",
                      borderRadius: "8px",
                      padding: "0.55rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#ea580c",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.92rem" }}>
                      {selectedVariantDisplayName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "0.55rem 1rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Numeric Inputs Row: Quantity, Total weight (g), Unit price (ETB) (Image 2) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                {/* Quantity */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Quantity
                  </label>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    min={1}
                    step={1}
                    placeholder="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Total weight (g) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Total weight (g)
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    placeholder="0"
                    required
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Unit price (ETB) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Unit price (ETB)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Quality Average & Minimum Standard Indicator (Image 2) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginTop: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                {currentAvgWeight > 0 && (
                  <span
                    style={{
                      background: isCurrentUnderweight ? "#fef3c7" : "#dcfce7",
                      color: isCurrentUnderweight ? "#92400e" : "#15803d",
                      borderRadius: "9999px",
                      padding: "0.3rem 0.75rem",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    {isCurrentUnderweight ? "⚠" : "✓"} Avg {currentAvgWeight.toFixed(1)} g per piece
                  </span>
                )}
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Minimum average {standardWeight} g
                </span>
              </div>

              {/* Collapsible Accordion: More details (Image 2) */}
              <div
                style={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "0.65rem 0.85rem",
                  marginTop: "1rem",
                }}
              >
                <div
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                    More details · {lengthCm || "64"} × {widthCm || "120"} cm ·{" "}
                    {remark ? remark : "no remark"}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {detailsOpen ? "⌃" : "⌵"}
                  </span>
                </div>
                {detailsOpen && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px dashed #e2e8f0",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Length (cm)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={lengthCm}
                        onChange={(e) => setLengthCm(e.target.value)}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "0.45rem 0.65rem",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Width (cm)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={widthCm}
                        onChange={(e) => setWidthCm(e.target.value)}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "0.45rem 0.65rem",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Remark / ማስታወሻ
                      </label>
                      <input
                        type="text"
                        value={remark}
                        placeholder="Optional"
                        onChange={(e) => setRemark(e.target.value)}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "0.45rem 0.65rem",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Settlement Deduction Callout Banner (Image 2) */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  padding: "0.65rem 0.85rem",
                  marginTop: "1rem",
                  fontSize: "0.8rem",
                  color: "#64748b",
                  lineHeight: 1.4,
                }}
              >
                The final deduction is calculated on the merged average at settlement.
              </div>

              {/* Footer Actions (Image 2) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.25rem",
                  gap: "1rem",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.78rem",
                    color: "#64748b",
                    lineHeight: 1.35,
                    maxWidth: 260,
                  }}
                >
                  After saving, quantity and weight clear and the cursor returns to Quantity.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {editingReturnId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving || !quantity || !totalWeight}
                    style={{
                      background:
                        saving || !quantity || !totalWeight
                          ? "#cbd5e1"
                          : "var(--brand, #c2410c)",
                      color: "#ffffff",
                      fontWeight: 700,
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.6rem 1.25rem",
                      fontSize: "0.92rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor:
                        saving || !quantity || !totalWeight
                          ? "not-allowed"
                          : "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <span>
                      {saving
                        ? "Saving…"
                        : editingReturnId
                        ? "Update return"
                        : "Save return"}
                    </span>
                    <span
                      style={{
                        background: "rgba(0, 0, 0, 0.22)",
                        color: "#ffedd5",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                      }}
                    >
                      Enter
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            RIGHT CARD: Fabric returned (Image 2)
           ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Card Title */}
          <h3
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Fabric returned
          </h3>

          {/* Table Column Headers (Image 2) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "0.5rem",
              marginBottom: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ flex: 1 }}>Fabric</span>
            <span style={{ width: 44, textAlign: "center" }}>Qty</span>
            <span style={{ width: 60, textAlign: "center" }}>Avg g</span>
            <span style={{ width: 85, textAlign: "right" }}>Subtotal</span>
          </div>

          {/* Empty state */}
          {groupedReturns.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                color: "#94a3b8",
              }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📭</div>
              <div style={{ fontWeight: 600, color: "#64748b" }}>
                No fabric returns recorded yet
              </div>
              <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                Use the form on the left to record the first piece.
              </div>
            </div>
          ) : (
            groupedReturns.map((group) => (
              <div key={group.variantId} style={{ marginBottom: "1.25rem" }}>
                {/* Group Summary Row (Image 2) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.35rem 0",
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: "0.95rem",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>⌵</span>
                    <span>{group.label}</span>
                  </div>
                  <span style={{ width: 44, textAlign: "center" }}>{group.totalQty}</span>
                  <span style={{ width: 60, textAlign: "center" }}>{group.avgG}</span>
                  <span style={{ width: 85, textAlign: "right" }}>
                    {group.subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Deduction pill if underweight (Image 2) */}
                {group.deductionPerPiece > 0 && (
                  <div style={{ margin: "0.25rem 0 0.5rem 1.35rem" }}>
                    <span
                      style={{
                        background: "#fef08a",
                        color: "#854d0e",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        display: "inline-block",
                      }}
                    >
                      Deduction -{group.deductionPerPiece} / piece = -
                      {group.totalDeduction.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Sub-rows: Individual Returns (Image 2) */}
                <div
                  style={{
                    background: "#fffdf5",
                    borderRadius: "8px",
                    border: "1px solid #fef3c7",
                    overflow: "hidden",
                    marginTop: "0.35rem",
                  }}
                >
                  {group.returns.map((ret, idx) => (
                    <div
                      key={ret.returnId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.55rem 0.85rem",
                        borderBottom:
                          idx < group.returns.length - 1 ? "1px solid #fef3c7" : "none",
                        fontSize: "0.85rem",
                        color: "#334155",
                      }}
                    >
                      <span style={{ flex: 1, fontWeight: 500 }}>
                        Return {idx + 1} · {Number(ret.totalWeight).toLocaleString()} g
                      </span>
                      <span style={{ width: 55, textAlign: "center", color: "#64748b" }}>
                        {ret.quantityReturned} pcs
                      </span>
                      <span style={{ width: 75, textAlign: "right", fontWeight: 600 }}>
                        {Number(ret.unitPrice).toLocaleString()}
                      </span>
                      {canRecord && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            marginLeft: "0.75rem",
                          }}
                        >
                          <button
                            type="button"
                            title="Edit this return"
                            onClick={() => handleStartEdit(ret)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#64748b",
                              padding: "0.2rem",
                              fontSize: "0.95rem",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            title="Delete this return"
                            onClick={() => handleDeleteReturn(ret.returnId)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#ef4444",
                              padding: "0.2rem",
                              fontSize: "0.85rem",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Card Total Footer (Image 2) */}
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              marginTop: "1.25rem",
              paddingTop: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            <span style={{ fontSize: "1rem" }}>Fabric total</span>
            <span style={{ fontSize: "1.05rem" }}>{grandTotal.toLocaleString()} ETB</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Record fabric return · Changing fabric (Image 1)
         ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 520,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Modal Header (Image 1) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Record fabric return
              </h3>
              <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>
                Changing fabric
              </span>
            </div>

            {/* Find existing fabric Search (Image 1) */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "0.4rem",
                }}
              >
                Find an existing fabric
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="biret geberdin"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.65rem 0.75rem 0.65rem 2.4rem",
                    borderRadius: "10px",
                    border: "2px solid #ea580c",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
              </div>

              {/* Matching Search Results List (Image 1) */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  overflow: "hidden",
                  marginTop: "0.6rem",
                  maxHeight: 180,
                  overflowY: "auto",
                }}
              >
                {filteredModalVariants.map((v) => {
                  const label = fabricVariantName(v).split("-").join(" · ");
                  const isCurrent = v.fabricVariantId === selectedVariantId;
                  return (
                    <div
                      key={v.fabricVariantId}
                      onClick={() => handleSelectModalVariant(v)}
                      style={{
                        padding: "0.65rem 0.85rem",
                        background: isCurrent ? "#fffdf0" : "#ffffff",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: isCurrent ? "#0f172a" : "#334155",
                        }}
                      >
                        {label}
                      </span>
                      {isCurrent && (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#166534",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                          }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recently used chips (Image 1) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.85rem",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b" }}>
                Recently used
              </span>
              {recentlyUsedPills.map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectModalVariant(pill.variant)}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "9999px",
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.8rem",
                    color: "#334155",
                    cursor: "pointer",
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Divider (Image 1: Not in the list? Describe it) */}
            <div
              style={{
                position: "relative",
                textAlign: "center",
                margin: "1.35rem 0",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "#e2e8f0",
                }}
              />
              <span
                style={{
                  position: "relative",
                  background: "#ffffff",
                  padding: "0 0.75rem",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Not in the list? Describe it
              </span>
            </div>

            {/* Custom 2-Column Selects (Image 1) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.85rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Fabric type
                </label>
                <select
                  value={modalFabricId}
                  onChange={(e) => setModalFabricId(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    background: "#ffffff",
                  }}
                >
                  {fabrics.map((f) => (
                    <option key={f.fabricId} value={f.fabricId}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Design
                </label>
                <select
                  value={modalDesignId}
                  onChange={(e) => setModalDesignId(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    background: "#ffffff",
                  }}
                >
                  {designs.map((d) => (
                    <option key={d.designId} value={d.designId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Warp color
                </label>
                <select
                  value={modalWarpColorId}
                  onChange={(e) => setModalWarpColorId(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    background: "#ffffff",
                  }}
                >
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "0.3rem",
                  }}
                >
                  Weft color
                </label>
                <select
                  value={modalWeftColorId}
                  onChange={(e) => setModalWeftColorId(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    background: "#ffffff",
                  }}
                >
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Helper text (Image 1) */}
            <p
              style={{
                margin: "0 0 1.5rem",
                fontSize: "0.78rem",
                color: "#64748b",
                lineHeight: 1.4,
              }}
            >
              If this combination does not exist yet, a new fabric type is created when you save.
            </p>

            {/* Modal Buttons (Image 1) */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomModalFabric}
                style={{
                  padding: "0.55rem 1.35rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--brand, #c2410c)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                Use this fabric
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FabricReturnForm;
