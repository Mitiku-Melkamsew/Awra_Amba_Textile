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

  if (!weaver && !error) return <p className="muted">Loading...</p>;
  if (!weaver) return <p className="error">{error}</p>;

  return (
    <section>
      <p>
        <Link to="/admin/weavers">← All weavers</Link>
      </p>
      <WeaverZigTabs
        weaver={weaver}
        zigLinkPrefix="/admin/zigs"
        issueZigLink={`/admin/weavers/${weaver.weaverId}/issue-zig`}
      />
    </section>
  );
}