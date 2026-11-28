import { useEffect, useMemo, useRef, useState } from "react";
import {
  matchesAllWords,
  searchHaystack,
  searchWords,
} from "../../../../utils/searchMatch";

export interface SearchableVariantSelectProps {
  isFabric: boolean;
  canAddNew: boolean;
  isSale: boolean;
  selectedVariantId: string;
  fabricVariants: any[];
  yarnVariants: any[];
  onSelect: (variantId: string) => void;
  onAddNew: (query?: string) => void;
}

export function SearchableVariantSelect({
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
          (f) => String(f.fabricVariantId) === selectedVariantId
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

  const filtered = useMemo(() => {
    if (words.length === 0) return indexed;
    return indexed.filter((entry) => matchesAllWords(entry.haystack, words));
  }, [indexed, words]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setIsTyping(false);
        setQuery(selectedLabel);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedLabel]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={
            isFabric ? "Search fabric variant…" : "Search yarn variant…"
          }
          onFocus={(e) => {
            setDropdownOpen(true);
            setIsTyping(true);
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsTyping(true);
            setDropdownOpen(true);
          }}
          className="input"
          style={{
            height: 38,
            fontSize: "13px",
            paddingRight: "2rem",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsTyping(true);
              onSelect("");
              inputRef.current?.focus();
            }}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted, #94a3b8)",
              cursor: "pointer",
              fontSize: "14px",
              padding: "2px",
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
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--color-surface, #ffffff)",
            border: "1px solid var(--color-border-subtle, #e2e8f0)",
            borderRadius: "var(--radius-sm, 8px)",
            boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
            maxHeight: 240,
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {canAddNew && (
            <div
              onClick={() => {
                setDropdownOpen(false);
                setIsTyping(false);
                onAddNew(query);
              }}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
                background: "var(--color-orange-50, #fff7ed)",
                color: "var(--color-primary, #c2410c)",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>+</span>
              <span>
                {isFabric ? "Create new fabric variant" : "Create new yarn variant"}
                {query.trim() ? ` "${query.trim()}"` : ""}
              </span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div
              style={{
                padding: "16px 12px",
                textAlign: "center",
                color: "var(--color-text-muted, #94a3b8)",
                fontSize: "12px",
              }}
            >
              No variants match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  onSelect(entry.id);
                  setQuery(entry.title + (entry.subtitle ? ` · ${entry.subtitle}` : ""));
                  setDropdownOpen(false);
                  setIsTyping(false);
                }}
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    entry.id === selectedVariantId
                      ? "var(--color-orange-50, #fff7ed)"
                      : "var(--color-surface, #ffffff)",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-orange-50, #fff7ed)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    entry.id === selectedVariantId ? "var(--color-orange-50, #fff7ed)" : "var(--color-surface, #ffffff)")
                }
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "var(--color-text, #0f172a)",
                    }}
                  >
                    {entry.title}
                  </div>
                  {entry.subtitle && (
                    <div style={{ fontSize: "11.5px", color: "var(--color-text-muted, #64748b)" }}>
                      {entry.subtitle}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  {entry.stock > 0 ? (
                    <span
                      style={{
                        fontSize: "11.5px",
                        color: "var(--color-success, #16a34a)",
                        fontWeight: 600,
                      }}
                    >
                      {entry.stock} in stock
                    </span>
                  ) : (
                    <span style={{ fontSize: "11.5px", color: "var(--color-text-muted, #94a3b8)" }}>
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
