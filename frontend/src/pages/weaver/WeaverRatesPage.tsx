import { useEffect, useState } from "react";
import { catalogApi, type FabricPriceRow, type YarnPriceRow } from "../../api";
import { toTitleCase } from "../../utils/formatters";

export function WeaverRatesPage() {
  const [fabricPrices, setFabricPrices] = useState<FabricPriceRow[]>([]);
  const [yarnPrices, setYarnPrices] = useState<YarnPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      catalogApi.fabricPrices({ activeOnly: true }).catch(() => []),
      catalogApi.yarnPrices({ activeOnly: true }).catch(() => []),
    ])
      .then(([fp, yp]) => {
        const now = new Date();

        // 1. Filter and group to only currently active fabric piece rates
        const activeFpMap = new Map<number, FabricPriceRow>();
        const sortedFp = [...fp].sort(
          (a, b) => new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime()
        );
        for (const p of sortedFp) {
          const isNotExpired = !p.effectiveTo || new Date(p.effectiveTo) > now;
          if (p.isActive !== false && isNotExpired && !activeFpMap.has(p.fabricId)) {
            if (p.fabric?.isActive !== false) {
              activeFpMap.set(p.fabricId, p);
            }
          }
        }

        // 2. Filter and group to only currently active yarn prices (per piece)
        const activeYpMap = new Map<string, YarnPriceRow>();
        const sortedYp = [...yp].sort(
          (a, b) => new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime()
        );
        for (const p of sortedYp) {
          const isNotExpired = !p.effectiveTo || new Date(p.effectiveTo) > now;
          const key = `${p.yarnId}-${p.supplierId ?? 0}`;
          if (p.isActive !== false && isNotExpired && !activeYpMap.has(key)) {
            if (p.yarn?.isActive !== false) {
              activeYpMap.set(key, p);
            }
          }
        }

        setFabricPrices(Array.from(activeFpMap.values()));
        setYarnPrices(Array.from(activeYpMap.values()));
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
        <p className="weaver-page-subtitle">Currently active piece rates and yarn prices</p>
      </div>

      {error && (
        <div className="error-msg mb-5">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="loading text-center p-8">
          <span>⏳</span> Loading cooperative piece rates…
        </div>
      ) : (
        <>
          {/* ── Card 1: Paid to you, per piece (Image 2) ── */}
          <div className="weaver-rates-card">
            <h2 className="weaver-rates-title">Paid to you, per piece</h2>

            {fabricPrices.length === 0 ? (
              <p className="weaver-rates-empty">
                No active fabric piece rates found.
              </p>
            ) : (
              fabricPrices.map((fp) => {
                const name = toTitleCase(fp.fabric?.name || `Fabric #${fp.fabricId}`);
                const rate = parseFloat(String(fp.weaverRate || "0"));

                return (
                  <div key={fp.fabricPriceId} className="weaver-rate-row">
                    <span className="weaver-rate-name">{name}</span>
                    <span className="weaver-rate-price">
                      {Math.round(rate).toLocaleString()} ETB / piece
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Card 2: Yarn price charged to you (per piece) (Image 2) ── */}
          <div className="weaver-rates-card">
            <h2 className="weaver-rates-title">Yarn price charged to you (per piece)</h2>

            {yarnPrices.length === 0 ? (
              <p className="weaver-rates-empty">
                No active yarn pricing found.
              </p>
            ) : (
              yarnPrices.map((yp) => {
                const yName = toTitleCase(yp.yarn?.name || "cotton");
                const sName = toTitleCase(yp.supplier?.name || "natural");
                const price = parseFloat(String(yp.sellingPrice || "0"));

                return (
                  <div key={yp.yarnPriceId} className="weaver-rate-row">
                    <span className="weaver-rate-name">
                      {yName} · {sName}
                    </span>
                    <span className="weaver-rate-price">
                      {Math.round(price).toLocaleString()} ETB / piece
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <p className="weaver-rates-footnote">
            Currently active prices in effect today.
          </p>
        </>
      )}
    </div>
  );
}

export default WeaverRatesPage;
