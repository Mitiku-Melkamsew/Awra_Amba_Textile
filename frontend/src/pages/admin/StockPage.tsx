import { useEffect, useState, useMemo } from "react";
import { stockApi } from "../../api";
import type { FabricVariant } from "../../api";

interface YarnRow {
  yarnVariantId: number;
  sku: string;
  stockSnapshot: string;
  yarnType: { materialName: string };
  color: { name: string };
}

function qty(val: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return n.toFixed(2);
}

function qtyClass(val: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  if (n <= 0) return "low";
  if (n < 20) return "low";
  return "ok";
}

export function StockPage() {
  const [yarns, setYarns] = useState<YarnRow[]>([]);
  const [fabrics, setFabrics] = useState<FabricVariant[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "yarn" | "fabric">(
    "all",
  );

  useEffect(() => {
    stockApi
      .get()
      .then((data) => {
        setYarns(data.yarnVariants as unknown as YarnRow[]);
        setFabrics(data.fabricVariants);
      })
      .catch((err) => setError(err.message));
  }, []);

  const lowStockYarns = useMemo(
    () => yarns.filter((y) => parseFloat(y.stockSnapshot) < 20),
    [yarns],
  );
  const lowStockFabrics = useMemo(
    () => fabrics.filter((f) => parseFloat(String(f.stockSnapshot ?? "0")) < 5),
    [fabrics],
  );

  const filteredYarns = useMemo(() => {
    if (!search.trim()) return yarns;
    const q = search.toLowerCase().trim();
    return yarns.filter(
      (y) =>
        y.sku.toLowerCase().includes(q) ||
        y.yarnType.materialName.toLowerCase().includes(q) ||
        y.color.name.toLowerCase().includes(q),
    );
  }, [yarns, search]);

  const filteredFabrics = useMemo(() => {
    if (!search.trim()) return fabrics;
    const q = search.toLowerCase().trim();
    return fabrics.filter(
      (f) =>
        f.sku.toLowerCase().includes(q) ||
        (f.fabric?.name ?? f.product?.name ?? "").toLowerCase().includes(q) ||
        (f.warpColor?.name && f.warpColor.name.toLowerCase().includes(q)) ||
        (f.weftColor?.name && f.weftColor.name.toLowerCase().includes(q)),
    );
  }, [fabrics, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ስቶክ / Inventory</p>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <h1 className="page-title">Available Inventory Stock</h1>
            {(lowStockYarns.length > 0 || lowStockFabrics.length > 0) && (
              <span className="badge badge-yellow">
                ⚠️ {lowStockYarns.length + lowStockFabrics.length} Low Stock
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Stock snapshots updated automatically on every procurement delivery
            and commercial sale.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={filterMode === "all" ? "tab-pill active" : "tab-pill"}
            onClick={() => setFilterMode("all")}
          >
            All Stock
          </button>
          <button
            type="button"
            className={filterMode === "yarn" ? "tab-pill active" : "tab-pill"}
            onClick={() => setFilterMode("yarn")}
          >
            🧶 Yarn ({yarns.length})
          </button>
          <button
            type="button"
            className={filterMode === "fabric" ? "tab-pill active" : "tab-pill"}
            onClick={() => setFilterMode("fabric")}
          >
            🪢 Fabric ({fabrics.length})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          className="search-input"
          placeholder="🔍 Filter stock inventory by SKU, material, color, or product name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div
        className="stock-panels"
        style={{
          gridTemplateColumns:
            filterMode === "yarn" || filterMode === "fabric"
              ? "1fr"
              : undefined,
        }}
      >
        {/* Yarn panel */}
        {(filterMode === "all" || filterMode === "yarn") && (
          <div className="stock-panel">
            <div className="stock-panel-header">
              <h2 className="stock-panel-title">
                🧶 Yarn Cones Stock / የጥጥ ክምችት
              </h2>
              <span className="badge badge-gray">
                {filteredYarns.length} variants
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Material Type</th>
                    <th>Color</th>
                    <th style={{ textAlign: "right" }}>On Hand (pieces)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredYarns.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state">
                          <span className="empty-icon">📦</span>
                          No yarn variants matching search.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredYarns.map((row) => (
                      <tr key={row.yarnVariantId}>
                        <td
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "12.5px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {row.sku}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {row.yarnType.materialName}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "var(--accent)",
                              }}
                            />
                            {row.color.name}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            className={`stock-qty ${qtyClass(row.stockSnapshot)}`}
                          >
                            {qty(row.stockSnapshot)} pieces
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fabric panel */}
        {(filterMode === "all" || filterMode === "fabric") && (
          <div className="stock-panel">
            <div className="stock-panel-header">
              <h2 className="stock-panel-title">
                🪢 Finished Fabric Stock / የጨርቅ ክምችት
              </h2>
              <span className="badge badge-gray">
                {filteredFabrics.length} variants
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product & Pattern</th>
                    <th>SKU</th>
                    <th style={{ textAlign: "right" }}>On Hand (pcs)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFabrics.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div className="empty-state">
                          <span className="empty-icon">📦</span>
                          No fabric variants matching search.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFabrics.map((row) => (
                      <tr key={row.fabricVariantId}>
                        <td>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "13.5px",
                              color: "var(--text)",
                            }}
                          >
                            {row.fabric?.name ??
                              row.product?.name ??
                              "Handwoven Fabric"}
                          </div>
                          {(row.warpColor || row.weftColor || row.design) && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                                marginTop: "2px",
                              }}
                            >
                              {row.warpColor && `warp: ${row.warpColor.name}`}
                              {row.weftColor &&
                                ` · weft: ${row.weftColor.name}`}
                              {row.design && ` · ${row.design.name}`}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "12.5px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {row.sku}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            className={`stock-qty ${qtyClass(String(row.stockSnapshot ?? "0"))}`}
                          >
                            {qty(String(row.stockSnapshot ?? "0"))} pcs
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockPage;
