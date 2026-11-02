import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { checkHealth, workOrdersApi } from "../api";

export function DashboardPage() {
  const [apiStatus, setApiStatus] = useState<"ok" | "down" | "checking">("checking");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus("ok"))
      .catch(() => setApiStatus("down"));

    Promise.all([
      workOrdersApi.list({ status: "assigned" }),
      workOrdersApi.list({ status: "in_progress" }),
      workOrdersApi.list({ status: "returned" }),
      workOrdersApi.list({ status: "reconciled" }),
    ])
      .then(([assigned, inProgress, returned, reconciled]) => {
        setCounts({
          assigned: assigned.length,
          in_progress: inProgress.length,
          returned: returned.length,
          reconciled: reconciled.length,
        });
      })
      .catch(() => setCounts({}))
      .finally(() => setLoading(false));
  }, []);

  const totalActive = (counts.assigned ?? 0) + (counts.in_progress ?? 0);
  const totalCompleted = (counts.returned ?? 0) + (counts.reconciled ?? 0);

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <p className="eyebrow">ዳሽቦርድ / Overview</p>
          <h1 className="page-title">Cooperative Production Dashboard</h1>
          <p className="page-subtitle">
            Real-time status of artisan work orders (Zigs), inventory flow, and settlement pipeline.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            className="card card-sm"
            style={{
              padding: "0.45rem 0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--surface)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: apiStatus === "ok" ? "var(--green)" : apiStatus === "down" ? "var(--red)" : "var(--amber)",
                display: "inline-block",
                boxShadow: apiStatus === "ok" ? "0 0 8px var(--green)" : "none",
              }}
            />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
              API: {apiStatus === "ok" ? "Connected" : apiStatus === "down" ? "Unreachable" : "Checking…"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div className="stats-row">
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">Assigned / ተመድቧል</span>
            <span style={{ fontSize: "20px" }}>📋</span>
          </div>
          <div className="stat-card-value" style={{ color: "#7C3AED" }}>
            {loading ? "…" : counts.assigned ?? 0}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Zigs issued, awaiting loom setup
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">In Progress / በሂደት</span>
            <span style={{ fontSize: "20px" }}>🧵</span>
          </div>
          <div className="stat-card-value" style={{ color: "#D97706" }}>
            {loading ? "…" : counts.in_progress ?? 0}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Currently being handwoven
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">Returned / ተመለሰ</span>
            <span style={{ fontSize: "20px" }}>🪢</span>
          </div>
          <div className="stat-card-value" style={{ color: "#2563EB" }}>
            {loading ? "…" : counts.returned ?? 0}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Fabric delivered, ready for settlement
          </span>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="stat-card-label">Reconciled / ተሰማረ</span>
            <span style={{ fontSize: "20px" }}>✅</span>
          </div>
          <div className="stat-card-value" style={{ color: "#059669" }}>
            {loading ? "…" : counts.reconciled ?? 0}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Fully settled and paid out
          </span>
        </div>
      </div>

      {/* ── Quick Action Command Center ── */}
      <div style={{ marginTop: "1rem" }}>
        <h2 className="section-title">
          <span>⚡</span> Quick Operational Actions / ፈጣን እርምጃዎች
        </h2>

        <div className="txn-action-cards">
          <Link to="/admin/weavers" className="txn-action-card">
            <div className="txn-action-icon">🧑‍🤝‍🧑</div>
            <p className="txn-action-title">Weaver Management / አሸጋዮች</p>
            <p className="txn-action-desc">
              Browse artisan roster, review active work orders, or assign a new Zig.
            </p>
          </Link>

          <Link to="/admin/stock" className="txn-action-card">
            <div className="txn-action-icon">📦</div>
            <p className="txn-action-title">Stock Inventory / ስቶክ</p>
            <p className="txn-action-desc">
              Monitor on-hand yarn cone kilos and finished fabric pieces with low-stock alerts.
            </p>
          </Link>

          <Link to="/admin/transactions/new" className="txn-action-card">
            <div className="txn-action-icon">🔄</div>
            <p className="txn-action-title">Commercial Transactions / ግብይት</p>
            <p className="txn-action-desc">
              Record yarn procurement from suppliers or bulk fabric sales to merchants.
            </p>
          </Link>

          <Link to="/admin/settlement" className="txn-action-card">
            <div className="txn-action-icon">💳</div>
            <p className="txn-action-title">Weaver Settlement & Payroll / ሂሳብ</p>
            <p className="txn-action-desc">
              Generate batch payroll calculations, inspect master summary, and record official payments.
            </p>
          </Link>
        </div>
      </div>

      {/* ── Pipeline Health Bar ── */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            <span>📊</span> Production Pipeline Summary
          </h3>
          <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            {totalActive} Active on Loom &nbsp;·&nbsp; {totalCompleted} Delivered & Settled
          </span>
        </div>

        <div style={{ display: "flex", height: "10px", borderRadius: "999px", overflow: "hidden", background: "var(--bg-subtle)", gap: "2px" }}>
          <div
            title={`Assigned: ${counts.assigned ?? 0}`}
            style={{
              flex: counts.assigned ? counts.assigned : 1,
              background: "#7C3AED",
              borderRadius: "999px 0 0 999px",
            }}
          />
          <div
            title={`In Progress: ${counts.in_progress ?? 0}`}
            style={{
              flex: counts.in_progress ? counts.in_progress : 1,
              background: "#D97706",
            }}
          />
          <div
            title={`Returned: ${counts.returned ?? 0}`}
            style={{
              flex: counts.returned ? counts.returned : 1,
              background: "#2563EB",
            }}
          />
          <div
            title={`Reconciled: ${counts.reconciled ?? 0}`}
            style={{
              flex: counts.reconciled ? counts.reconciled : 1,
              background: "#059669",
              borderRadius: "0 999px 999px 0",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginTop: "1rem", fontSize: "12.5px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} /> Assigned
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706" }} /> In Progress
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB" }} /> Returned
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} /> Reconciled
          </span>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
