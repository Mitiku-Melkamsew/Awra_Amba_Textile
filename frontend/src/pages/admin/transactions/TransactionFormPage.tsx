import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  matchesAllWords,
  searchHaystack,
  searchWords,
} from "../../../utils/searchMatch";
import { SearchableSelect, Modal } from "../../../components/common";

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

interface SearchableVariantSelectProps {
  isFabric: boolean;
  canAddNew: boolean;
  isSale: boolean;
  selectedVariantId: string;
  fabricVariants: any[];
  yarnVariants: any[];
  onSelect: (variantId: string) => void;
  onAddNew: (query?: string) => void;
}

/**
 * Searchable variant input field.
 * Behaves like the search input on the Weavers page: an input by default where the user can
 * immediately type words to filter and select a variant, with no modal card / "Change" button barriers.
 */
function SearchableVariantSelect({
  isFabric,
  canAddNew,
  isSale,
  selectedVariantId,
  fabricVariants,
  yarnVariants,
  onSelect,
  onAddNew,
}: SearchableVariantSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return isFabric
      ? fabricVariants.find(
          (f) => String(f.fabricVariantId) === selectedVariantId,
        )
      : yarnVariants.find((y) => String(y.yarnVariantId) === selectedVariantId);
  }, [isFabric, selectedVariantId, fabricVariants, yarnVariants]);

  const selectedLabel = useMemo(() => {
    if (!selectedVariant) return "";
    if (isFabric) {
      const name = selectedVariant.fabric?.name || "Fabric";
      const warp =
        selectedVariant.warpColor?.name || selectedVariant.color?.name || "";
      const weft = selectedVariant.weftColor?.name || "";
      const colors = [warp, weft].filter(Boolean).join(" / ");
      const design = selectedVariant.design?.name || "";
      const sub = [colors, design].filter(Boolean).join(" · ");
      const sku = selectedVariant.sku ? ` (${selectedVariant.sku})` : "";
      return sub ? `${name} · ${sub}${sku}` : `${name}${sku}`;
    } else {
      const name = selectedVariant.yarn?.name || "Yarn";
      const color = selectedVariant.color?.name || "";
      const supplier = selectedVariant.supplier?.name
        ? `(${selectedVariant.supplier.name})`
        : "";
      const sub = [color, supplier].filter(Boolean).join(" · ");
      const sku = selectedVariant.sku ? ` [${selectedVariant.sku}]` : "";
      return sub ? `${name} · ${sub}${sku}` : `${name}${sku}`;
    }
  }, [selectedVariant, isFabric]);

  const [query, setQuery] = useState(selectedLabel);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Sync display text when selected variant changes
  useEffect(() => {
    if (!isTyping) {
      setQuery(selectedLabel);
    }
  }, [selectedLabel, isTyping]);

  const variantList = isFabric ? fabricVariants : yarnVariants;

  const indexed = useMemo(() => {
    return variantList.map((v) => {
      let title = "";
      let subtitle = "";
      const sku = v.sku || "";
      if (isFabric) {
        title = v.fabric?.name || "Fabric";
        const warp = v.warpColor?.name || v.color?.name || "";
        const weft = v.weftColor?.name || "";
        const colors = [warp, weft].filter(Boolean).join(" / ");
        const design = v.design?.name || "";
        subtitle = [colors, design].filter(Boolean).join(" · ");
      } else {
        title = v.yarn?.name || "Yarn";
        const color = v.color?.name || "";
        const supplier = v.supplier?.name ? `(${v.supplier.name})` : "";
        subtitle = [color, supplier].filter(Boolean).join(" · ");
      }
      const haystack = searchHaystack(`${title} ${subtitle} ${sku}`);
      const stock = Number((v as any).stockSnapshot ?? v.currentStock ?? 0);
      const price = isSale
        ? (v.sellingPrice ?? v.basePrice ?? 0)
        : isFabric
          ? (v.fabric?.weaverRate ?? v.basePrice ?? 0)
          : (v.yarn?.purchasePrice ?? v.basePrice ?? 0);

      return {
        variant: v,
        id: String(isFabric ? v.fabricVariantId : v.yarnVariantId),
        title,
        subtitle,
        sku,
        haystack,
        stock,
        price,
      };
    });
  }, [variantList, isFabric, isSale]);

  const words = useMemo(() => {
    if (!isTyping || query === selectedLabel) return [];
    return searchWords(query);
  }, [query, isTyping, selectedLabel]);

  const filteredResults = useMemo(() => {
    if (words.length === 0) {
      if (isSale) {
        const inStock = indexed.filter((x) => x.stock > 0);
        const outOfStock = indexed.filter((x) => x.stock <= 0);
        return [...inStock, ...outOfStock].slice(0, 15);
      }
      return indexed.slice(0, 15);
    }
    return indexed
      .filter((x) => matchesAllWords(x.haystack, words))
      .slice(0, 15);
  }, [indexed, words, isSale]);

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setIsTyping(false);
        setQuery(selectedLabel);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [selectedLabel]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <span
          style={{
            position: "absolute",
            left: "10px",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <svg
            width="15"
            height="15"
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
          ref={inputRef}
          type="text"
          value={query}
          placeholder={
            isFabric
              ? "Search fabric variant (e.g. gabi, white)..."
              : "Search yarn variant (e.g. cotton, blue)..."
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setIsTyping(true);
            setDropdownOpen(true);
          }}
          onFocus={(e) => {
            setDropdownOpen(true);
            e.target.select();
          }}
          style={{
            width: "100%",
            padding: "0.55rem 1.8rem 0.55rem 2.1rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "13.5px",
            background: "#ffffff",
            boxSizing: "border-box",
            textOverflow: "ellipsis",
          }}
        />
        {(query || selectedVariantId) && (
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setQuery("");
              setIsTyping(true);
              setDropdownOpen(true);
              inputRef.current?.focus();
            }}
            title="Clear"
            style={{
              position: "absolute",
              right: "6px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "13px",
              padding: "2px 4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {dropdownOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: "4px",
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {filteredResults.length === 0 ? (
            <div style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
              <div
                style={{
                  fontSize: "12.5px",
                  color: "#64748b",
                  marginBottom: canAddNew ? "0.6rem" : "0",
                }}
              >
                No {isFabric ? "fabric" : "yarn"} matching &quot;{query}&quot;
              </div>
              {canAddNew && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    onAddNew(query);
                  }}
                  style={{
                    background: "#c2410c",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add new {isFabric ? "fabric" : "yarn"}{" "}
                  {query ? `"${query}"` : ""}
                </button>
              )}
            </div>
          ) : (
            filteredResults.map((entry) => (
              <div
                key={entry.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(entry.id);
                  setQuery(
                    entry.title + (entry.subtitle ? ` · ${entry.subtitle}` : ""),
                  );
                  setIsTyping(false);
                  setDropdownOpen(false);
                }}
                style={{
                  padding: "0.6rem 0.75rem",
                  cursor: "pointer",
                  borderBottom: "1px solid #f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    entry.id === selectedVariantId ? "#fff7ed" : "#ffffff",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fff7ed")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    entry.id === selectedVariantId ? "#fff7ed" : "#ffffff")
                }
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "#0f172a",
                    }}
                  >
                    {entry.title}
                  </div>
                  {entry.subtitle && (
                    <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                      {entry.subtitle}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  {entry.stock > 0 ? (
                    <span
                      style={{
                        fontSize: "11.5px",
                        color: "#16a34a",
                        fontWeight: 600,
                      }}
                    >
                      {entry.stock} in stock
                    </span>
                  ) : (
                    <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                      0 in stock
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function TransactionFormPage() {
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
    new Date().toISOString().slice(0, 10),
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

  const merchantOptions = useMemo(() => {
    return merchants.map((m) => ({
      id: String(m.userId),
      title: m.companyName || `Merchant #${m.userId}`,
      subtitle: m.contactPhone ? `Phone: ${m.contactPhone}` : undefined,
    }));
  }, [merchants]);

  const weaverOptions = useMemo(() => {
    return weavers.map((w) => ({
      id: String(w.userId),
      title: w.fullName,
      subtitle: w.phone ? `Phone: ${w.phone}` : undefined,
    }));
  }, [weavers]);

  const fabricOptions = useMemo(() => {
    return fabrics.map((f) => ({
      id: String(f.fabricId),
      title: f.name,
      subtitle: `${f.standardWeightG || f.standardWeight || 0}g standard`,
    }));
  }, [fabrics]);

  const colorOptions = useMemo(() => {
    return colors.map((c) => ({
      id: String(c.colorId),
      title: c.name,
      badge: c.hexCode || undefined,
    }));
  }, [colors]);

  const designOptions = useMemo(() => {
    return designs.map((d) => ({
      id: String(d.designId),
      title: d.name,
    }));
  }, [designs]);

  const yarnOptions = useMemo(() => {
    return yarns.map((y) => ({
      id: String(y.yarnId),
      title: y.name,
      subtitle: [y.material, y.type].filter(Boolean).join(" · "),
    }));
  }, [yarns]);

  const supplierOptions = useMemo(() => {
    return suppliers.map((s) => ({
      id: String(s.supplierId),
      title: s.name,
      subtitle: (s as any).contactPhone ? `Phone: ${(s as any).contactPhone}` : undefined,
    }));
  }, [suppliers]);

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
            (v: any) => Number(v.stockSnapshot ?? 0) > 0,
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

  // When category changes, reset line selections if appropriate
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
    val: string,
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: val };
        // Auto-fill price if variant changes
        if (field === "variantId") {
          if (isFabric) {
            const fv = fabricVariants.find(
              (f) => String(f.fabricVariantId) === val,
            );
            if (fv) {
              updated.unitPrice = fv.sellingPrice
                ? String(fv.sellingPrice)
                : String(fv.basePrice || "");
            }
          } else {
            const yv = yarnVariants.find(
              (y) => String(y.yarnVariantId) === val,
            );
            if (yv) {
              updated.unitPrice = yv.sellingPrice
                ? String(yv.sellingPrice)
                : String(yv.basePrice || "");
            }
          }
        }
        return updated;
      }),
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

  // Inline Quick Creators
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

  // Submit Variant
  const handleSaveNewVariant = async (e: FormEvent) => {
    e.preventDefault();
    setSavingVariant(true);
    setVariantModalError("");
    try {
      if (isFabric) {
        if (!newFvFabricId || !newFvWarpColorId || !newFvWeftColorId) {
          throw new Error(
            "Please select fabric and both warp and weft colors.",
          );
        }
        const effectiveDesignId = Number(
          newFvDesignId || designs[0]?.designId || 1,
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
            String(created.fabricVariantId),
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
            String(created.yarnVariantId),
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

  // Submit Transaction
  const handleSaveTransaction = async () => {
    setSaving(true);
    setError("");

    try {
      // Validate lines
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

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "1.5rem 2rem 3rem",
      }}
    >
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
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          ግብይት · NEW TRANSACTION
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          New transaction
        </h1>
      </div>

      {/* 4 Top Category Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
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
                boxShadow: isSelected
                  ? "0 2px 8px rgba(194, 65, 12, 0.08)"
                  : "0 1px 2px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "15px",
                  color: "#0f172a",
                  marginBottom: "0.25rem",
                }}
              >
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
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
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
        {/* Left Column: Counterparty (if needed), Items, Date & Notes */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Counterparty bar (Only for Weaver / Merchant transactions; Buy yarn selects supplier per variant) */}
          {category !== "yarn_purchase" && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                padding: "1rem 1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#475569",
                  }}
                >
                  {category === "fabric_sale_to_merchant"
                    ? "Merchant · ገዢ ነጋዴ"
                    : "Weaver · ሸማኔ"}
                </label>
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
                    : "weaver"}
                </button>
              </div>

              {category === "fabric_sale_to_merchant" ? (
                <SearchableSelect
                  value={merchantUserId}
                  onChange={(val) => setMerchantUserId(val)}
                  options={merchantOptions}
                  placeholder="Search merchant by name or phone…"
                  onAddNew={(q) => {
                    setNewPartyName(q);
                    setShowAddPartyModal(true);
                  }}
                  addNewLabel="Add merchant"
                  required
                />
              ) : (
                <SearchableSelect
                  value={weaverUserId}
                  onChange={(val) => setWeaverUserId(val)}
                  options={weaverOptions}
                  placeholder="Search weaver by name or phone…"
                  onAddNew={(q) => {
                    setNewPartyName(q);
                    setShowAddPartyModal(true);
                  }}
                  addNewLabel="Add weaver"
                  required
                />
              )}
            </div>
          )}

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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Items
              </h3>
              {(category === "yarn_purchase" ||
                category === "fabric_purchase_from_weaver") && (
                <button
                  type="button"
                  onClick={() => handleOpenAddVariantModal()}
                  style={{
                    background: "#c2410c",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(194, 65, 12, 0.2)",
                  }}
                >
                  + Add new {isFabric ? "fabric" : "yarn"}
                </button>
              )}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {lines.map((l, index) => {
                const selectedVariant = isFabric
                  ? fabricVariants.find(
                      (f) => String(f.fabricVariantId) === l.variantId,
                    )
                  : yarnVariants.find(
                      (y) => String(y.yarnVariantId) === l.variantId,
                    );

                const currentStock = Number(
                  (selectedVariant as any)?.stockSnapshot ??
                    selectedVariant?.currentStock ??
                    0,
                );
                const requestedQty = parseFloat(l.quantity) || 0;
                const unitPriceNum = parseFloat(l.unitPrice) || 0;
                const lineTotal = requestedQty * unitPriceNum;
                const afterStock = isSale
                  ? currentStock - requestedQty
                  : currentStock + requestedQty;

                return (
                  <div
                    key={l.id}
                    style={{
                      paddingBottom: "1rem",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.9fr 0.65fr 1fr 0.8fr 36px",
                        gap: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      {/* Variant Searchable Input */}
                      <div>
                        {index === 0 && (
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#64748b",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {isFabric ? "Fabric variant" : "Yarn variant"}
                          </label>
                        )}
                        <SearchableVariantSelect
                          isFabric={isFabric}
                          canAddNew={
                            category === "yarn_purchase" ||
                            category === "fabric_purchase_from_weaver"
                          }
                          isSale={isSale}
                          selectedVariantId={l.variantId}
                          fabricVariants={fabricVariants}
                          yarnVariants={yarnVariants}
                          onSelect={(id) =>
                            handleUpdateLine(l.id, "variantId", id)
                          }
                          onAddNew={(q) =>
                            handleOpenAddVariantModal(l.id, q)
                          }
                        />
                      </div>

                      {/* Qty */}
                      <div>
                        {index === 0 && (
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#64748b",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Qty
                          </label>
                        )}
                        <input
                          type="number"
                          min="1"
                          value={l.quantity}
                          onChange={(e) =>
                            handleUpdateLine(l.id, "quantity", e.target.value)
                          }
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
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#64748b",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Unit price
                          </label>
                        )}
                        <input
                          type="number"
                          step="any"
                          value={l.unitPrice}
                          onChange={(e) =>
                            handleUpdateLine(l.id, "unitPrice", e.target.value)
                          }
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
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#64748b",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Total
                          </label>
                        )}
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#0f172a",
                            paddingTop: index === 0 ? "0.25rem" : "0",
                          }}
                        >
                          [{lineTotal > 0 ? lineTotal.toLocaleString() : "0"}]
                        </div>
                      </div>

                      {/* Delete */}
                      <div
                        style={{
                          textAlign: "center",
                          paddingTop: index === 0 ? "1.25rem" : "0",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(l.id)}
                          disabled={lines.length <= 1}
                          style={{
                            background: "none",
                            border: "none",
                            color: lines.length <= 1 ? "#cbd5e1" : "#94a3b8",
                            cursor:
                              lines.length <= 1 ? "not-allowed" : "pointer",
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
                            ⚠️ Only [{currentStock}] in stock (shortage of [
                            {requestedQty - currentStock}])
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
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginTop: "0.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleAddLine}
                  style={{
                    flex: 1,
                    background: "#ffffff",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "8px",
                    padding: "0.65rem",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.borderColor = "#c2410c")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.borderColor = "#cbd5e1")
                  }
                >
                  + Add item
                </button>
              </div>
            </div>
          </div>

          {/* Merged Bottom Card: Date & Notes */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr",
                gap: "1.25rem",
                alignItems: "start",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "0.35rem",
                  }}
                >
                  Transaction date · ቀን
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

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "0.35rem",
                  }}
                >
                  Notes (optional) · ማስታወሻ
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional delivery instructions, payment terms, or reference notes…"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
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
          <h3
            style={{
              margin: "0 0 1.25rem",
              fontSize: "18px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Summary
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              fontSize: "14px",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Type</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                {categoryLabel}
              </span>
            </div>

            {category !== "yarn_purchase" && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>
                  {category === "fabric_sale_to_merchant"
                    ? "Merchant"
                    : "Weaver"}
                </span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                  [{counterpartySummaryName}]
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Date</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>{date}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Items</span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                {lines.length} · {totalQuantity} pcs
              </span>
            </div>

            <div
              style={{ borderTop: "1px solid #e2e8f0", margin: "0.5rem 0" }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "16px",
                  color: "#0f172a",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "20px",
                  color: "#c2410c",
                }}
              >
                [{calculatedGrandTotal.toLocaleString()}] ETB
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
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
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "#ffffff")
              }
            >
              Cancel
            </Link>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "1rem",
              lineHeight: 1.4,
            }}
          >
            You can record payments after saving, in full or in parts.
          </div>
        </div>
      </div>

      {/* Add Party Modal */}
      <Modal
        isOpen={showAddPartyModal}
        onClose={() => setShowAddPartyModal(false)}
        title={`Add New ${
          category === "fabric_sale_to_merchant"
            ? "Merchant"
            : category === "yarn_purchase"
              ? "Supplier"
              : "Weaver"
        }`}
        subtitle={`Enter details to create and select this new ${
          category === "fabric_sale_to_merchant"
            ? "merchant"
            : category === "yarn_purchase"
              ? "supplier"
              : "weaver"
        }.`}
        maxWidth={440}
      >
        <form
          onSubmit={handleQuickAddParty}
          style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#475569",
                marginBottom: "0.25rem",
              }}
            >
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
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#475569",
                marginBottom: "0.25rem",
              }}
            >
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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
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
      </Modal>

      {/* Add Variant Modal (Supporting Inline Quick Creation of Fabric, Colors, Design, Yarn, Supplier) */}
      <Modal
        isOpen={showAddVariantModal}
        onClose={() => setShowAddVariantModal(false)}
        maxWidth={540}
        title={`Add new ${isFabric ? "fabric" : "yarn"} variant · አዲስ ${isFabric ? "ጨርቅ" : "ክር"} ዓይነት`}
        subtitle={
          isFabric
            ? "Specify the fabric structure, design pattern, and warp/weft colors."
            : "Specify yarn material, color, and supplier."
        }
      >

            {variantModalError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "13px",
                }}
              >
                ⚠️ {variantModalError}
              </div>
            )}

            <form
              onSubmit={handleSaveNewVariant}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {isFabric ? (
                <>
                  {/* Fabric Selection + Inline Add */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      >
                        Fabric · ጨርቅ
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowNewFabricForm(!showNewFabricForm)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c2410c",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {showNewFabricForm ? "− Cancel" : "+ New fabric"}
                      </button>
                    </div>

                    {showNewFabricForm && (
                      <div
                        style={{
                          background: "#fff7ed",
                          border: "1px solid #ffedd5",
                          borderRadius: "8px",
                          padding: "0.75rem",
                          marginBottom: "0.6rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#9a3412",
                            marginBottom: "0.4rem",
                          }}
                        >
                          Create new base fabric
                        </div>
                        <input
                          type="text"
                          placeholder="Fabric name (e.g. Shemma / ሸማ)"
                          value={inlineFabricName}
                          onChange={(e) => setInlineFabricName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            border: "1px solid #fed7aa",
                            fontSize: "13px",
                            boxSizing: "border-box",
                            marginBottom: "0.5rem",
                          }}
                        />
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "0.4rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <input
                            type="number"
                            placeholder="Weight (g)"
                            value={inlineFabricWeight}
                            onChange={(e) =>
                              setInlineFabricWeight(e.target.value)
                            }
                            style={{
                              padding: "0.45rem",
                              borderRadius: "6px",
                              border: "1px solid #fed7aa",
                              fontSize: "12.5px",
                              boxSizing: "border-box",
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Length (cm)"
                            value={inlineFabricLength}
                            onChange={(e) =>
                              setInlineFabricLength(e.target.value)
                            }
                            style={{
                              padding: "0.45rem",
                              borderRadius: "6px",
                              border: "1px solid #fed7aa",
                              fontSize: "12.5px",
                              boxSizing: "border-box",
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Width (cm)"
                            value={inlineFabricWidth}
                            onChange={(e) =>
                              setInlineFabricWidth(e.target.value)
                            }
                            style={{
                              padding: "0.45rem",
                              borderRadius: "6px",
                              border: "1px solid #fed7aa",
                              fontSize: "12.5px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleCreateInlineFabric}
                          style={{
                            background: "#c2410c",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.4rem 0.8rem",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Add & Select Fabric
                        </button>
                      </div>
                    )}

                    <SearchableSelect
                      value={newFvFabricId}
                      onChange={(val) => setNewFvFabricId(val)}
                      options={fabricOptions}
                      placeholder="Search fabric (e.g. Gabi)…"
                      onAddNew={() => setShowNewFabricForm(true)}
                      addNewLabel="New fabric"
                      required
                    />
                  </div>

                  {/* Colors: Warp and Weft with inline add */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Warp color · የድረ
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowNewWarpColorForm(!showNewWarpColorForm)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c2410c",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {showNewWarpColorForm ? "−" : "+ New"}
                        </button>
                      </div>

                      {showNewWarpColorForm && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.3rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Color name"
                            value={inlineWarpColorName}
                            onChange={(e) =>
                              setInlineWarpColorName(e.target.value)
                            }
                            style={{
                              flex: 1,
                              padding: "0.4rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleCreateInlineWarpColor}
                            style={{
                              background: "#c2410c",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.4rem 0.6rem",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Add
                          </button>
                        </div>
                      )}

                      <SearchableSelect
                        value={newFvWarpColorId}
                        onChange={(val) => setNewFvWarpColorId(val)}
                        options={colorOptions}
                        placeholder="Search warp color…"
                        onAddNew={() => setShowNewWarpColorForm(true)}
                        addNewLabel="New color"
                        required
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Weft color · የማግ
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowNewWeftColorForm(!showNewWeftColorForm)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c2410c",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {showNewWeftColorForm ? "−" : "+ New"}
                        </button>
                      </div>

                      {showNewWeftColorForm && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.3rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Color name"
                            value={inlineWeftColorName}
                            onChange={(e) =>
                              setInlineWeftColorName(e.target.value)
                            }
                            style={{
                              flex: 1,
                              padding: "0.4rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleCreateInlineWeftColor}
                            style={{
                              background: "#c2410c",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.4rem 0.6rem",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Add
                          </button>
                        </div>
                      )}

                      <SearchableSelect
                        value={newFvWeftColorId}
                        onChange={(val) => setNewFvWeftColorId(val)}
                        options={colorOptions}
                        placeholder="Search weft color…"
                        onAddNew={() => setShowNewWeftColorForm(true)}
                        addNewLabel="New color"
                        required
                      />
                    </div>
                  </div>

                  {/* Design & SKU */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Design · ጥበብ
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowNewDesignForm(!showNewDesignForm)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c2410c",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {showNewDesignForm ? "−" : "+ New"}
                        </button>
                      </div>

                      {showNewDesignForm && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.3rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Design name"
                            value={inlineDesignName}
                            onChange={(e) =>
                              setInlineDesignName(e.target.value)
                            }
                            style={{
                              flex: 1,
                              padding: "0.4rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleCreateInlineDesign}
                            style={{
                              background: "#c2410c",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.4rem 0.6rem",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Add
                          </button>
                        </div>
                      )}

                      <SearchableSelect
                        value={newFvDesignId}
                        onChange={(val) => setNewFvDesignId(val)}
                        options={designOptions}
                        placeholder="Search design (e.g. Tibeb)…"
                        onAddNew={() => setShowNewDesignForm(true)}
                        addNewLabel="New design"
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#475569",
                          marginBottom: "0.3rem",
                        }}
                      >
                        SKU (optional)
                      </label>
                      <input
                        type="text"
                        value={newFvSku}
                        onChange={(e) => setNewFvSku(e.target.value)}
                        placeholder="e.g. GAB-WHT-01"
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Yarn Material + Inline Add */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      >
                        Yarn · ክር
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewYarnForm(!showNewYarnForm)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c2410c",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {showNewYarnForm ? "− Cancel" : "+ New yarn material"}
                      </button>
                    </div>

                    {showNewYarnForm && (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Yarn material name (e.g. Cotton / ጥጥ)"
                          value={inlineYarnName}
                          onChange={(e) => setInlineYarnName(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "0.45rem 0.6rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleCreateInlineYarn}
                          style={{
                            background: "#c2410c",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.45rem 0.8rem",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <SearchableSelect
                      value={newYvYarnId}
                      onChange={(val) => setNewYvYarnId(val)}
                      options={yarnOptions}
                      placeholder="Search yarn material…"
                      onAddNew={() => setShowNewYarnForm(true)}
                      addNewLabel="New yarn"
                      required
                    />
                  </div>

                  {/* Yarn Color & Supplier with Inline Add */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Color · ቀለም
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowNewYarnColorForm(!showNewYarnColorForm)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c2410c",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {showNewYarnColorForm ? "−" : "+ New"}
                        </button>
                      </div>

                      {showNewYarnColorForm && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.3rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Color name"
                            value={inlineYarnColorName}
                            onChange={(e) =>
                              setInlineYarnColorName(e.target.value)
                            }
                            style={{
                              flex: 1,
                              padding: "0.4rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleCreateInlineYarnColor}
                            style={{
                              background: "#c2410c",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "0.4rem 0.6rem",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Add
                          </button>
                        </div>
                      )}

                      <SearchableSelect
                        value={newYvColorId}
                        onChange={(val) => setNewYvColorId(val)}
                        options={colorOptions}
                        placeholder="Search color…"
                        onAddNew={() => setShowNewYarnColorForm(true)}
                        addNewLabel="New color"
                        required
                      />
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Supplier · አቅራቢ
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowNewSupplierForm(!showNewSupplierForm)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#c2410c",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {showNewSupplierForm ? "−" : "+ New"}
                        </button>
                      </div>

                      {showNewSupplierForm && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.3rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Supplier name"
                            value={inlineSupplierName}
                            onChange={(e) =>
                              setInlineSupplierName(e.target.value)
                            }
                            style={{
                              padding: "0.4rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                            }}
                          />
                          <div style={{ display: "flex", gap: "0.3rem" }}>
                            <input
                              type="text"
                              placeholder="Phone (optional)"
                              value={inlineSupplierPhone}
                              onChange={(e) =>
                                setInlineSupplierPhone(e.target.value)
                              }
                              style={{
                                flex: 1,
                                padding: "0.4rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "12px",
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleCreateInlineSupplier}
                              style={{
                                background: "#c2410c",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                padding: "0.4rem 0.6rem",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      <SearchableSelect
                        value={newYvSupplierId}
                        onChange={(val) => setNewYvSupplierId(val)}
                        options={supplierOptions}
                        placeholder="Search supplier…"
                        onAddNew={() => setShowNewSupplierForm(true)}
                        addNewLabel="New supplier"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "0.3rem",
                      }}
                    >
                      SKU (optional)
                    </label>
                    <input
                      type="text"
                      value={newYvSku}
                      onChange={(e) => setNewYvSku(e.target.value)}
                      placeholder="e.g. YRN-BLU-SUP1"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "0.75rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddVariantModal(false)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    padding: "0.6rem 1rem",
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
                  disabled={savingVariant}
                  style={{
                    background: "#c2410c",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: savingVariant ? "not-allowed" : "pointer",
                  }}
                >
                  {savingVariant ? "Saving…" : "Save & Use Variant"}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}

export default TransactionFormPage;
