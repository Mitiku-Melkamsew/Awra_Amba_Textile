import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { weaversApi } from "../../api";
import type { Weaver } from "../../api";
import { WeaverZigTabs } from "../../components/WeaverZigTabs";

export function WeaverProfilePage() {
  const { weaverId } = useParams<{ weaverId: string }>();
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!weaverId) return;
    weaversApi
      .get(Number(weaverId))
      .then(setWeaver)
      .catch((err) => setError(err.message));
  }, [weaverId]);

  if (!weaver && !error) return (
    <div className="page">
      <p className="muted" style={{ fontSize: 13 }}>Loading weaver…</p>
    </div>
  );

  if (!weaver) return (
    <div className="page">
      <div className="error-msg"><span>⚠️</span> {error}</div>
    </div>
  );

  return (
    <div className="page">
      <Link to="/admin/weavers" className="back-link">← All Weavers</Link>
      <WeaverZigTabs
        weaver={weaver}
        zigLinkPrefix="/admin/zigs"
        issueZigLink={`/admin/weavers/${weaver.weaverId}/issue-zig`}
      />
    </div>
  );
}