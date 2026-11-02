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

  if (!weaver && !error) {
    return (
      <div className="page">
        <div className="loading"><span>⏳</span> Loading your artisan workspace…</div>
      </div>
    );
  }

  if (!weaver) {
    return (
      <div className="page">
        <div className="error-msg"><span>⚠️</span> {error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ── Weaver Welcome Banner ── */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #062E22 0%, #0F4A39 100%)",
          color: "#fff",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          padding: "1.5rem 1.75rem",
          boxShadow: "0 10px 25px -5px rgba(6, 46, 34, 0.4)",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(110,231,175,0.18)", color: "#6EE7B7", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "11.5px", fontWeight: 700, marginBottom: "0.5rem" }}>
            <span>🇪🇹</span> አውራ አምባ ሸማኔ / Cooperative Weaver
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px", color: "#FFFFFF" }}>
            Welcome, {weaver.firstName} {weaver.lastName}
          </h1>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#A7F3D0" }}>
            Review your active work orders (Zigs), track returned fabrics, and verify your earnings.
          </p>
        </div>

        <Link
          to="/weaver/payments"
          className="btn-primary"
          style={{
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
            padding: "0.65rem 1.25rem",
          }}
        >
          <span>💳</span> View Settlement History / የክፍያ ታሪክ →
        </Link>
      </div>

      <WeaverZigTabs weaver={weaver} zigLinkPrefix="/weaver/zigs" />
    </div>
  );
}

export default WeaverPortalPage;
