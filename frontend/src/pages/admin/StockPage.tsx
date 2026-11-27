import { useEffect, useState, useMemo } from "react";
import { stockApi } from "../../api";
import type { FabricVariant } from "../../api";
import { toTitleCase } from "../../utils/formatters";

interface YarnRow {
  yarnVariantId: number;
  sku: string;
  name: string;
  colorName: string;
  stockSnapshot: number;
}

interface FabricRow {
  fabricVariantId: number;
  sku: string;
  name: string;
  patternOrColor?: string;
  stockSnapshot: number;
}

export function StockPage() {
  const [yarns, setYarns] = useState<YarnRow[]>([]);
  const [fabrics, setFabrics] = useState<FabricRow[]>([]);
  const [activeTab, setActiveTab] = useState<"yarn" | "fabric">("yarn");
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    stockApi
      .get()
      .then((data) => {
        if (data.yarnVariants) {
          const mappedYarns: YarnRow[] = (data.yarnVariants as any[]).map((y) => {
            const material = toTitleCase(y.yarn?.name ?? "cotton");
            const color = toTitleCase(y.color?.name ?? "natural");
            return {
              yarnVariantId: y.yarnVariantId,
              sku: y.sku ? (y.sku.startsWith("SKU ") ? y.sku : `SKU ${y.sku}`) : `SKU Y-${y.yarnVariantId}`,
              name: `${material} · ${color}`,
              colorName: color,
              stockSnapshot: Math.round(Number(y.stockSnapshot ?? 0)) || 0,
            };
          });
          setYarns(mappedYarns);
        }

        if (data.fabricVariants) {
          const mappedFabrics: FabricRow[] = (data.fabricVariants as FabricVariant[]).map((f) => {
            const fname = f.fabric?.name ?? "fabric";
            const warp = f.warpColor?.name;
            const weft = f.weftColor?.name;
            const design = f.design?.name;
            const parts = [fname, warp, weft, design].filter(Boolean).map((p) => toTitleCase(String(p)));
            return {
              fabricVariantId: f.fabricVariantId,
              sku: f.sku ? (f.sku.startsWith("SKU ") ? f.sku : `SKU ${f.sku}`) : `SKU F-${f.fabricVariantId}`,
              name: parts.length > 1 ? parts.slice(0, 3).join(" · ") : toTitleCase(fname),
              stockSnapshot: parseFloat(String(f.stockSnapshot ?? 0)) || 0,
            };
          });
          setFabrics(mappedFabrics);
        }
      })
      .catch(() => {
        setYarns([]);
        setFabrics([]);
      });
  }, []);

  // Compute counts
  const yarnAttentionCount = useMemo(() => yarns.filter((y) => y.stockSnapshot < 20).length, [yarns]);
  const fabricAttentionCount = useMemo(() => fabrics.filter((f) => f.stockSnapshot < 20).length, [fabrics]);
  const totalNeedAttention = yarnAttentionCount + fabricAttentionCount;

  // Filter & sort: Problem items (Out of stock = 0, Low stock < 20) are listed first
  function getStatus(stock: number): { label: string; badgeClass: string; order: number } {
    if (stock <= 0) {
      return { label: "🚫 Out of stock", badgeClass: "badge-status-out", order: 1 };
    }
    if (stock < 20) {
      return { label: "⚠️ Low", badgeClass: "badge-status-low", order: 2 };
    }
    return { label: "✓ In stock", badgeClass: "badge-status-in", order: 3 };
  }

  const filteredYarns = useMemo(() => {
    let list = yarns;
    if (lowStockOnly) {
      list = list.filter((y) => y.stockSnapshot < 20);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((y) => y.name.toLowerCase().includes(q) || y.sku.toLowerCase().includes(q));
    }
    // Sort problem items first
    return [...list].sort((a, b) => {
      const orderA = getStatus(a.stockSnapshot).order;
      const orderB = getStatus(b.stockSnapshot).order;
      if (orderA !== orderB) return orderA - orderB;
      return a.stockSnapshot - b.stockSnapshot;
    });
  }, [yarns, search, lowStockOnly]);

  const filteredFabrics = useMemo(() => {
    let list = fabrics;
    if (lowStockOnly) {
      list = list.filter((f) => f.stockSnapshot < 20);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.sku.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const orderA = getStatus(a.stockSnapshot).order;
      const orderB = getStatus(b.stockSnapshot).order;
      if (orderA !== orderB) return orderA - orderB;
      return a.stockSnapshot - b.stockSnapshot;
    });
  }, [fabrics, search, lowStockOnly]);

  return (
    <div className="page stock-on-hand-page">
      {/* Title */}
      <h1 className="stock-page-title">
        Stock on hand <span className="title-amharic">· ክምችት</span>
      </h1>

      {/* Top 3 KPI Cards */}
      <div className="stock-kpi-grid">
        <div className="card stock-kpi-card">
          <span className="stock-kpi-label">Yarn items</span>
          <div className="stock-kpi-num">{yarns.length}</div>
          <span className="stock-kpi-sub">varieties in stock</span>
        </div>

        <div className="card stock-kpi-card">
          <span className="stock-kpi-label">Fabric items</span>
          <div className="stock-kpi-num">{fabrics.length}</div>
          <span className="stock-kpi-sub">varieties in stock</span>
        </div>

        <div className="card stock-kpi-card stock-kpi-warning">
          <span className="stock-kpi-label">Need attention</span>
          <div className="stock-kpi-num text-warning-rust">{totalNeedAttention}</div>
          <span className="stock-kpi-sub">low or out of stock</span>
        </div>
      </div>

      {/* Toolbar: Category tabs, Search, Low stock only */}
      <div className="stock-toolbar">
        {/* Segmented Tab Pill */}
        <div className="segmented-tab-group">
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === "yarn" ? "active" : ""}`}
            onClick={() => setActiveTab("yarn")}
          >
            Yarn · ጥጥ <span className="tab-count-badge">{yarns.length}</span>
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === "fabric" ? "active" : ""}`}
            onClick={() => setActiveTab("fabric")}
          >
            Fabric · ጨርቅ <span className="tab-count-badge">{fabrics.length}</span>
          </button>
        </div>

        {/* Search */}
        <div className="stock-search-wrap">
          <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="stock-search-input"
            placeholder="Search by name or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Low stock toggle */}
        <button
          type="button"
          className={`btn btn-sm ${lowStockOnly ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setLowStockOnly(!lowStockOnly)}
        >
          Low stock only
        </button>
      </div>

      {/* Table Card */}
      <div className="card stock-table-card">
        <table className="stock-table">
          <thead>
            <tr>
              <th style={{ width: "60%" }}>{activeTab === "yarn" ? "Yarn" : "Fabric"}</th>
              <th style={{ width: "22%", textAlign: "right" }}>On hand (pieces)</th>
              <th style={{ width: "18%", textAlign: "right" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === "yarn" ? (
              filteredYarns.length === 0 ? (
                <tr>
                  <td colSpan={3} className="stock-empty-td">
                    No yarn items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredYarns.map((item) => {
                  const status = getStatus(item.stockSnapshot);
                  return (
                    <tr key={item.yarnVariantId}>
                      <td>
                        <div className="stock-item-name">{item.name}</div>
                        <div className="stock-item-sku">{item.sku}</div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="stock-item-qty">{item.stockSnapshot}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`status-pill ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )
            ) : filteredFabrics.length === 0 ? (
              <tr>
                <td colSpan={3} className="stock-empty-td">
                  No fabric items found matching your filters.
                </td>
              </tr>
            ) : (
              filteredFabrics.map((item) => {
                const status = getStatus(item.stockSnapshot);
                return (
                  <tr key={item.fabricVariantId}>
                    <td>
                      <div className="stock-item-name">{item.name}</div>
                      <div className="stock-item-sku">{item.sku}</div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="stock-item-qty">{item.stockSnapshot}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`status-pill ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <p className="stock-footnote">
        Low means fewer than 20 pieces. Problem items are listed first.
      </p>
    </div>
  );
}

export default StockPage;
