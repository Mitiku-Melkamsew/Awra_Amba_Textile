import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  catalogApi,
  fabricReturnsApi,
  workOrdersApi,
  yarnGivenApi,
} from "../api";

interface YarnVariant {
  yarnVariantId: number;
  sku: string;
  basePrice: string | null;
}

interface WorkOrderDetail {
  zigId: string;
  status: string;
  weaver: { firstName: string; lastName: string };
  fabricVariant: { product: { name: string }; fabricVariantId: number; basePrice: string | null };
  yarnGiven: Array<{
    yarnGivenId: number;
    quantity: string;
    unitPrice: string;
    yarnVariant: { sku: string };
  }>;
  fabricReturns: Array<{
    returnId: number;
    quantityReturned: number;
    totalWeight: string;
    unitPrice: string;
    fabricVariant: { product: { name: string } };
  }>;
}

export function WorkOrderDetailPage() {
  const { zigId } = useParams<{ zigId: string }>();
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [yarnVariants, setYarnVariants] = useState<YarnVariant[]>([]);
  const [fabricVariants, setFabricVariants] = useState<
    Array<{ fabricVariantId: number; product: { name: string }; basePrice: string | null }>
  >([]);
  const [yarnVariantId, setYarnVariantId] = useState("");
  const [yarnQty, setYarnQty] = useState("110");
  const [yarnPrice, setYarnPrice] = useState("400");
  const [fabricVariantId, setFabricVariantId] = useState("");
  const [fabricQty, setFabricQty] = useState("40");
  const [totalWeight, setTotalWeight] = useState("2560");
  const [fabricPrice, setFabricPrice] = useState("1300");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!zigId) return;
    const [detail, yarns, fabrics] = await Promise.all([
      workOrdersApi.get(zigId) as Promise<WorkOrderDetail>,
      catalogApi.yarnVariants() as Promise<YarnVariant[]>,
      catalogApi.fabricVariants(),
    ]);
    setOrder(detail);
    setYarnVariants(yarns);
    setFabricVariants(fabrics);
    if (!yarnVariantId && yarns[0]) setYarnVariantId(String(yarns[0].yarnVariantId));
    if (!fabricVariantId) {
      setFabricVariantId(String(detail.fabricVariant.fabricVariantId));
      if (detail.fabricVariant.basePrice) {
        setFabricPrice(String(detail.fabricVariant.basePrice));
      }
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [zigId]);

  async function handleYarnSubmit(event: FormEvent) {
    event.preventDefault();
    if (!zigId) return;
    setError("");
    setMessage("");
    try {
      await yarnGivenApi.create({
        zigId,
        yarnVariantId: Number(yarnVariantId),
        quantity: Number(yarnQty),
        unitPrice: Number(yarnPrice),
      });
      setMessage("Yarn delivery recorded.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record yarn");
    }
  }

  async function handleFabricSubmit(event: FormEvent) {
    event.preventDefault();
    if (!zigId) return;
    setError("");
    setMessage("");
    try {
      await fabricReturnsApi.create({
        zigId,
        fabricVariantId: Number(fabricVariantId),
        quantityReturned: Number(fabricQty),
        totalWeight: Number(totalWeight),
        unitPrice: Number(fabricPrice),
      });
      setMessage("Fabric return recorded.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record fabric return");
    }
  }

  async function markReturned() {
    if (!zigId) return;
    setError("");
    try {
      await workOrdersApi.updateStatus(zigId, "returned");
      setMessage("Work order marked as returned.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  if (!order) return <p className="muted">Loading work order...</p>;

  return (
    <section>
      <p>
        <Link to="/work-orders">← Back to work orders</Link>
      </p>
      <h2>
        {order.zigId} — {order.weaver.firstName} {order.weaver.lastName}
      </h2>
      <p className="muted">
        Target fabric: {order.fabricVariant.product.name} | Status:{" "}
        <span className={`badge ${order.status}`}>{order.status}</span>
      </p>

      {order.status === "in_progress" && (
        <button type="button" onClick={markReturned}>
          Mark All Fabric Returned
        </button>
      )}

      <div className="grid" style={{ marginTop: "1rem" }}>
        <form className="card form" onSubmit={handleYarnSubmit}>
          <h3>Record Yarn Delivery</h3>
          <label>
            Yarn variant
            <select value={yarnVariantId} onChange={(e) => setYarnVariantId(e.target.value)}>
              {yarnVariants.map((variant) => (
                <option key={variant.yarnVariantId} value={variant.yarnVariantId}>
                  {variant.sku}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input value={yarnQty} onChange={(e) => setYarnQty(e.target.value)} />
          </label>
          <label>
            Unit price
            <input value={yarnPrice} onChange={(e) => setYarnPrice(e.target.value)} />
          </label>
          <button type="submit">Save Yarn Delivery</button>
        </form>

        <form className="card form" onSubmit={handleFabricSubmit}>
          <h3>Record Fabric Return</h3>
          <label>
            Fabric variant
            <select
              value={fabricVariantId}
              onChange={(e) => setFabricVariantId(e.target.value)}
            >
              {fabricVariants.map((variant) => (
                <option key={variant.fabricVariantId} value={variant.fabricVariantId}>
                  {variant.product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity (pieces)
            <input value={fabricQty} onChange={(e) => setFabricQty(e.target.value)} />
          </label>
          <label>
            Total weight (grams)
            <input value={totalWeight} onChange={(e) => setTotalWeight(e.target.value)} />
          </label>
          <label>
            Unit price
            <input value={fabricPrice} onChange={(e) => setFabricPrice(e.target.value)} />
          </label>
          <button type="submit">Save Fabric Return</button>
        </form>
      </div>

      <div className="grid" style={{ marginTop: "1rem" }}>
        <div className="card table-card">
          <h3>Yarn Deliveries ({order.yarnGiven.length})</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Yarn</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.yarnGiven.map((row) => (
                <tr key={row.yarnGivenId}>
                  <td>{row.yarnGivenId}</td>
                  <td>{row.yarnVariant.sku}</td>
                  <td>{row.quantity}</td>
                  <td>{row.unitPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card table-card">
          <h3>Fabric Returns ({order.fabricReturns.length})</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fabric</th>
                <th>Qty</th>
                <th>Weight</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.fabricReturns.map((row) => (
                <tr key={row.returnId}>
                  <td>{row.returnId}</td>
                  <td>{row.fabricVariant.product.name}</td>
                  <td>{row.quantityReturned}</td>
                  <td>{row.totalWeight}</td>
                  <td>{row.unitPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}