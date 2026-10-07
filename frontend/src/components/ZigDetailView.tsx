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
      const result = await yarnGivenApi.create({ zigId: order.zigId, lines });
      const created = result.variantResolved.filter((v) => v.created).length;
      setMessage(
        created > 0
          ? `Recorded ${lines.length} yarn delivery(s). ${created} new variant(s) created.`
          : `Recorded ${lines.length} yarn delivery(s).`,
      );
      setYarnLines([createYarnLineDraft(yarnLookup)]);
      setYarnOpen(false);
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
    <div className="page" style={{ gap: "0.875rem" }}>
      {/* Back link */}
      <Link to={backLink} className="back-link">
        ← Back
      </Link>

      {/* Zig header */}
      <div className="zig-detail-header">
        <div>
          <h2 className="zig-detail-id">{order.zigId}</h2>
          <p className="zig-detail-info">
            {order.weaver.firstName} {order.weaver.lastName}
            &nbsp;·&nbsp;{order.fabricVariant.product.name}
            {order.fabricVariant.warpColor && ` · warp: ${order.fabricVariant.warpColor.name}`}
            {order.fabricVariant.weftColor && ` · weft: ${order.fabricVariant.weftColor.name}`}
            {order.fabricVariant.design && ` · ${order.fabricVariant.design.name}`}
          </p>
          <p className="zig-detail-info" style={{ marginTop: 2 }}>
            Issued: {formatDateDDMMYY(order.dateIssued)}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
          <span className={`badge ${order.status}`}>{order.status.replace("_", " ")}</span>
          {!readOnly && order.status === "in_progress" && (
            <button type="button" className="btn-ghost" onClick={markReturned} style={{ fontSize: 12.5 }}>
              ✓ Mark All Returned
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {message && <div className="success-msg"><span>✅</span> {message}</div>}
      {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

      {/* Two-column detail layout */}
      <div className="zig-detail-layout">
        {/* ── Left: forms / actions ── */}
        <div className="zig-detail-left">
          {/* Fabric return form */}
          {canRecordFabric && editingFabricReturnId == null && (
            <div className="card card-sm">
              <p className="section-title">🪢 Record Fabric Return</p>
              <FabricReturnForm
                order={order}
                onSaved={(msg) => {
                  setMessage(msg ?? "Fabric return recorded.");
                  onRefresh();
                }}
              />
            </div>
          )}

          {/* Edit fabric return */}
          {canRecordFabric && editingFabricReturnId != null && (() => {
            const editReturn = order.fabricReturns.find((r) => r.returnId === editingFabricReturnId);
            if (!editReturn) return null;
            return (
              <div className="card card-sm">
                <p className="section-title">✏️ Edit Fabric Return #{editingFabricReturnId}</p>
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
              </div>
            );
          })()}

          {/* Edit yarn */}
          {canEdit && editingYarnId != null && (
            <div className="card card-sm">
              <p className="section-title">✏️ Edit Yarn Delivery</p>
              <form className="form" onSubmit={handleYarnEditSubmit}>
                <YarnLinesEditor
                  lines={editingYarnLines}
                  onChange={setEditingYarnLines}
                  lookup={yarnLookup}
                  yarnVariants={yarnVariants}
                  singleLine
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Update</button>
                  <button type="button" className="btn-ghost" onClick={cancelEditYarn}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Record new yarn (collapsible) */}
          {canEdit && editingYarnId == null && (
            <div className="card card-sm">
              <button
                type="button"
                className="collapse-toggle"
                onClick={() => setYarnOpen(!yarnOpen)}
              >
                <span style={{ fontSize: 12 }}>{yarnOpen ? "▼" : "▶"}</span>
                🧶 ጥጥ መስጠት / Record Yarn
              </button>
              {yarnOpen && (
                <form className="form" style={{ marginTop: "0.875rem" }} onSubmit={handleYarnSubmit}>
                  <YarnLinesEditor
                    lines={yarnLines}
                    onChange={setYarnLines}
                    lookup={yarnLookup}
                    yarnVariants={yarnVariants}
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Save Yarn Deliveries</button>
                    <button type="button" className="btn-ghost" onClick={() => setYarnOpen(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ── Right: history records ── */}
        <div className="zig-detail-right">
          {/* Yarn deliveries */}
          <div className="card card-sm">
            <p className="section-title">
              🧶 Yarn Deliveries
              <span className="count">{order.yarnGiven.length}</span>
            </p>
            {order.yarnGiven.length === 0 ? (
              <div className="empty-state" style={{ padding: "1rem" }}>
                <span className="empty-icon" style={{ fontSize: "1.25rem" }}>📭</span>
                None yet.
              </div>
            ) : (
              <ul className="record-list">
                {order.yarnGiven.map((row) => (
                  <li key={row.yarnGivenId} className="record-item">
                    <div className="record-main">
                      <div className="record-title">
                        {variantLabel([
                          row.yarnVariant.yarnType?.materialName ?? row.yarnVariant.sku,
                          row.yarnVariant.supplier?.name,
                          row.yarnVariant.color?.name,
                        ])}
                      </div>
                      <div className="record-meta">
                        {row.quantity} kg @ {row.unitPrice} ETB
                        &nbsp;·&nbsp;{formatDateDDMMYY(row.dateGiven)}
                        {row.paymentId != null && (
                          <span style={{ color: "var(--green)", marginLeft: 4 }}>· settled</span>
                        )}
                      </div>
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

          {/* Fabric returns */}
          <div className="card card-sm">
            <p className="section-title">
              🪢 Fabric Returns
              <span className="count">{order.fabricReturns.length}</span>
            </p>
            {order.fabricReturns.length === 0 ? (
              <div className="empty-state" style={{ padding: "1rem" }}>
                <span className="empty-icon" style={{ fontSize: "1.25rem" }}>📭</span>
                None yet.
              </div>
            ) : (
              <ul className="record-list">
                {order.fabricReturns.map((row) => (
                  <li key={row.returnId} className="record-item">
                    <div className="record-main">
                      <div className="record-title">
                        {variantLabel([
                          row.fabricVariant.product.name,
                          row.fabricVariant.warpColor ? `warp:${row.fabricVariant.warpColor.name}` : "",
                          row.fabricVariant.weftColor ? `weft:${row.fabricVariant.weftColor.name}` : "",
                          row.fabricVariant.design?.name,
                        ])}
                      </div>
                      <div className="record-meta">
                        {row.quantityReturned} pcs · {row.totalWeight}g
                        {row.widthCm && row.lengthCm ? ` · ${row.widthCm}×${row.lengthCm}cm` : ""}
                        &nbsp;@&nbsp;{row.unitPrice} ETB
                        &nbsp;·&nbsp;{formatDateDDMMYY(row.dateReturned)}
                        {row.paymentId != null && (
                          <span style={{ color: "var(--green)", marginLeft: 4 }}>· settled</span>
                        )}
                      </div>
                      {row.remark && (
                        <div className="record-meta" style={{ fontStyle: "italic" }}>{row.remark}</div>
                      )}
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
      </div>
    </div>
  );
}