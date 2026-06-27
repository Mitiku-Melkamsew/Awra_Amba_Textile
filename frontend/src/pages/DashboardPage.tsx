import { useEffect, useState } from "react";
import { checkHealth, workOrdersApi } from "../api";

export function DashboardPage() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [counts, setCounts] = useState<Record<string, number>>({});

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
      .catch(() => setCounts({}));
  }, []);

  return (
    <section>
      <h2>Dashboard</h2>
      <p className="muted">Overview of production and settlement workflow.</p>

      <div className="stats">
        <div className="stat-card">
          <span>API</span>
          <strong className={apiStatus}>{apiStatus}</strong>
        </div>
        <div className="stat-card">
          <span>Assigned</span>
          <strong>{counts.assigned ?? "-"}</strong>
        </div>
        <div className="stat-card">
          <span>In Progress</span>
          <strong>{counts.in_progress ?? "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Returned</span>
          <strong>{counts.returned ?? "-"}</strong>
        </div>
        <div className="stat-card">
          <span>Reconciled</span>
          <strong>{counts.reconciled ?? "-"}</strong>
        </div>
      </div>
    </section>
  );
}