import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { weaverPortalApi } from "../../api";
import type { Weaver } from "../../api";
import { WeaverZigTabs } from "../../components/WeaverZigTabs";

export function WeaverPortalPage() {
  const { user } = useAuth();
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.weaverId) return;
    weaverPortalApi
      .profile(user.weaverId)
      .then(setWeaver)
      .catch((err) => setError(err.message));
  }, [user?.weaverId]);

  if (!weaver && !error) return <p className="muted">Loading...</p>;
  if (!weaver) return <p className="error">{error}</p>;

  return (
    <section className="weaver-page">
      <div className="weaver-quick-links" style={{ marginBottom: "1rem" }}>
        <Link className="weaver-card-link" to="/weaver/payments">
          <h3>Payment History</h3>
          <p>See settled amounts and download your HISAB report.</p>
        </Link>
      </div>
      <WeaverZigTabs weaver={weaver} zigLinkPrefix="/weaver/zigs" />
    </section>
  );
}