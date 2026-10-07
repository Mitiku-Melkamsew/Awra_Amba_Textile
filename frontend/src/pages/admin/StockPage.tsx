import { useEffect, useState } from "react";
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

  useEffect(() => {
    stockApi
      .get()
      .then((data) => {
        setYarns(data.yarnVariants as YarnRow[]);
        setFabrics(data.fabricVariants);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ስቶክ / Stock</p>
          <h1 className="page-title">Available Inventory</h1>
          <p className="page-subtitle">Stock snapshots updated automatically on each transaction.</p>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: "1rem" }}><span>⚠️</span> {error}</div>}

      <div className="stock-panels">
        {/* Yarn panel */}
        <div className="stock-panel">
          <div className="stock-panel-header">
            <h2 className="stock-panel-title">🧶 Yarn Stock</h2>
            <span className="muted" style={{ fontSize: 12 }}>{yarns.length} variants</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Color</th>
                  <th style={{ textAlign: "right" }}>On Hand</th>
                </tr>
              </thead>
              <tbody>
                {yarns.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state"><span className="empty-icon">📦</span>No yarn variants.</div>
                    </td>
                  </tr>
                ) : (
                  yarns.map((row) => (
                    <tr key={row.yarnVariantId}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{row.sku}</td>
                      <td>{row.yarnType.materialName}</td>
                      <td>{row.color.name}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`stock-qty ${qtyClass(row.stockSnapshot)}`}>
                          {qty(row.stockSnapshot)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fabric panel */}
        <div className="stock-panel">
          <div className="stock-panel-header">
            <h2 className="stock-panel-title">🪢 Fabric Stock</h2>
            <span className="muted" style={{ fontSize: 12 }}>{fabrics.length} variants</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: "right" }}>On Hand</th>
                </tr>
              </thead>
              <tbody>
                {fabrics.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state"><span className="empty-icon">📦</span>No fabric variants.</div>
                    </td>
                  </tr>
                ) : (
                  fabrics.map((row) => (
                    <tr key={row.fabricVariantId}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{row.product.name}</div>
                        {row.warpColor && row.weftColor && (
                          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                            warp: {row.warpColor.name} · weft: {row.weftColor.name}
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{row.sku}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`stock-qty ${qtyClass(row.stockSnapshot)}`}>
                          {qty(row.stockSnapshot)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}