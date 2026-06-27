import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { weaverPortalApi } from "../../api";

interface ZigDetail {
  zigId: string;
  status: string;
  fabricVariant: { product: { name: string } };
  yarnGiven: Array<{ yarnGivenId: number; quantity: string; unitPrice: string; dateGiven: string }>;
  fabricReturns: Array<{
    returnId: number;
    quantityReturned: number;
    totalWeight: string;
    unitPrice: string;
    calculatedDeduction: string | null;
    bonusAmount: string;
    netCreditValue: string | null;
    fabricVariant: { product: { name: string } };
  }>;
}

export function WeaverZigDetailPage() {
  const { zigId } = useParams<{ zigId: string }>();
  const [zig, setZig] = useState<ZigDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!zigId) return;
    weaverPortalApi
      .workOrder(zigId)
      .then((data) => setZig(data as ZigDetail))
      .catch((err) => setError(err.message));
  }, [zigId]);

  if (!zig) return <p className="muted">Loading zig details...</p>;

  return (
    <section className="weaver-page">
      <p>
        <Link to="/weaver/zigs">← Back to my zigs</Link>
      </p>
      <header className="weaver-hero">
        <div>
          <h2>{zig.zigId}</h2>
          <p className="muted">Target: {zig.fabricVariant.product.name}</p>
        </div>
        <span className={`badge ${zig.status}`}>{zig.status}</span>
      </header>

      <div className="grid">
        <div className="card table-card">
          <h3>Yarn Received</h3>
          <table>
            <thead>
              <tr>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {zig.yarnGiven.map((row) => (
                <tr key={row.yarnGivenId}>
                  <td>{row.quantity}</td>
                  <td>{row.unitPrice} ETB</td>
                  <td>{new Date(row.dateGiven).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {zig.yarnGiven.length === 0 && <p className="muted">No yarn recorded yet.</p>}
        </div>

        <div className="card table-card">
          <h3>Fabric Returned</h3>
          <table>
            <thead>
              <tr>
                <th>Fabric</th>
                <th>Qty</th>
                <th>Weight</th>
                <th>Deduction</th>
                <th>Net Credit</th>
              </tr>
            </thead>
            <tbody>
              {zig.fabricReturns.map((row) => (
                <tr key={row.returnId}>
                  <td>{row.fabricVariant.product.name}</td>
                  <td>{row.quantityReturned}</td>
                  <td>{row.totalWeight} g</td>
                  <td>{row.calculatedDeduction ?? "—"}</td>
                  <td>{row.netCreditValue ?? "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {zig.fabricReturns.length === 0 && <p className="muted">No fabric returns yet.</p>}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}