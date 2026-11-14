import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  catalogApi,
  merchantsApi,
  transactionsApi,
  weaversApi,
  type Weaver,
} from "../../../api";
import { txnTypeFromRoute } from "../../../utils/transactionTypes";

type TxnCategory =
  | "yarn_purchase"
  | "fabric_purchase_from_weaver"
  | "yarn_sale_to_weaver"
  | "fabric_sale_to_merchant";

interface LineItemDraft {
  id: string;
  variantId: string;
  quantity: string;
  unitPrice: string;
}

export function TransactionFormPage() {
  const { direction, goods } = useParams<{ direction?: string; goods?: string }>();
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

  // Counterparty selection
  const [supplierId, setSupplierId] = useState("");
  const [weaverUserId, setWeaverUserId] = useState("");
  const [merchantUserId, setMerchantUserId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  // Lines
  const [lines, setLines] = useState<LineItemDraft[]>([
    { id: "1", variantId: "", quantity: "10", unitPrice: "" },
  ]);

  // Catalogs & reference data
  const [suppliers, setSuppliers] = useState<Array<{ supplierId: number; name: string }>>([]);
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [merchants, setMerchants] = useState<
    Array<{ userId: number; companyName: string | null; contactPhone: string }>
  >([]);
  const [fabricVariants, setFabricVariants] = useState<any[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);

  // Quick Add Modal state
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");

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
        setWeavers(w || []);
        setMerchants(m || []);
        setFabricVariants(f || []);
        setYarnVariants(y || []);

        if (lookup.suppliers?.[0]) setSupplierId(String(lookup.suppliers[0].supplierId));
        if (w?.[0]) setWeaverUserId(String(w[0].userId));
        if (m?.[0]) {
          setMerchantUserId(String(m[0].userId));
        }

        // Initialize first item default variant
        if (f.length > 0) {
          const inStock = f.filter((v: any) => Number(v.stockSnapshot ?? 0) > 0);
          const pick = inStock[0] || f[0];
          setLines([
            {
              id: "1",
              variantId: String(pick.fabricVariantId),
              quantity: "10",
              unitPrice: pick.sellingPrice ? String(pick.sellingPrice) : String(pick.basePrice || "1380"),
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

  // When category changes, reset line selections if appropriate
  const isFabric = category === "fabric_sale_to_merchant" || category === "fabric_purchase_from_weaver";
  const isSale = category === "fabric_sale_to_merchant" || category === "yarn_sale_to_weaver";

  const handleCategoryChange = (newCat: TxnCategory) => {
    setCategory(newCat);
    const isNowFabric = newCat === "fabric_sale_to_merchant" || newCat === "fabric_purchase_from_weaver";
    if (isNowFabric && fabricVariants.length > 0) {
      const pick = fabricVariants[0];
      setLines([
        {
          id: "1",
          variantId: String(pick.fabricVariantId),
          quantity: "10",
          unitPrice: pick.sellingPrice ? String(pick.sellingPrice) : String(pick.basePrice || "1380"),
        },
      ]);
    } else if (!isNowFabric && yarnVariants.length > 0) {
      const pick = yarnVariants[0];
      setLines([
        {
          id: "1",
          variantId: String(pick.yarnVariantId),
          quantity: "10",
          unitPrice: pick.sellingPrice ? String(pick.sellingPrice) : String(pick.basePrice || "250"),
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
          unitPrice: pick ? (pick.sellingPrice ? String(pick.sellingPrice) : String(pick.basePrice || "1380")) : "",
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
          unitPrice: pick ? (pick.sellingPrice ? String(pick.sellingPrice) : String(pick.basePrice || "250")) : "",
        },
      ]);
    }
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLine = (id: string, field: keyof LineItemDraft, val: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: val };
        // Auto-fill price if variant changes
        if (field === "variantId") {
          if (isFabric) {
            const fv = fabricVariants.find((f) => String(f.fabricVariantId) === val);
            if (fv) {
              updated.unitPrice = fv.sellingPrice ? String(fv.sellingPrice) : String(fv.basePrice || "");
            }
          } else {
            const yv = yarnVariants.find((y) => String(y.yarnVariantId) === val);
            if (yv) {
              updated.unitPrice = yv.sellingPrice ? String(yv.sellingPrice) : String(yv.basePrice || "");
            }
          }
        }
        return updated;
      })
    );
  };

  // Calculations
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

  // Selected counterparty name
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
  }, [category, merchantUserId, supplierId, weaverUserId, merchants, suppliers, weavers]);

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

  // Quick Add Party handler
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
        // Mock add supplier if needed
        const newSupp = { supplierId: Date.now(), name: newPartyName.trim() };
        setSuppliers((prev) => [...prev, newSupp]);
        setSupplierId(String(newSupp.supplierId));
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

  // Submit
  const handleSaveTransaction = async () => {
    setSaving(true);
    setError("");

    try {
      // Validate lines
      const parsedLines = lines.map((l) => ({
        fabricVariantId: isFabric ? (l.variantId ? Number(l.variantId) : null) : null,
        yarnVariantId: !isFabric ? (l.variantId ? Number(l.variantId) : null) : null,
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

      const res = await transactionsApi.create({
        type: category,
        supplierId: category === "yarn_purchase" ? Number(supplierId) : undefined,
        weaverUserId:
          category === "fabric_purchase_from_weaver" || category === "yarn_sale_to_weaver"
            ? Number(weaverUserId)
            : undefined,
        merchantUserId:
          category === "fabric_sale_to_merchant" ? Number(merchantUserId) : undefined,
        notes: notes || undefined,
        lines: parsedLines,
      });

      navigate(`/admin/transactions/${res.transactionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to save transaction");
      setSaving(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem 3rem" }}>
      {/* Back Link */}
      <div style={{ marginBottom: "0.5rem" }}>
        <Link
          to="/admin/transactions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "#c2410c",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          <span>&lt;</span> Transactions
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
          ግብይት · NEW TRANSACTION
        </div>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          New transaction
        </h1>
      </div>

      {/* 4 Top Category Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {[
          {
            id: "yarn_purchase" as TxnCategory,
            title: "Buy yarn · ግዢ",
            sub: "From a supplier",
          },
          {
            id: "fabric_purchase_from_weaver" as TxnCategory,
            title: "Buy fabric · ግዢ",
            sub: "From a weaver",
          },
          {
            id: "yarn_sale_to_weaver" as TxnCategory,
            title: "Sell yarn · ሽያጭ",
            sub: "To a weaver",
          },
          {
            id: "fabric_sale_to_merchant" as TxnCategory,
            title: "Sell fabric · ሽያጭ",
            sub: "To a merchant",
          },
        ].map((c) => {
          const isSelected = category === c.id;
          return (
            <div
              key={c.id}
              onClick={() => handleCategoryChange(c.id)}
              style={{
                position: "relative",
                background: "#ffffff",
                border: isSelected ? "2px solid #c2410c" : "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "1.1rem 1.25rem",
                cursor: "pointer",
                boxShadow: isSelected ? "0 2px 8px rgba(194, 65, 12, 0.08)" : "0 1px 2px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a", marginBottom: "0.25rem" }}>
                {c.title}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {c.sub}
              </div>

              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "14px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* 2-Column Form Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Details, Items, Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Details Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem" }}>
              {/* Counterparty field */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                  {category === "fabric_sale_to_merchant"
                    ? "Merchant · ገዢ ነጋዴ"
                    : category === "yarn_purchase"
                    ? "Supplier · አቅራቢ"
                    : "Weaver · ሸማኔ"}
                </label>

                {category === "fabric_sale_to_merchant" ? (
                  <select
                    value={merchantUserId}
                    onChange={(e) => setMerchantUserId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    {merchants.map((m) => (
                      <option key={m.userId} value={String(m.userId)}>
                        {m.companyName || `Merchant #${m.userId}`} {m.contactPhone ? `(${m.contactPhone})` : ""}
                      </option>
                    ))}
                  </select>
                ) : category === "yarn_purchase" ? (
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={String(s.supplierId)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={weaverUserId}
                    onChange={(e) => setWeaverUserId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    {weavers.map((w) => (
                      <option key={w.userId} value={String(w.userId)}>
                        {w.fullName} {w.phone ? `(${w.phone})` : ""}
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ marginTop: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddPartyModal(true)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#c2410c",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add a new{" "}
                    {category === "fabric_sale_to_merchant"
                      ? "merchant"
                      : category === "yarn_purchase"
                      ? "supplier"
                      : "weaver"}
                  </button>
                </div>
              </div>

              {/* Date field */}
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Items
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {lines.map((l, index) => {
                const selectedVariant = isFabric
                  ? fabricVariants.find((f) => String(f.fabricVariantId) === l.variantId)
                  : yarnVariants.find((y) => String(y.yarnVariantId) === l.variantId);

                const currentStock = Number((selectedVariant as any)?.stockSnapshot ?? selectedVariant?.currentStock ?? 0);
                const requestedQty = parseFloat(l.quantity) || 0;
                const unitPriceNum = parseFloat(l.unitPrice) || 0;
                const lineTotal = requestedQty * unitPriceNum;
                const afterStock = isSale ? currentStock - requestedQty : currentStock + requestedQty;

                return (
                  <div key={l.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.8fr 0.7fr 1fr 0.8fr 36px",
                        gap: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      {/* Variant Select */}
                      <div>
                        {index === 0 && (
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem" }}>
                            {isFabric ? "Fabric" : "Yarn"}
                          </label>
                        )}
                        <select
                          value={l.variantId}
                          onChange={(e) => handleUpdateLine(l.id, "variantId", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.65rem",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13.5px",
                            background: "#fffdf5",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value="">Select {isFabric ? "fabric" : "yarn"}…</option>
                          {isFabric
                            ? fabricVariants.map((f) => {
                                const name = f.fabric?.name || f.product?.name || "medebegna";
                                const warp = f.warpColor?.name || f.color?.name || "";
                                const weft = f.weftColor?.name || "";
                                const design = f.design?.name || "";
                                const label = [name, warp, weft, design].filter(Boolean).join(" · ");
                                return (
                                  <option key={f.fabricVariantId} value={String(f.fabricVariantId)}>
                                    {label || f.sku}
                                  </option>
                                );
                              })
                            : yarnVariants.map((y) => {
                                const label = [y.yarn?.name, y.color?.name, y.sku].filter(Boolean).join(" · ");
                                return (
                                  <option key={y.yarnVariantId} value={String(y.yarnVariantId)}>
                                    {label}
                                  </option>
                                );
                              })}
                        </select>
                      </div>

                      {/* Qty */}
                      <div>
                        {index === 0 && (
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem" }}>
                            Qty
                          </label>
                        )}
                        <input
                          type="number"
                          min="1"
                          value={l.quantity}
                          onChange={(e) => handleUpdateLine(l.id, "quantity", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.5rem",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13.5px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        {index === 0 && (
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem" }}>
                            Unit price
                          </label>
                        )}
                        <input
                          type="number"
                          step="any"
                          value={l.unitPrice}
                          onChange={(e) => handleUpdateLine(l.id, "unitPrice", e.target.value)}
                          placeholder="Price"
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.5rem",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13.5px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* Total */}
                      <div>
                        {index === 0 && (
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem" }}>
                            Total
                          </label>
                        )}
                        <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a", paddingTop: index === 0 ? "0.25rem" : "0" }}>
                          [{lineTotal > 0 ? lineTotal.toLocaleString() : "0"}]
                        </div>
                      </div>

                      {/* Delete */}
                      <div style={{ textAlign: "center", paddingTop: index === 0 ? "1.25rem" : "0" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(l.id)}
                          disabled={lines.length <= 1}
                          style={{
                            background: "none",
                            border: "none",
                            color: lines.length <= 1 ? "#cbd5e1" : "#94a3b8",
                            cursor: lines.length <= 1 ? "not-allowed" : "pointer",
                            fontSize: "16px",
                            padding: "0.25rem",
                          }}
                          title="Delete item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Stock Indicator Badge */}
                    {selectedVariant && (
                      <div style={{ marginTop: "0.5rem" }}>
                        {isSale && afterStock < 0 ? (
                          <span
                            style={{
                              background: "#fee2e2",
                              color: "#991b1b",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "0.2rem 0.6rem",
                              borderRadius: "999px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            ⚠️ Only [{currentStock}] in stock (shortage of [{requestedQty - currentStock}])
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#ecfdf5",
                              color: "#065f46",
                              fontSize: "12px",
                              fontWeight: 600,
                              padding: "0.2rem 0.6rem",
                              borderRadius: "999px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            ✓ [{currentStock}] in stock → [{afterStock}] after
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* + Add item Button */}
              <button
                type="button"
                onClick={handleAddLine}
                style={{
                  background: "#ffffff",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "0.65rem",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                  width: "100%",
                  transition: "border-color 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = "#c2410c")}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
              >
                + Add item
              </button>
            </div>
          </div>

          {/* Add a note (optional) Collapsible */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setNotesOpen(!notesOpen)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              <span>Add a note (optional)</span>
              <span style={{ fontSize: "12px", transform: notesOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                ▼
              </span>
            </button>

            {notesOpen && (
              <div style={{ padding: "0 1.25rem 1.25rem" }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional delivery instructions, payment terms, or reference notes…"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary Card */}
        <div
          style={{
            position: "sticky",
            top: "1.5rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
            Summary
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "14px", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Type</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>{categoryLabel}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>
                {category === "fabric_sale_to_merchant"
                  ? "Merchant"
                  : category === "yarn_purchase"
                  ? "Supplier"
                  : "Weaver"}
              </span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>[{counterpartySummaryName}]</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Items</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                {lines.length} · {totalQuantity} pcs
              </span>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", margin: "0.5rem 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: "20px", color: "#c2410c" }}>
                [{calculatedGrandTotal.toLocaleString()}] ETB
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              type="button"
              onClick={handleSaveTransaction}
              disabled={saving}
              style={{
                background: "#c2410c",
                color: "#ffffff",
                border: "none",
                padding: "0.75rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(194, 65, 12, 0.2)",
                transition: "background 0.15s ease",
              }}
              onMouseOver={(e) => {
                if (!saving) e.currentTarget.style.background = "#9a3412";
              }}
              onMouseOut={(e) => {
                if (!saving) e.currentTarget.style.background = "#c2410c";
              }}
            >
              {saving ? "Saving…" : "Save transaction"}
            </button>

            <Link
              to="/admin/transactions"
              style={{
                background: "#ffffff",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "0.65rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                textAlign: "center",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              Cancel
            </Link>
          </div>

          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "1rem", lineHeight: 1.4 }}>
            You can record payments after saving, in full or in parts.
          </div>
        </div>
      </div>

      {/* Quick Add Party Modal */}
      {showAddPartyModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setShowAddPartyModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
              Add New{" "}
              {category === "fabric_sale_to_merchant"
                ? "Merchant"
                : category === "yarn_purchase"
                ? "Supplier"
                : "Weaver"}
            </h3>

            <form onSubmit={handleQuickAddParty} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                  Name / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  placeholder="e.g. Merkato Textile Trader"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPartyPhone}
                  onChange={(e) => setNewPartyPhone(e.target.value)}
                  placeholder="e.g. 0911234567"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    padding: "0.55rem 1rem",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#c2410c",
                    border: "none",
                    padding: "0.55rem 1rem",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionFormPage;
