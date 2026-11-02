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

  // Redesign state: Unused Yarn Return & Fabric Return to Weaver
  const [yarnReturnOpen, setYarnReturnOpen] = useState(false);
  const [yarnReturnVariantId, setYarnReturnVariantId] = useState<number | "">("");
  const [yarnReturnQty, setYarnReturnQty] = useState("");
  const [yarnReturnRemark, setYarnReturnRemark] = useState("");

  const [weaverReturnOpen, setWeaverReturnOpen] = useState(false);
  const [weaverReturnQty, setWeaverReturnQty] = useState("");
  const [weaverReturnRemark, setWeaverReturnRemark] = useState("");

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

  const canMarkReturned =
    !readOnly &&
    order.status !== "returned" &&
    order.status !== "reconciled" &&
    order.status !== "cancelled";

  const canCancel =
    !readOnly &&
    order.status !== "reconciled" &&
    order.status !== "cancelled";

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

  async function handleMarkReturned() {
    setError("");
    setMessage("");
    try {
      await workOrdersApi.markReturned(order.zigId);
      setMessage("Work order marked as returned.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as returned");
    }
  }

  async function handleCancelZig() {
    if (!window.confirm(`Are you sure you want to cancel zig ${order.zigId}? This will cancel the work order.`)) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await workOrdersApi.cancel(order.zigId);
      setMessage("Work order cancelled successfully.");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel zig");
    }
  }

  async function handleYarnReturnSubmit(e: FormEvent) {
    e.preventDefault();
    if (!yarnReturnVariantId || !yarnReturnQty || parseFloat(yarnReturnQty) <= 0) {
      setError("Please select a yarn variant and specify a positive quantity.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await workOrdersApi.recordYarnReturn({
        zigId: order.zigId,
        yarnVariantId: Number(yarnReturnVariantId),
        quantity: parseFloat(yarnReturnQty),
        remark: yarnReturnRemark.trim() || undefined,
      });
      setMessage("Unused yarn return recorded. Settlement yarn cost updated.");
      setYarnReturnQty("");
      setYarnReturnRemark("");
      setYarnReturnOpen(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record yarn return");
    }
  }

  async function handleWeaverReturnSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = parseInt(weaverReturnQty, 10);
    if (!qty || qty <= 0) {
      setError("Please specify a positive integer quantity for rejected fabric.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await workOrdersApi.recordFabricReturnToWeaver({
        zigId: order.zigId,
        fabricVariantId: order.fabricVariantId,
        quantity: qty,
        remark: weaverReturnRemark.trim() || undefined,
      });
      setMessage("Fabric returned to weaver recorded. Excluded from settlement.");
      setWeaverReturnQty("");
      setWeaverReturnRemark("");
      setWeaverReturnOpen(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record fabric return to weaver");
    }
  }

  // Available yarn variants issued for return selection
  const issuedYarnVariants = Array.from(
    new Map(
      order.yarnGiven.map((yg) => [
        yg.yarnVariant.yarnVariantId,
        {
          yarnVariantId: yg.yarnVariant.yarnVariantId,
          label: variantLabel([
            yg.yarnVariant.yarn?.name ?? yg.yarnVariant.yarnType?.materialName ?? yg.yarnVariant.sku,
            yg.yarnVariant.color?.name,
            yg.yarnVariant.supplier?.name,
          ]),
        },
      ]),
    ).values(),
  );

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
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {canMarkReturned && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleMarkReturned}
                style={{ fontSize: 12.5, color: "var(--green)", borderColor: "var(--green)" }}
              >
                ✓ Mark as Returned
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleCancelZig}
                style={{ fontSize: 12.5, color: "var(--red)", borderColor: "#FCA5A5" }}
              >
                ✕ Cancel Zig
              </button>
            )}
          </div>
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
                🧶 ጥጥ መስጠት / Record Yarn Delivery
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

          {/* Record Unused Yarn Return (collapsible) */}
          {canEdit && (
            <div className="card card-sm">
              <button
                type="button"
                className="collapse-toggle"
                onClick={() => setYarnReturnOpen(!yarnReturnOpen)}
              >
                <span style={{ fontSize: 12 }}>{yarnReturnOpen ? "▼" : "▶"}</span>
                ↩️ ጥጥ መመለስ / Record Unused Yarn Return
              </button>
              {yarnReturnOpen && (
                <form className="form" style={{ marginTop: "0.875rem" }} onSubmit={handleYarnReturnSubmit}>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
                    Unused yarn returned by the weaver decreases net settlement yarn costs.
                  </p>
                  <div className="form-group">
                    <label>Yarn Variant</label>
                    <select
                      value={yarnReturnVariantId}
                      onChange={(e) => setYarnReturnVariantId(Number(e.target.value) || "")}
                      required
                      className="input-field"
                    >
                      <option value="">Select issued yarn variant</option>
                      {issuedYarnVariants.map((iv) => (
                        <option key={iv.yarnVariantId} value={iv.yarnVariantId}>
                          {iv.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity Returned (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={yarnReturnQty}
                        onChange={(e) => setYarnReturnQty(e.target.value)}
                        placeholder="e.g. 0.50"
                        required
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label>Remark / Notes</label>
                      <input
                        type="text"
                        value={yarnReturnRemark}
                        onChange={(e) => setYarnReturnRemark(e.target.value)}
                        placeholder="Reason or condition"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Record Yarn Return</button>
                    <button type="button" className="btn-ghost" onClick={() => setYarnReturnOpen(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Record Fabric Return to Weaver (Rejected Fabric) (collapsible) */}
          {canEdit && (
            <div className="card card-sm">
              <button
                type="button"
                className="collapse-toggle"
                onClick={() => setWeaverReturnOpen(!weaverReturnOpen)}
              >
                <span style={{ fontSize: 12 }}>{weaverReturnOpen ? "▼" : "▶"}</span>
                🚫 ጨርቅ ለሸማኔ መመለስ / Return Fabric to Weaver (Reject)
              </button>
              {weaverReturnOpen && (
                <form className="form" style={{ marginTop: "0.875rem" }} onSubmit={handleWeaverReturnSubmit}>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
                    Defective or rejected fabric returned to the weaver is excluded from settlement payment.
                  </p>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity (pcs)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={weaverReturnQty}
                        onChange={(e) => setWeaverReturnQty(e.target.value)}
                        placeholder="e.g. 1"
                        required
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rejection Reason / Remark</label>
                      <input
                        type="text"
                        value={weaverReturnRemark}
                        onChange={(e) => setWeaverReturnRemark(e.target.value)}
                        placeholder="e.g. Torn border or uneven tension"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" style={{ background: "#DC2626" }}>
                      Record Return to Weaver
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setWeaverReturnOpen(false)}>Cancel</button>
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
                          row.yarnVariant.yarn?.name ?? row.yarnVariant.yarnType?.materialName ?? row.yarnVariant.sku,
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

          {/* Unused Yarn Returns */}
          {(order.yarnReturns && order.yarnReturns.length > 0) && (
            <div className="card card-sm">
              <p className="section-title">
                ↩️ Unused Yarn Returns
                <span className="count">{order.yarnReturns.length}</span>
              </p>
              <ul className="record-list">
                {order.yarnReturns.map((row) => (
                  <li key={row.yarnReturnId} className="record-item">
                    <div className="record-main">
                      <div className="record-title">
                        {variantLabel([
                          row.yarnVariant.yarn?.name ?? row.yarnVariant.yarnType?.materialName ?? row.yarnVariant.sku,
                          row.yarnVariant.color?.name,
                        ])}
                      </div>
                      <div className="record-meta">
                        {row.quantity} kg returned &nbsp;·&nbsp;{formatDateDDMMYY(row.dateReturned)}
                      </div>
                      {row.remark && (
                        <div className="record-meta" style={{ fontStyle: "italic" }}>{row.remark}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          {/* Fabric Returned to Weaver (Rejected) */}
          {(order.fabricReturnsToWeaver && order.fabricReturnsToWeaver.length > 0) && (
            <div className="card card-sm" style={{ borderColor: "#FECACA" }}>
              <p className="section-title" style={{ color: "#DC2626" }}>
                🚫 Fabric Returned to Weaver (Rejected)
                <span className="count">{order.fabricReturnsToWeaver.length}</span>
              </p>
              <ul className="record-list">
                {order.fabricReturnsToWeaver.map((row) => (
                  <li key={row.fabricReturnToWeaverId} className="record-item">
                    <div className="record-main">
                      <div className="record-title">
                        {variantLabel([
                          row.fabricVariant.product.name,
                          row.fabricVariant.design?.name,
                        ])}
                      </div>
                      <div className="record-meta">
                        {row.quantity} pcs rejected &nbsp;·&nbsp;{formatDateDDMMYY(row.dateReturned)}
                      </div>
                      {row.remark && (
                        <div className="record-meta" style={{ fontStyle: "italic", color: "#DC2626" }}>
                          {row.remark}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ZigDetailView;
