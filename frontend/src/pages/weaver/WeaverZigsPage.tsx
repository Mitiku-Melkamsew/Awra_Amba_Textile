import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { weaverPortalApi } from "../../api";
import { fabricVariantName } from "../../utils/variantNames";

type FilterTab = "all" | "open" | "returned" | "paid";

export function WeaverZigsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get("status") || "all").toLowerCase() as FilterTab;

  const [filter, setFilter] = useState<FilterTab>(
    initialFilter === "returned" || initialFilter === "open" || initialFilter === "paid"
      ? initialFilter
      : "all"
  );
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    weaverPortalApi
      .workOrders()
      .then((data) => {
        setWorkOrders(data || []);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load work orders"))
      .finally(() => setLoading(false));
  }, []);

  const handleTabChange = (tab: FilterTab) => {
    setFilter(tab);
    if (tab === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", tab);
    }
    setSearchParams(searchParams);
  };

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const s = String(wo.status || "").toLowerCase();
      if (filter === "all") return true;
      if (filter === "open") return s === "in_progress" || s === "assigned";
      if (filter === "returned") return s === "returned";
      if (filter === "paid") return s === "reconciled" || s === "paid";
      return true;
    });
  }, [workOrders, filter]);

  return (
    <div>
      {/* ── Page Header (Image 5) ── */}
      <div className="weaver-page-header">
        <h1 className="weaver-page-title">My zigs · ዝግ</h1>
        <p className="weaver-page-subtitle">Read-only view of your jobs</p>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1.25rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Filter Pills: All | Open | Returned | Paid (Image 5) ── */}
      <div className="weaver-filter-pills">
        <button
          type="button"
          onClick={() => handleTabChange("all")}
          className={`weaver-filter-pill ${filter === "all" ? "active" : ""}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("open")}
          className={`weaver-filter-pill ${filter === "open" ? "active" : ""}`}
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("returned")}
          className={`weaver-filter-pill ${filter === "returned" ? "active" : ""}`}
        >
          Returned
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("paid")}
          className={`weaver-filter-pill ${filter === "paid" ? "active" : ""}`}
        >
          Paid
        </button>
      </div>

      {/* ── Work Order Cards List (Image 5) ── */}
      {loading ? (
        <div className="loading" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <span>⏳</span> Loading your zigs…
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="weaver-stat-card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🧵</span>
          <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "var(--text)" }}>No zigs found in this category.</p>
          <span style={{ fontSize: "0.85rem" }}>When the cooperative assigns jobs to you, they will appear here.</span>
        </div>
      ) : (
        <div className="weaver-zigs-list">
          {filteredOrders.map((wo) => {
            const s = String(wo.status || "").toLowerCase();
            const badgeClass =
              s === "in_progress"
                ? "weaver-status-in_progress"
                : s === "returned"
                ? "weaver-status-returned"
                : s === "reconciled" || s === "paid"
                ? "weaver-status-paid"
                : "weaver-status-assigned";

            const badgeLabel =
              s === "in_progress"
                ? "In progress"
                : s === "returned"
                ? "Returned"
                : s === "reconciled" || s === "paid"
                ? "✓ Paid"
                : "Assigned";

            const fabricTitle = wo.fabricVariant
              ? fabricVariantName(wo.fabricVariant)
              : wo.fabric?.name || "Standard Fabric";

            const yarnQty = (wo.yarnGiven || []).reduce(
              (sum: number, y: any) => sum + (parseFloat(String(y.quantity || 0)) || 0),
              0
            );
            const fabricPcs = (wo.fabricReturns || []).reduce(
              (sum: number, r: any) => sum + (parseInt(String(r.quantityReturned || 0), 10) || 0),
              0
            );

            return (
              <Link key={wo.zigId} to={`/weaver/zigs/${wo.zigId}`} className="weaver-zig-card">
                <div className="weaver-zig-card-header">
                  <span className="weaver-zig-card-id">[{wo.zigId}]</span>
                  <span className={`weaver-status-badge ${badgeClass}`}>{badgeLabel}</span>
                </div>
                <div className="weaver-zig-card-fabric">{fabricTitle}</div>
                <div className="weaver-zig-card-meta">
                  Yarn received {yarnQty > 0 ? `${yarnQty} pcs` : "—"} · Fabric returned {fabricPcs} pcs
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WeaverZigsPage;
