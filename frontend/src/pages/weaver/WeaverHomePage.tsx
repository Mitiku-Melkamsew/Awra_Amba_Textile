import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { weaverPortalApi } from "../../api";

export function WeaverHomePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ firstName: string; lastName: string; phone: string | null } | null>(null);
  const [stats, setStats] = useState({ zigs: 0, inProgress: 0, returned: 0, payments: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.weaverId) return;
    Promise.all([
      weaverPortalApi.profile(user.weaverId),
      weaverPortalApi.workOrders(),
      weaverPortalApi.payments(),
    ])
      .then(([weaver, zigs, payments]) => {
        setProfile(weaver);
        setStats({
          zigs: zigs.length,
          inProgress: zigs.filter((z) => z.status === "in_progress" || z.status === "assigned").length,
          returned: zigs.filter((z) => z.status === "returned").length,
          payments: payments.length,
        });
      })
      .catch((err) => setError(err.message));
  }, [user?.weaverId]);

  return (
    <section className="weaver-page">
      <header className="weaver-hero">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>
            {profile ? `${profile.firstName} ${profile.lastName}` : "Loading..."}
          </h2>
          <p className="muted">
            View your work orders, fabric returns, and payment history.
          </p>
        </div>
        {profile?.phone && <span className="weaver-pill">{profile.phone}</span>}
      </header>

      <div className="stats weaver-stats">
        <div className="stat-card">
          <span>Total Zigs</span>
          <strong>{stats.zigs}</strong>
        </div>
        <div className="stat-card">
          <span>In Progress</span>
          <strong>{stats.inProgress}</strong>
        </div>
        <div className="stat-card">
          <span>Awaiting Payment</span>
          <strong>{stats.returned}</strong>
        </div>
        <div className="stat-card">
          <span>Past Payments</span>
          <strong>{stats.payments}</strong>
        </div>
      </div>

      <div className="weaver-quick-links">
        <Link className="weaver-card-link" to="/weaver/zigs">
          <h3>My Zigs</h3>
          <p>Track yarn received and fabric returned per job.</p>
        </Link>
        <Link className="weaver-card-link" to="/weaver/payments">
          <h3>Payment History</h3>
          <p>See settled amounts and download your HISAB report.</p>
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}