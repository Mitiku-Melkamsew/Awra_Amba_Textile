import { useEffect, useState, useMemo } from "react";
import { merchantApi } from "../../api";
import type { AvailableFabric } from "../../api";

function derivePattern(design: string): "geberdin" | "zigzag" | "stripes" {
  const d = (design || "").toLowerCase();
  if (d.includes("zigzag")) return "zigzag";
  if (d.includes("stripe") || d.includes("tibeb") || d.includes("line")) return "stripes";
  return "geberdin";
}

export function MerchantFabricsPage() {
  const [fabrics, setFabrics] = useState<AvailableFabric[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedWarps, setSelectedWarps] = useState<string[]>([]);
  const [selectedWefts, setSelectedWefts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    merchantApi
      .availableFabrics()
      .then((data) => {
        setFabrics(data || []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // 1. Fabric categories with counts
  const fabricFacet = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of fabrics) {
      const name = (f.fabricName || "Fabric").toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [fabrics]);

  // 2. Warp colors available for selected fabrics
  const warpFacet = useMemo(() => {
    const counts: Record<string, number> = {};
    const pool =
      selectedFabrics.length === 0
        ? fabrics
        : fabrics.filter((f) => selectedFabrics.includes((f.fabricName || "").toLowerCase()));

    for (const f of pool) {
      const warp = (f.warpColor || "Natural").toLowerCase();
      counts[warp] = (counts[warp] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [fabrics, selectedFabrics]);

  // 3. Weft colors available for selected fabrics & warp choices
  const weftFacet = useMemo(() => {
    const counts: Record<string, number> = {};
    let pool =
      selectedFabrics.length === 0
        ? fabrics
        : fabrics.filter((f) => selectedFabrics.includes((f.fabricName || "").toLowerCase()));

    if (selectedWarps.length > 0) {
      pool = pool.filter((f) => selectedWarps.includes((f.warpColor || "").toLowerCase()));
    }

    for (const f of pool) {
      const weft = (f.weftColor || "Natural").toLowerCase();
      counts[weft] = (counts[weft] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [fabrics, selectedFabrics, selectedWarps]);

  // Toggle helpers
  const toggleFabric = (name: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const toggleWarp = (name: string) => {
    setSelectedWarps((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const toggleWeft = (name: string) => {
    setSelectedWefts((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const clearAllFilters = () => {
    setSelectedFabrics([]);
    setSelectedWarps([]);
    setSelectedWefts([]);
    setSearch("");
  };

  // Filtered fabrics for the catalog grid
  const filteredFabrics = useMemo(() => {
    return fabrics.filter((f) => {
      const fname = (f.fabricName || "").toLowerCase();
      const warp = (f.warpColor || "").toLowerCase();
      const weft = (f.weftColor || "").toLowerCase();
      const design = (f.design || "").toLowerCase();
      const sku = (f.sku || "").toLowerCase();

      if (selectedFabrics.length > 0 && !selectedFabrics.includes(fname)) {
        return false;
      }
      if (selectedWarps.length > 0 && !selectedWarps.includes(warp)) {
        return false;
      }
      if (selectedWefts.length > 0 && !selectedWefts.includes(weft)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          fname.includes(q) ||
          warp.includes(q) ||
          weft.includes(q) ||
          design.includes(q) ||
          sku.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [fabrics, selectedFabrics, selectedWarps, selectedWefts, search]);

  const hasActiveFilters =
    selectedFabrics.length > 0 ||
    selectedWarps.length > 0 ||
    selectedWefts.length > 0 ||
    Boolean(search.trim());

  return (
    <div className="merchant-catalog-layout">
      {/* ── Left Filter Sidebar (Image 6) ── */}
      <aside className="merchant-filter-card">
        <div className="merchant-filter-header">
          <h2 className="merchant-filter-title">Filter</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="merchant-filter-clear-btn"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Step 1: Fabric */}
        <div className="merchant-filter-group">
          <span className="merchant-filter-group-label">1 · FABRIC</span>
          {fabricFacet.map((f) => {
            const isChecked = selectedFabrics.includes(f.name);
            return (
              <label
                key={f.name}
                className={`merchant-filter-option ${isChecked ? "selected" : ""}`}
              >
                <div className="merchant-filter-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFabric(f.name)}
                    className="merchant-filter-checkbox"
                  />
                  <span>{f.name}</span>
                </div>
                <span className="merchant-filter-count">{f.count}</span>
              </label>
            );
          })}
        </div>

        {/* Step 2: Warp */}
        <div className="merchant-filter-group">
          <span className="merchant-filter-group-label">2 · WARP · ዋርፍ</span>
          {warpFacet.map((w) => {
            const isChecked = selectedWarps.includes(w.name);
            return (
              <label
                key={w.name}
                className={`merchant-filter-option ${isChecked ? "selected" : ""}`}
              >
                <div className="merchant-filter-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleWarp(w.name)}
                    className="merchant-filter-checkbox"
                  />
                  <span>{w.name}</span>
                </div>
                <span className="merchant-filter-count">{w.count}</span>
              </label>
            );
          })}
          <p className="merchant-filter-subtext">Colors available for your fabric</p>
        </div>

        {/* Step 3: Weft */}
        <div className="merchant-filter-group">
          <span className="merchant-filter-group-label">3 · WEFT · ሸፋ</span>
          {weftFacet.map((w) => {
            const isChecked = selectedWefts.includes(w.name);
            return (
              <label
                key={w.name}
                className={`merchant-filter-option ${isChecked ? "selected" : ""}`}
              >
                <div className="merchant-filter-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleWeft(w.name)}
                    className="merchant-filter-checkbox"
                  />
                  <span>{w.name}</span>
                </div>
                <span className="merchant-filter-count">{w.count}</span>
              </label>
            );
          })}
          <p className="merchant-filter-subtext">Colors available for your choices</p>
        </div>
      </aside>

      {/* ── Right Content Area (Image 6) ── */}
      <section className="merchant-content-area">
        {/* Header Title & Count */}
        <div className="merchant-content-header">
          <h1 className="merchant-page-title">Fabrics · የሚገኙ ጨርቆች</h1>
          <span className="merchant-page-count">
            {filteredFabrics.length} of {fabrics.length} fabrics
          </span>
        </div>

        {/* Search Bar */}
        <div className="merchant-search-input-wrap">
          <span className="merchant-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by fabric, color or pattern"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="merchant-search-input"
          />
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="merchant-active-chips">
            {selectedFabrics.map((f) => (
              <span key={f} className="merchant-filter-chip">
                <span>Fabric: {f}</span>
                <button
                  type="button"
                  onClick={() => toggleFabric(f)}
                  className="merchant-chip-remove"
                >
                  ✕
                </button>
              </span>
            ))}

            {selectedWarps.map((w) => (
              <span key={w} className="merchant-filter-chip">
                <span>Warp: {w}</span>
                <button
                  type="button"
                  onClick={() => toggleWarp(w)}
                  className="merchant-chip-remove"
                >
                  ✕
                </button>
              </span>
            ))}

            {selectedWefts.map((w) => (
              <span key={w} className="merchant-filter-chip">
                <span>Weft: {w}</span>
                <button
                  type="button"
                  onClick={() => toggleWeft(w)}
                  className="merchant-chip-remove"
                >
                  ✕
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={clearAllFilters}
              className="merchant-filter-clear-btn"
              style={{ marginLeft: "0.25rem" }}
            >
              Clear all
            </button>
          </div>
        )}

        {error && (
          <div className="error-msg">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Fabrics Grid */}
        {loading ? (
          <div className="loading" style={{ padding: "4rem 1rem", textAlign: "center" }}>
            <span>⏳</span> Loading fabrics catalog…
          </div>
        ) : filteredFabrics.length === 0 ? (
          <div
            className="merchant-filter-card"
            style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)" }}
          >
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🧣</span>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "var(--text)" }}>
              No fabrics match your selected filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "0.75rem" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="merchant-fabrics-grid">
            {filteredFabrics.map((f) => {
              const fname = (f.fabricName || "fabric").toLowerCase();
              const warp = (f.warpColor || "natural").toLowerCase();
              const weft = (f.weftColor || "natural").toLowerCase();
              const design = (f.design || "standard").toLowerCase();
              const patternType = derivePattern(design);

              const title = `${fname} · ${warp} · ${design}`;
              const patternDesc = `Pattern ${design} · warp ${warp} / weft ${weft}`;
              const specs = `${f.standardWeightG ?? 64} g · ${f.standardLengthCm ?? 240} × ${
                f.standardWidthCm ?? 150
              } cm`;
              const priceNum = Math.round(Number(f.sellingPrice) || 0);

              return (
                <div key={f.fabricVariantId} className="merchant-fabric-card">
                  <div className={`merchant-fabric-swatch swatch-${patternType}`} />
                  <div className="merchant-fabric-body">
                    <h3 className="merchant-fabric-card-title">{title}</h3>
                    <p className="merchant-fabric-card-pattern">{patternDesc}</p>
                    <span className="merchant-fabric-specs-pill">{specs}</span>

                    <div className="merchant-fabric-price-row">
                      <span className="merchant-fabric-price-amount">
                        {priceNum > 0 ? priceNum.toLocaleString() : "—"}
                      </span>
                      <span className="merchant-fabric-price-unit">ETB per piece</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        <p className="merchant-catalog-footer">
          Each choice narrows the next one, so you only see colors that exist. Official selling prices.
        </p>
      </section>
    </div>
  );
}

export default MerchantFabricsPage;
