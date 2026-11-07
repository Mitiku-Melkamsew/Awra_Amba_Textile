import { useEffect, useState, useMemo } from "react";
import { catalogApi, type FabricPriceRow, type YarnPriceRow, type Fabric } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";

export function WeaverRatesTransparency() {
  const [activeSubTab, setActiveSubTab] = useState<"fabric" | "yarn">("fabric");
  const [fabricPrices, setFabricPrices] = useState<FabricPriceRow[]>([]);
  const [yarnPrices, setYarnPrices] = useState<YarnPriceRow[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      catalogApi.fabricPrices().catch(() => []),
      catalogApi.yarnPrices().catch(() => []),
      catalogApi.fabrics().catch(() => []),
    ])
      .then(([fp, yp, f]) => {
        setFabricPrices(fp.filter((p: any) => p.isActive));
        setYarnPrices(yp.filter((p: any) => p.isActive));
        setFabrics(f);
      })
      .catch((err) => setError(err.message || "Failed to load active rates"))
      .finally(() => setLoading(false));
  }, []);

  const fabricSpecsMap = useMemo(() => {
    const map = new Map<number, Fabric>();
    for (const f of fabrics) {
      map.set(f.fabricId, f);
    }
    return map;
  }, [fabrics]);

  const q = search.toLowerCase().trim();

  const filteredFabricRates = useMemo(() => {
    if (!q) return fabricPrices;
    return fabricPrices.filter((p) => {
      const name = p.fabric?.name?.toLowerCase() ?? "";
      return name.includes(q) || String(p.fabricId).includes(q);
    });
  }, [fabricPrices, q]);

  const filteredYarnRates = useMemo(() => {
    if (!q) return yarnPrices;
    return yarnPrices.filter((p) => {
      const yName = p.yarn?.name?.toLowerCase() ?? "";
      const sName = p.supplier?.name?.toLowerCase() ?? "";
      return yName.includes(q) || sName.includes(q);
    });
  }, [yarnPrices, q]);

  if (loading) {
    return (
      <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
        <div className="loading"><span>⏳</span> Loading live artisan price schedules…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ padding: "1rem", borderRadius: "8px" }}>
        <span>⚠️</span> {error}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Transparency Header & Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span className="eyebrow" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#065F46" }}>
                ግልፅነት / Rate Transparency
              </span>
              <span className="badge badge-green">✓ Official Cooperative Rates</span>
            </div>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: "18px", fontWeight: 800 }}>
              Artisan Piece Rates & Yarn Pricing / የአሸጋይ ክፍያ እና የክር ተመን
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
              Official piece rate wages paid to artisans per finished handwoven fabric piece, and standard yarn material prices.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              type="button"
              className={activeSubTab === "fabric" ? "tab-pill active" : "tab-pill"}
              onClick={() => setActiveSubTab("fabric")}
            >
              🧣 Fabric Piece Rates ({filteredFabricRates.length})
            </button>
            <button
              type="button"
              className={activeSubTab === "yarn" ? "tab-pill active" : "tab-pill"}
              onClick={() => setActiveSubTab("yarn")}
            >
              🧶 Yarn Pricing ({filteredYarnRates.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="toolbar" style={{ margin: 0 }}>
        <input
          className="search-input"
          placeholder={
            activeSubTab === "fabric"
              ? "🔍 Filter by fabric name (e.g. Gabi, Netela, Bedspread)…"
              : "🔍 Filter by yarn material or supplier…"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Subtab 1: Fabric Rates */}
      {activeSubTab === "fabric" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fabric Product / የጨርቁ ዓይነት</th>
                <th>Standard Specs / መለኪያ</th>
                <th style={{ textAlign: "right" }}>Weaver Piece Rate / የአሸጋይ ክፍያ</th>
                <th style={{ textAlign: "right" }}>Commercial Selling Price</th>
                <th>Effective Since</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFabricRates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No active fabric piece rates found.
                  </td>
                </tr>
              ) : (
                filteredFabricRates.map((p) => {
                  const specs = fabricSpecsMap.get(p.fabricId);
                  return (
                    <tr key={p.fabricPriceId}>
                      <td style={{ fontWeight: 700, fontSize: "14px" }}>
                        🧣 {p.fabric?.name ?? `Fabric #${p.fabricId}`}
                      </td>
                      <td style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                        {specs ? (
                          <>
                            <span>{specs.standardLengthCm}cm × {specs.standardWidthCm}cm</span>
                            <span style={{ margin: "0 0.4rem" }}>·</span>
                            <strong>{specs.standardWeightG}g</strong>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "15px",
                            color: "var(--accent)",
                            background: "var(--brand-light)",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "6px",
                          }}
                        >
                          {Number(p.weaverRate).toLocaleString()} ETB
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                          per piece
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#0284C7" }}>
                        {Number(p.sellingPrice).toLocaleString()} ETB
                      </td>
                      <td style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                        {formatDateDDMMYY(p.effectiveFrom)}
                      </td>
                      <td>
                        <span className="badge badge-green">Active Rate</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 2: Yarn Rates */}
      {activeSubTab === "yarn" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Yarn Material / የጥጥ ዓይነት</th>
                <th>Supplier / አቅራቢ</th>
                <th style={{ textAlign: "right" }}>Procurement Cost / የመግዣ ዋጋ</th>
                <th style={{ textAlign: "right" }}>Selling Price / የሽያጭ ዋጋ</th>
                <th>Effective Since</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredYarnRates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No active yarn prices found.
                  </td>
                </tr>
              ) : (
                filteredYarnRates.map((yp) => (
                  <tr key={yp.yarnPriceId}>
                    <td style={{ fontWeight: 700, fontSize: "14px" }}>
                      🧶 {yp.yarn?.name ?? `Yarn #${yp.yarnId}`}
                    </td>
                    <td>
                      🏢 {yp.supplier?.name ?? `Supplier #${yp.supplierId}`}
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "var(--text)" }}>
                      {Number(yp.purchasePrice).toLocaleString()} ETB
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                        per piece/cone
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "14px",
                          color: "#0284C7",
                          background: "#E0F2FE",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "6px",
                        }}
                      >
                        {Number(yp.sellingPrice).toLocaleString()} ETB
                      </span>
                    </td>
                    <td style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                      {formatDateDDMMYY(yp.effectiveFrom)}
                    </td>
                    <td>
                      <span className="badge badge-green">Active Rate</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WeaverRatesTransparency;
