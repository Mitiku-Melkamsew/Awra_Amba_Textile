import { useEffect, useState, useMemo } from "react";
import { merchantApi } from "../../api";
import type { FabricPriceRow } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

export function MerchantPricesPage() {
  const [prices, setPrices] = useState<FabricPriceRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    merchantApi
      .prices()
      .then(setPrices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredPrices = useMemo(() => {
    if (!search.trim()) return prices;
    const q = search.toLowerCase();
    return prices.filter(
      (p) =>
        p.fabric?.name?.toLowerCase().includes(q) ||
        String(p.fabricId).includes(q)
    );
  }, [prices, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow" style={{ background: "#E0F2FE", color: "#0369A1" }}>
            የሽያጭ ዋጋ ዝርዝር / Official Price Sheet
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Fabric Selling Prices</h1>
            <span className="badge badge-gray">{prices.length} Active Rates</span>
          </div>
          <p className="page-subtitle">
            Cooperative-mandated selling price schedule for wholesale merchants and retail partners.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "16px" }}>🔍</span>
          <input
            type="text"
            placeholder="Search price schedule by fabric name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ width: "100%", maxWidth: "400px", padding: "0.55rem 0.85rem", fontSize: "13.5px" }}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fabric Type</th>
              <th>Standard Specs (L × W · Wt)</th>
              <th style={{ textAlign: "right" }}>Official Selling Price</th>
              <th>Effective From</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <div className="loading"><span>⏳</span> Loading official price schedule…</div>
                </td>
              </tr>
            ) : filteredPrices.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <span className="empty-icon">🏷️</span>
                    <p style={{ fontWeight: 600, color: "var(--text)" }}>
                      {search ? "No prices match your search." : "No fabric prices active."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPrices.map((price) => (
                <tr key={price.fabricPriceId}>
                  <td style={{ fontWeight: 700, color: "var(--text)" }}>
                    {price.fabric?.name ?? `Fabric #${price.fabricId}`}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>
                    {price.fabric
                      ? `${price.fabric.standardLengthCm}cm × ${price.fabric.standardWidthCm}cm · ${price.fabric.standardWeightG}g`
                      : "—"}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 800,
                      color: "#0369A1",
                      fontSize: "15px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Number(price.sellingPrice).toLocaleString()} ETB
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>
                    {formatDateDDMMYY(price.effectiveFrom)}
                  </td>
                  <td>
                    <span className="badge badge-green">Active</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MerchantPricesPage;
