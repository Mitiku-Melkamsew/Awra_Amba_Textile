import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { catalogApi, weaversApi, workOrdersApi } from "../api";
import type { FabricVariant, Weaver, WorkOrder } from "../api";

export function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [variants, setVariants] = useState<FabricVariant[]>([]);
  const [zigId, setZigId] = useState("z-501");
  const [weaverId, setWeaverId] = useState("");
  const [fabricVariantId, setFabricVariantId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [orders, weaverList, variantList] = await Promise.all([
      workOrdersApi.list(),
      weaversApi.list(),
      catalogApi.fabricVariants(),
    ]);
    setWorkOrders(orders);
    setWeavers(weaverList);
    setVariants(variantList);
    if (!weaverId && weaverList[0]) setWeaverId(String(weaverList[0].weaverId));
    if (!fabricVariantId && variantList[0]) {
      setFabricVariantId(String(variantList[0].fabricVariantId));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await workOrdersApi.create({
        zigId,
        weaverId: Number(weaverId),
        fabricVariantId: Number(fabricVariantId),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create work order");
    }
  }

  async function markReturned(zig: string) {
    setError("");
    try {
      await workOrdersApi.updateStatus(zig, "returned");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <section>
      <h2>Work Orders (Zigs)</h2>
      <div className="grid">
        <form className="card form" onSubmit={handleCreate}>
          <h3>Create Work Order</h3>
          <label>
            Zig ID
            <input value={zigId} onChange={(e) => setZigId(e.target.value)} required />
          </label>
          <label>
            Weaver
            <select value={weaverId} onChange={(e) => setWeaverId(e.target.value)}>
              {weavers.map((weaver) => (
                <option key={weaver.weaverId} value={weaver.weaverId}>
                  {weaver.firstName} {weaver.lastName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fabric variant
            <select
              value={fabricVariantId}
              onChange={(e) => setFabricVariantId(e.target.value)}
            >
              {variants.map((variant) => (
                <option key={variant.fabricVariantId} value={variant.fabricVariantId}>
                  {variant.product.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Create</button>
        </form>

        <div className="card table-card">
          <h3>All Work Orders</h3>
          <table>
            <thead>
              <tr>
                <th>Zig</th>
                <th>Weaver</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((order) => (
                <tr key={order.zigId}>
                  <td>{order.zigId}</td>
                  <td>
                    {order.weaver.firstName} {order.weaver.lastName}
                  </td>
                  <td>
                    <span className={`badge ${order.status}`}>{order.status}</span>
                  </td>
                  <td className="button-row">
                    <Link to={`/work-orders/${order.zigId}`}>Open</Link>
                    {order.status === "in_progress" && (
                      <button type="button" onClick={() => markReturned(order.zigId)}>
                        Mark Returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}