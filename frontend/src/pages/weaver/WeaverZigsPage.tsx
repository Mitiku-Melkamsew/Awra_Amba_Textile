import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { weaverPortalApi } from "../../api";

interface ZigRow {
  zigId: string;
  status: string;
  fabricVariant: { product: { name: string } };
  _count?: { yarnGiven: number; fabricReturns: number };
}

export function WeaverZigsPage() {
  const [zigs, setZigs] = useState<ZigRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    weaverPortalApi
      .workOrders()
      .then(setZigs)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="weaver-page">
      <h2>My Zigs</h2>
      <p className="muted">Read-only view of your assigned work orders.</p>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Zig</th>
              <th>Fabric</th>
              <th>Status</th>
              <th>Yarn</th>
              <th>Returns</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {zigs.map((zig) => (
              <tr key={zig.zigId}>
                <td>{zig.zigId}</td>
                <td>{zig.fabricVariant.product.name}</td>
                <td>
                  <span className={`badge ${zig.status}`}>{zig.status}</span>
                </td>
                <td>{zig._count?.yarnGiven ?? 0}</td>
                <td>{zig._count?.fabricReturns ?? 0}</td>
                <td>
                  <Link to={`/weaver/zigs/${zig.zigId}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {zigs.length === 0 && <p className="muted">No work orders yet.</p>}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}