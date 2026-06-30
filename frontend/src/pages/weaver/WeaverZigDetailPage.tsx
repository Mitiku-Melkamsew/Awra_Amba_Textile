import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { weaverPortalApi } from "../../api";
import type { WorkOrderDetail } from "../../api";
import { ZigDetailView } from "../../components/ZigDetailView";

export function WeaverZigDetailPage() {
  const { zigId } = useParams<{ zigId: string }>();
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!zigId) return;
    setOrder(await weaverPortalApi.workOrder(zigId));
  }, [zigId]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  if (!order && !error) return <p className="muted">Loading...</p>;
  if (!order) return <p className="error">{error}</p>;

  return (
    <section className="weaver-page">
      <p>
        <Link to="/weaver">← My work orders</Link>
      </p>
      <ZigDetailView
        order={order}
        readOnly
        backLink="/weaver"
        onRefresh={() => load().catch((err) => setError(err.message))}
      />
    </section>
  );
}