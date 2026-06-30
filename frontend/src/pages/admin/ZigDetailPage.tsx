import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { workOrdersApi } from "../../api";
import type { WorkOrderDetail } from "../../api";
import { ZigDetailView } from "../../components/ZigDetailView";

export function ZigDetailPage() {
  const { zigId } = useParams<{ zigId: string }>();
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!zigId) return;
    setOrder(await workOrdersApi.get(zigId));
  }, [zigId]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  if (!order && !error) return <p className="muted">Loading...</p>;
  if (!order) return <p className="error">{error}</p>;

  const backLink =
    order.weaverId != null ? `/admin/weavers/${order.weaverId}` : "/admin/weavers";

  return (
    <ZigDetailView
      order={order}
      backLink={backLink}
      onRefresh={() => load().catch((err) => setError(err.message))}
    />
  );
}