import { useEffect, useState } from "react";
import { catalogApi, type FabricPriceRow, type YarnPriceRow } from "../../api";

export function WeaverRatesPage() {
  const [fabricPrices, setFabricPrices] = useState<FabricPriceRow[]>([]);
  const [yarnPrices, setYarnPrices] = useState<YarnPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      catalogApi.fabricPrices().catch(() => []),
      catalogApi.yarnPrices().catch(() => []),
    ])
      .then(([fp, yp]) => {
        setFabricPrices(fp.filter((p: any) => p.isActive !== false));
        setYarnPrices(yp.filter((p: any) => p.isActive !== false));
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load cooperative piece rates"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Page Header (Image 2) ── */}
      <div className="weaver-page-header">
        <h1 className="weaver-page-title">Rates · የዋጋና ተመን</h1>
        <p className="weaver-page-subtitle">What you are paid, and what yarn costs</p>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1.25rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <span>⏳</span> Loading cooperative piece rates…
        </div>
      ) : (
        <>
          {/* ── Card 1: Paid to you, per piece (Image 2) ── */}
          <div className="weaver-rates-card">
            <h2 className="weaver-rates-title">Paid to you, per piece</h2>

            {fabricPrices.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
                No active fabric piece rates found.
              </p>
            ) : (
              fabricPrices.map((fp) => {
                const name = fp.fabric?.name || `Fabric #${fp.fabricId}`;
                const rate = parseFloat(String(fp.weaverRate || "0"));

                return (
                  <div key={fp.fabricPriceId} className="weaver-rate-row">
                    <span className="weaver-rate-name">{name}</span>
                    <span className="weaver-rate-price">
                      {Math.round(rate).toLocaleString()} ETB
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Card 2: Yarn price charged to you (Image 2) ── */}
          <div className="weaver-rates-card">
            <h2 className="weaver-rates-title">Yarn price charged to you</h2>

            {yarnPrices.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
                No active yarn pricing found.
              </p>
            ) : (
              yarnPrices.map((yp) => {
                const yName = yp.yarn?.name || "cotton";
                const sName = yp.supplier?.name || "natural";
                const price = parseFloat(String(yp.sellingPrice || "0"));

                return (
                  <div key={yp.yarnPriceId} className="weaver-rate-row">
                    <span className="weaver-rate-name">
                      {yName} · {sName}
                    </span>
                    <span className="weaver-rate-price">
                      {Math.round(price).toLocaleString()} ETB
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748B)", margin: "1rem 0 0" }}>
            Prices in effect today.
          </p>
        </>
      )}
    </div>
  );
}

export default WeaverRatesPage;
