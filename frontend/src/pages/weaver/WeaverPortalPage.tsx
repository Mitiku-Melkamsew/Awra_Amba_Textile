import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { weaverPortalService } from "../../infrastructure/services";
import type { Weaver } from "../../domain/models";
import { WeaverZigTabs } from "../../components/WeaverZigTabs";

export function WeaverPortalPage() {
  const { user } = useAuth();
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    weaverPortalService
      .getProfile()
      .then((data) => {
        setWeaver(data);
        setError("");
      })
      .catch((err) => {
        // Fallback: construct from user if profile endpoint returns 404 or other error
        if (user) {
          const parts = (user.fullName || user.username).split(" ");
          setWeaver({
            weaverId: user.weaverId ?? user.userId,
            firstName: parts[0] || user.username,
            lastName: parts.slice(1).join(" ") || "",
            fullName: user.fullName || user.username,
            phone: null,
            email: null,
            bankAccountNumber: null,
          });
        } else {
          setError(err.message || "Failed to load weaver profile");
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="page" style={{ padding: "3rem", textAlign: "center" }}>
        <div className="loading"><span>⏳</span> Loading your artisan workspace…</div>
      </div>
    );
  }

  if (!weaver && error) {
    return (
      <div className="page" style={{ padding: "2rem" }}>
        <div className="error-msg" style={{ background: "#fee2e2", color: "#b91c1c", padding: "1rem", borderRadius: "6px" }}>
          <span>⚠️</span> {error}
        </div>
      </div>
    );
  }

  if (!weaver) {
    return (
      <div className="page" style={{ padding: "2rem" }}>
        <div className="error-msg">Artisan workspace profile not found.</div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: "1.5rem" }}>
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
          borderRadius: "12px",
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
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          <span>💳</span> View Settlement History / የክፍያ ታሪክ →
        </Link>
      </div>

      <WeaverZigTabs weaver={weaver as any} zigLinkPrefix="/weaver/zigs" />
    </div>
  );
}

export default WeaverPortalPage;
