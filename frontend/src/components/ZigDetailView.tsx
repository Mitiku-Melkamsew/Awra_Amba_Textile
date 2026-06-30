import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { catalogApi, workOrdersApi, yarnGivenApi } from "../api";
import type { WorkOrderDetail } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";
import {
  createYarnLineDraft,
  parseYarnLines,
  type YarnCatalogLookup,
  type YarnLineDraft,
} from "../utils/yarnLines";
import { FabricReturnForm } from "./FabricReturnForm";
import { YarnLinesEditor } from "./YarnLinesEditor";

function variantLabel(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

interface ZigDetailViewProps {
  order: WorkOrderDetail;
  readOnly?: boolean;
  backLink: string;
  onRefresh: () => void;
}

export function ZigDetailView({
  order,
  readOnly = false,
  backLink,
  onRefresh,
}: ZigDetailViewProps) {
  const [yarnLookup, setYarnLookup] = useState<YarnCatalogLookup>({
    colors: [],
    suppliers: [],
    yarnTypes: [],
  });
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([createYarnLineDraft()]);
  const [yarnOpen, setYarnOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canEdit =
    !readOnly &&
    (order.status === "assigned" ||
      order.status === "in_progress" ||
      order.status === "returned");
  const canRecordFabric =
    !readOnly && (order.status === "in_progress" || order.status === "returned");

  useEffect(() => {
    if (!canEdit) return;
    catalogApi.lookup().then((data) => {
      setYarnLookup({
        colors: data.colors,
        suppliers: data.suppliers,
        yarnTypes: data.yarnTypes,
      });
      setYarnLines([createYarnLineDraft(data)]);
    });
  }, [canEdit]);

  async function handleYarnSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    const lines = parseYarnLines(yarnLines);
    if (lines.length === 0) {
      setError("Add at least one yarn line with quantity and unit price.");
      return;
    }
    try {
      const result = await yarnGivenApi.create({
        zigId: order.zigId,
        lines,
      });

      const created = result.variantResolved.filter((v) => v.created).length;
      const msg =
        created > 0
          ? `Recorded ${lines.length} yarn delivery(s). ${created} new variant(s) created.`
          : `Recorded ${lines.length} yarn delivery(s).`;
      setMessage(msg);
      setYarnLines([createYarnLineDraft(yarnLookup)]);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record yarn");
    }
  }

  async function markReturned() {
    setError("");
    try {
      await workOrdersApi.updateStatus(order.zigId, "returned");
      setMessage("Marked as returned.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function markInProgress() {
    setError("");
    try {
      await workOrdersApi.updateStatus(order.zigId, "in_progress");
      setMessage("Marked as in progress.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <section>
      <p>
        <Link to={backLink}>← Back</Link>
      </p>
      <header className="zig-detail-header">
        <div>
          <h2>{order.zigId}</h2>
          <p className="muted">
            {order.weaver.firstName} {order.weaver.lastName} · {order.fabricVariant.product.name}
            {order.fabricVariant.warpColor && ` · warp: ${order.fabricVariant.warpColor.name}`}
            {order.fabricVariant.weftColor && ` · weft: ${order.fabricVariant.weftColor.name}`}
            {order.fabricVariant.design && ` · ${order.fabricVariant.design.name}`}
          </p>
          <p className="muted">Issued: {formatDateDDMMYY(order.dateIssued)}</p>
        </div>
        <span className={`badge ${order.status}`}>{order.status}</span>
      </header>

      {!readOnly && order.status === "assigned" && (
        <button type="button" className="btn-secondary" onClick={markInProgress}>
          Start weaving (In Progress)
        </button>
      )}

      {!readOnly && order.status === "in_progress" && (
        <button type="button" className="btn-secondary" onClick={markReturned}>
          All fabric returned
        </button>
      )}

      {canRecordFabric && (
        <FabricReturnForm
          order={order}
          onSaved={(msg) => {
            setMessage(msg ?? "Fabric return recorded.");
            onRefresh();
          }}
        />
      )}

      {canEdit && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="collapse-toggle"
            onClick={() => setYarnOpen(!yarnOpen)}
          >
            {yarnOpen ? "▼" : "▶"} ጥጥ መስጠት / Record Yarn
          </button>
          {yarnOpen && (
            <form className="form" style={{ marginTop: "1rem" }} onSubmit={handleYarnSubmit}>
              <YarnLinesEditor
                lines={yarnLines}
                onChange={setYarnLines}
                lookup={yarnLookup}
              />
              <button type="submit" className="btn-primary">
                Save Yarn Deliveries
              </button>
            </form>
          )}
        </div>
      )}

      <div className="grid" style={{ marginTop: "1rem" }}>
        <div className="card">
          <h3>Yarn Deliveries ({order.yarnGiven.length})</h3>
          {order.yarnGiven.length === 0 ? (
            <p className="muted">None yet.</p>
          ) : (
            <ul className="record-list">
              {order.yarnGiven.map((row) => (
                <li key={row.yarnGivenId}>
                  <strong>
                    {variantLabel([
                      row.yarnVariant.yarnType?.materialName ?? row.yarnVariant.sku,
                      row.yarnVariant.supplier?.name,
                      row.yarnVariant.color?.name,
                    ])}
                  </strong>
                  <span>
                    {row.quantity} @ {row.unitPrice} · {formatDateDDMMYY(row.dateGiven)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Fabric Returns ({order.fabricReturns.length})</h3>
          {order.fabricReturns.length === 0 ? (
            <p className="muted">None yet.</p>
          ) : (
            <ul className="record-list">
              {order.fabricReturns.map((row) => (
                <li key={row.returnId}>
                  <strong>
                    {variantLabel([
                      row.fabricVariant.product.name,
                      row.fabricVariant.warpColor
                        ? `warp:${row.fabricVariant.warpColor.name}`
                        : "",
                      row.fabricVariant.weftColor
                        ? `weft:${row.fabricVariant.weftColor.name}`
                        : "",
                      row.fabricVariant.design?.name,
                    ])}
                  </strong>
                  <span>
                    {row.quantityReturned} pcs · {row.totalWeight}g
                    {row.widthCm && row.lengthCm ? ` · ${row.widthCm}×${row.lengthCm}cm` : ""} @{" "}
                    {row.unitPrice} · {formatDateDDMMYY(row.dateReturned)}
                  </span>
                  {row.remark && <em className="muted">{row.remark}</em>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}