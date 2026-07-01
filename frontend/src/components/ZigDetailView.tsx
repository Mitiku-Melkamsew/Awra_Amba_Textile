import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { catalogApi, workOrdersApi, yarnGivenApi } from "../api";
import type { WorkOrderDetail } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";
import {
  createYarnLineDraft,
  parseYarnLines,
  yarnRowToLineDraft,
  type YarnCatalogLookup,
  type YarnLineDraft,
  type YarnVariantOption,
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
  const [yarnVariants, setYarnVariants] = useState<YarnVariantOption[]>([]);
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([createYarnLineDraft()]);
  const [yarnOpen, setYarnOpen] = useState(false);
  const [editingYarnId, setEditingYarnId] = useState<number | null>(null);
  const [editingYarnLines, setEditingYarnLines] = useState<YarnLineDraft[]>([]);
  const [editingFabricReturnId, setEditingFabricReturnId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canEdit =
    !readOnly &&
    (order.status === "assigned" ||
      order.status === "in_progress" ||
      order.status === "returned");
  const canRecordFabric =
    !readOnly &&
    (order.status === "assigned" ||
      order.status === "in_progress" ||
      order.status === "returned");

  useEffect(() => {
    if (!canEdit) return;
    Promise.all([catalogApi.lookup(), catalogApi.yarnVariants()]).then(([data, variants]) => {
      setYarnLookup({
        colors: data.colors,
        suppliers: data.suppliers,
        yarnTypes: data.yarnTypes,
      });
      setYarnVariants(variants as YarnVariantOption[]);
      setYarnLines([createYarnLineDraft(data)]);
    });
  }, [canEdit]);

  function startEditYarn(yarnGivenId: number) {
    const row = order.yarnGiven.find((r) => r.yarnGivenId === yarnGivenId);
    if (!row) return;
    setEditingFabricReturnId(null);
    setEditingYarnId(yarnGivenId);
    setEditingYarnLines([yarnRowToLineDraft(row, yarnLookup)]);
    setYarnOpen(false);
    setError("");
  }

  function cancelEditYarn() {
    setEditingYarnId(null);
    setEditingYarnLines([]);
  }

  async function handleYarnEditSubmit(event: FormEvent) {
    event.preventDefault();
    if (editingYarnId == null) return;
    setError("");
    setMessage("");
    const lines = parseYarnLines(editingYarnLines);
    if (lines.length === 0) {
      setError("Enter quantity and unit price.");
      return;
    }
    try {
      await yarnGivenApi.update(editingYarnId, lines[0]);
      setMessage("Yarn delivery updated.");
      cancelEditYarn();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update yarn delivery");
    }
  }

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

      {!readOnly && order.status === "in_progress" && (
        <button type="button" className="btn-secondary" onClick={markReturned}>
          All fabric returned
        </button>
      )}

      {canRecordFabric && editingFabricReturnId == null && (
        <FabricReturnForm
          order={order}
          onSaved={(msg) => {
            setMessage(msg ?? "Fabric return recorded.");
            onRefresh();
          }}
        />
      )}

      {canRecordFabric &&
        editingFabricReturnId != null &&
        (() => {
          const editReturn = order.fabricReturns.find((r) => r.returnId === editingFabricReturnId);
          if (!editReturn) return null;
          return (
            <FabricReturnForm
              order={order}
              editReturn={editReturn}
              onCancel={() => setEditingFabricReturnId(null)}
              onSaved={(msg) => {
                setMessage(msg ?? "Fabric return updated.");
                setEditingFabricReturnId(null);
                onRefresh();
              }}
            />
          );
        })()}

      {canEdit && editingYarnId != null && (
        <form className="card form" style={{ marginTop: "1rem" }} onSubmit={handleYarnEditSubmit}>
          <h3>ጥጥ ማስተካከል / Edit Yarn Delivery</h3>
          <YarnLinesEditor
            lines={editingYarnLines}
            onChange={setEditingYarnLines}
            lookup={yarnLookup}
            yarnVariants={yarnVariants}
            singleLine
          />
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={cancelEditYarn}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Yarn Delivery
            </button>
          </div>
        </form>
      )}

      {canEdit && editingYarnId == null && (
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
                yarnVariants={yarnVariants}
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
                <li key={row.yarnGivenId} className="record-list-item">
                  <div className="record-list-main">
                    <strong>
                      {variantLabel([
                        row.yarnVariant.yarnType?.materialName ?? row.yarnVariant.sku,
                        row.yarnVariant.supplier?.name,
                        row.yarnVariant.color?.name,
                      ])}
                    </strong>
                    <span>
                      {row.quantity} @ {row.unitPrice} · {formatDateDDMMYY(row.dateGiven)}
                      {row.paymentId != null && (
                        <span className="muted"> · settled</span>
                      )}
                    </span>
                  </div>
                  {canEdit && row.paymentId == null && editingYarnId !== row.yarnGivenId && (
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => startEditYarn(row.yarnGivenId)}
                    >
                      Edit
                    </button>
                  )}
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
                <li key={row.returnId} className="record-list-item">
                  <div className="record-list-main">
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
                      {row.paymentId != null && (
                        <span className="muted"> · settled</span>
                      )}
                    </span>
                    {row.remark && <em className="muted">{row.remark}</em>}
                  </div>
                  {canRecordFabric &&
                    row.paymentId == null &&
                    editingFabricReturnId !== row.returnId && (
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                          setEditingYarnId(null);
                          setEditingFabricReturnId(row.returnId);
                          setError("");
                        }}
                      >
                        Edit
                      </button>
                    )}
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