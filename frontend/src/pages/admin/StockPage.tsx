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
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">ስቶክ / Stock</p>
          <h2>Available Inventory</h2>
        </div>
      </header>

      <div className="card table-card">
        <h3>Yarn Stock</h3>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Type</th>
              <th>Color</th>
              <th>On Hand</th>
            </tr>
          </thead>
          <tbody>
            {yarns.map((row) => (
              <tr key={row.yarnVariantId}>
                <td>{row.sku}</td>
                <td>{row.yarnType.materialName}</td>
                <td>{row.color.name}</td>
                <td>{row.stockSnapshot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card table-card" style={{ marginTop: "1rem" }}>
        <h3>Fabric Stock</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>On Hand</th>
            </tr>
          </thead>
          <tbody>
            {fabrics.map((row) => (
              <tr key={row.fabricVariantId}>
                <td>{row.product.name}</td>
                <td>{row.sku}</td>
                <td>{row.stockSnapshot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}