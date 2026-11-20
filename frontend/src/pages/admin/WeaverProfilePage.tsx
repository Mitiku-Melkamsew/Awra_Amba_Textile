import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { weaversApi } from "../../api";
import type { Weaver } from "../../api";
import { WeaverZigTabs } from "../../components/WeaverZigTabs";

export function WeaverProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const id = Number(userId);
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [error, setError] = useState("");

  const loadWeaver = useCallback(() => {
    if (!id) return;
    weaversApi
      .get(id)
      .then(setWeaver)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    loadWeaver();
  }, [loadWeaver]);

  if (!weaver && !error)
    return (
      <div style={{ width: "100%", padding: "2rem", color: "#64748b" }}>
        Loading weaver profile…
      </div>
    );

  if (!weaver)
    return (
      <div style={{ width: "100%", padding: "2rem" }}>
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "0.85rem",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error || "Weaver not found"}
        </div>
      </div>
    );

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem" }}>
      {/* Back Link (Image 3) */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to="/admin/weavers"
          style={{
            color: "var(--brand, #c2410c)",
            fontSize: "0.92rem",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          ‹ Weavers
        </Link>
      </div>

      <WeaverZigTabs
        weaver={weaver}
        zigLinkPrefix="/admin/zigs"
        issueZigLink={`/admin/weavers/${weaver.userId}/issue-zig`}
        onWeaverUpdated={loadWeaver}
      />
    </div>
  );
}

export default WeaverProfilePage;
