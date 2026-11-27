import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { weaverPortalApi } from "../../api";
import { fabricVariantName } from "../../utils/variantNames";

export function WeaverPortalPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      weaverPortalApi.profile().catch(() => null),
      weaverPortalApi.workOrders().catch(() => []),
      weaverPortalApi.payments().catch(() => []),
    ])
      .then(([prof, wos, pays]) => {
        setProfile(prof || user);
        setWorkOrders(wos || []);
        setPayments(pays || []);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load weaver data"))
      .finally(() => setLoading(false));
  }, [user]);

  // Status counts
  const awaitingPaymentCount = useMemo(() => {
    return workOrders.filter((wo) => {
      const s = String(wo.status || "").toLowerCase();
      return s === "returned";
    }).length;
  }, [workOrders]);

  const inProgressCount = useMemo(() => {
    return workOrders.filter((wo) => {
      const s = String(wo.status || "").toLowerCase();
      return s === "in_progress" || s === "assigned";
    }).length;
  }, [workOrders]);

  const totalZigsCount = workOrders.length;
  const pastPaymentsCount = payments.length;

  const displayName = profile?.fullName || user?.fullName || user?.username || "Weaver 01";

  if (loading) {
    return (
      <div className="loading" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <span>⏳</span> Loading your workspace…
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Header (Image 7) ── */}
      <div className="weaver-page-header">
        <p className="weaver-eyebrow">አውራ አምባ ሸማኔ</p>
        <h1 className="weaver-page-title">Welcome back, {displayName}</h1>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: "1.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Highlight Card: Awaiting Payment (Image 7) ── */}
      <Link to="/weaver/zigs?status=returned" className="weaver-hero-card">
        <div className="weaver-hero-eyebrow">Awaiting payment</div>
        <div className="weaver-hero-amount">{awaitingPaymentCount} zigs</div>
        <p className="weaver-hero-sub">Fabric returned, waiting to be settled</p>
      </Link>

      {/* ── 3-Column Stats Grid (Image 7) ── */}
      <div className="weaver-stats-grid">
        <div className="weaver-stat-card">
          <div className="weaver-stat-label">Total zigs</div>
          <div className="weaver-stat-value">{totalZigsCount}</div>
        </div>

        <div className="weaver-stat-card">
          <div className="weaver-stat-label">In progress</div>
          <div className="weaver-stat-value">{inProgressCount}</div>
        </div>

        <div className="weaver-stat-card">
          <div className="weaver-stat-label">Past payments</div>
          <div className="weaver-stat-value">{pastPaymentsCount}</div>
        </div>
      </div>

      {/* ── Quick Links / Recent Jobs Section ── */}
      <div style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
            Recent Active Jobs / የቅርብ ጊዜ ዝግ
          </h2>
          <Link
            to="/weaver/zigs"
            style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--brand, #C2410C)", textDecoration: "none" }}
          >
            View all zigs →
          </Link>
        </div>

        {workOrders.length === 0 ? (
          <div className="weaver-stat-card" style={{ textAlign: "center", padding: "2.5rem 1.5rem", color: "var(--text-muted)" }}>
            <span style={{ fontSize: "1.75rem", display: "block", marginBottom: "0.5rem" }}>🧵</span>
            No work orders assigned yet.
          </div>
        ) : (
          <div className="weaver-zigs-list">
            {workOrders.slice(0, 3).map((wo) => {
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
                    <span className="weaver-zig-card-id">{wo.zigId}</span>
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
    </div>
  );
}

export default WeaverPortalPage;
