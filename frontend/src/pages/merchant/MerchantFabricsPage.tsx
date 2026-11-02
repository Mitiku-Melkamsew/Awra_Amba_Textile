import { useEffect, useState, useMemo } from "react";
import { merchantApi } from "../../api";
import type { AvailableFabric } from "../../api";

export function MerchantFabricsPage() {
  const [fabrics, setFabrics] = useState<AvailableFabric[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    merchantApi
      .availableFabrics()
      .then(setFabrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredFabrics = useMemo(() => {
    if (!search.trim()) return fabrics;
    const q = search.toLowerCase();
    return fabrics.filter(
      (f) =>
        f.fabricName.toLowerCase().includes(q) ||
        f.sku.toLowerCase().includes(q) ||
        f.design.toLowerCase().includes(q) ||
        f.warpColor.toLowerCase().includes(q) ||
        f.weftColor.toLowerCase().includes(q)
    );
  }, [fabrics, search]);

  return (
    <div className="page">
      {/* ── Welcome Banner ── */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #075985 0%, #0369A1 100%)",
          color: "#fff",
          marginBottom: "1.5rem",
          padding: "1.5rem 1.75rem",
          borderRadius: "14px",
          boxShadow: "0 10px 25px -5px rgba(3, 105, 161, 0.35)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(224, 242, 254, 0.2)", color: "#BAE6FD", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "11.5px", fontWeight: 700, marginBottom: "0.5rem" }}>
          <span>🇪🇹</span> አውራ አምባ ማህበር የጨርቅ ካታሎግ
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px", color: "#FFFFFF" }}>
          Available Fabrics Catalog / የሚገኙ ጨርቆች
        </h1>
        <p style={{ margin: 0, fontSize: "13.5px", color: "#E0F2FE", maxWidth: "700px", lineHeight: 1.5 }}>
          Browse artisan-crafted cooperative fabrics with official technical specifications and current verified cooperative selling prices.
        </p>
      </div>

      {/* ── Wholesale Ordering Notice ── */}
      <div
        style={{
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: "10px",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "13px",
          color: "#1E40AF",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>ℹ️</span>
        <div>
          <strong>Commercial Notice:</strong> Direct wholesale orders and merchant credit approval workflows are currently managed directly by cooperative management. For bulk purchase orders, contact the sales desk with the variant SKU numbers listed below.
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 300px" }}>
            <span style={{ fontSize: "16px" }}>🔍</span>
            <input
              type="text"
              placeholder="Search by fabric name, SKU, design pattern, or color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: "0.55rem 0.85rem", fontSize: "13.5px" }}
            />
          </div>
          <span className="badge badge-gray" style={{ fontSize: "12.5px" }}>
            {filteredFabrics.length} {filteredFabrics.length === 1 ? "Variant" : "Variants"} Available
          </span>
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <span>⏳</span> Loading available fabrics catalog…
        </div>
      ) : filteredFabrics.length === 0 ? (
        <div className="empty-state card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <span className="empty-icon" style={{ fontSize: "2rem" }}>🧣</span>
          <p style={{ fontWeight: 600, color: "var(--text)", margin: "0.5rem 0" }}>
            {search ? "No fabrics match your search query." : "No fabrics cataloged yet."}
          </p>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Please check back soon or clear the search filter.
          </span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {filteredFabrics.map((fabric) => (
            <div
              key={fabric.fabricVariantId}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      background: "#F1F5F9",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "6px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    SKU: {fabric.sku}
                  </span>
                  <span className="badge badge-green" style={{ fontSize: "11px" }}>
                    Standard Spec
                  </span>
                </div>

                <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                  {fabric.fabricName}
                </h3>
                <p style={{ margin: "0 0 1rem", fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Pattern: <strong>{fabric.design}</strong>
                </p>

                <div
                  style={{
                    background: "#F8FAFC",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                    fontSize: "12px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Warp / Weft</span>
                    <strong style={{ color: "#1E293B" }}>{fabric.warpColor} / {fabric.weftColor}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Std Weight</span>
                    <strong style={{ color: "#1E293B" }}>{fabric.standardWeightG}g</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Std Length</span>
                    <strong style={{ color: "#1E293B" }}>{fabric.standardLengthCm} cm</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block" }}>Std Width</span>
                    <strong style={{ color: "#1E293B" }}>{fabric.standardWidthCm} cm</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid #E2E8F0",
                  paddingTop: "0.85rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                  Official Selling Price
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#0369A1",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fabric.sellingPrice > 0 ? `${Number(fabric.sellingPrice).toLocaleString()} ETB` : "Inquire"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MerchantFabricsPage;
