import type { FormEvent } from "react";
import type { WorkOrderDetail } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";
import type { YarnLineDraft, YarnVariantOption } from "../../utils/yarnLines";
import { YarnLinesEditor } from "../YarnLinesEditor";

function variantLabel(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

export interface ZigYarnDeliveriesSectionProps {
  order: WorkOrderDetail;
  canEdit: boolean;
  giveYarnOpen: boolean;
  setGiveYarnOpen: (open: boolean) => void;
  yarnLines: YarnLineDraft[];
  setYarnLines: (lines: YarnLineDraft[]) => void;
  yarnVariants: YarnVariantOption[];
  handleYarnSubmit: (e: FormEvent) => Promise<void>;
  editingYarnId: number | null;
  editingYarnLines: YarnLineDraft[];
  setEditingYarnLines: (lines: YarnLineDraft[]) => void;
  editingYarnRemark: string;
  setEditingYarnRemark: (remark: string) => void;
  startEditYarn: (yarnGivenId: number) => void;
  cancelEditYarn: () => void;
  handleYarnEditSubmit: (e: FormEvent) => Promise<void>;
}

export function ZigYarnDeliveriesSection({
  order,
  canEdit,
  giveYarnOpen,
  setGiveYarnOpen,
  yarnLines,
  setYarnLines,
  yarnVariants,
  handleYarnSubmit,
  editingYarnId,
  editingYarnLines,
  setEditingYarnLines,
  editingYarnRemark,
  setEditingYarnRemark,
  startEditYarn,
  cancelEditYarn,
  handleYarnEditSubmit,
}: ZigYarnDeliveriesSectionProps) {
  return (
    <div
      id="yarn-deliveries-card"
      style={{
        background: "var(--color-surface, #ffffff)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        borderRadius: "var(--radius-lg, 14px)",
        padding: "1.25rem 1.5rem",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
            Yarn deliveries
          </h3>
          <span
            className="badge badge-neutral"
            style={{ fontSize: "0.75rem", padding: "2px 7px" }}
          >
            {order.yarnGiven.length}
          </span>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              cancelEditYarn();
              setGiveYarnOpen(!giveYarnOpen);
            }}
            className="btn btn-secondary"
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
            }}
          >
            {giveYarnOpen ? "✕ Cancel" : "+ Give yarn"}
          </button>
        )}
      </div>

      {/* Expandable Yarn Delivery Form */}
      {giveYarnOpen && canEdit && (
        <form
          onSubmit={handleYarnSubmit}
          style={{
            background: "var(--color-surface-subtle, #f8fafc)",
            borderRadius: "var(--radius-md, 10px)",
            padding: "1rem",
            marginBottom: "1.25rem",
            border: "1px solid var(--color-border-subtle, #e2e8f0)",
          }}
        >
          <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--color-text, #0f172a)" }}>
            Give Yarn to Weaver
          </h4>
          <YarnLinesEditor
            lines={yarnLines}
            onChange={setYarnLines}
            yarnVariants={yarnVariants}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setGiveYarnOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Record delivery
            </button>
          </div>
        </form>
      )}

      {/* Inline Yarn Edit Form */}
      {editingYarnId != null && canEdit && (
        <form
          onSubmit={handleYarnEditSubmit}
          style={{
            background: "var(--color-amber-50, #fffbeb)",
            borderRadius: "var(--radius-md, 10px)",
            padding: "1rem",
            marginBottom: "1.25rem",
            border: "1px solid var(--color-amber-200, #fde68a)",
          }}
        >
          <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "var(--color-amber-800, #92400e)" }}>
            ✏️ Edit / Adjust Yarn Delivery
          </h4>
          <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.78rem", color: "var(--color-amber-800, #92400e)" }}>
            To record unused yarn returned by weaver, lower the quantity here and add an explanatory note.
          </p>
          <YarnLinesEditor
            lines={editingYarnLines}
            onChange={setEditingYarnLines}
            yarnVariants={yarnVariants}
            singleLine
          />
          <div style={{ marginTop: "0.75rem" }}>
            <label className="form-label" style={{ fontSize: "0.75rem", color: "var(--color-amber-800, #92400e)", marginBottom: 3 }}>
              Adjustment note / remark (e.g. Unused yarn returned or correction)
            </label>
            <input
              type="text"
              value={editingYarnRemark}
              onChange={(e) => setEditingYarnRemark(e.target.value)}
              placeholder="e.g. Weaver returned 3 kg unused yarn"
              className="input"
              style={{
                fontSize: "0.85rem",
                padding: "0.45rem 0.65rem",
                borderColor: "var(--color-amber-200, #fde68a)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button
              type="button"
              onClick={cancelEditYarn}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Update
            </button>
          </div>
        </form>
      )}

      {/* Table of Yarn Deliveries */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(140px, 2fr) minmax(60px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) 30px",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "var(--color-text-muted, #64748b)",
        }}
      >
        <span>Yarn</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Date</span>
        <span></span>
      </div>

      {order.yarnGiven.length === 0 ? (
        <div style={{ padding: "1.5rem 0", textAlign: "center", color: "var(--color-text-muted, #94a3b8)", fontSize: "0.88rem" }}>
          No yarn deliveries recorded.
        </div>
      ) : (
        order.yarnGiven.map((yg) => {
          const yarnLabel = variantLabel([
            yg.yarnVariant.yarn?.name ?? yg.yarnVariant.sku,
            yg.yarnVariant.color?.name,
          ]);

          return (
            <div
              key={yg.yarnGivenId}
              style={{
                padding: "0.65rem 0",
                fontSize: "0.85rem",
                color: "var(--color-text-secondary, #334155)",
                borderBottom: "1px solid var(--color-border-subtle, #f8fafc)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(140px, 2fr) minmax(60px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) 30px",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--color-text, #0f172a)" }}>{yarnLabel}</span>
                <span>{yg.quantity} kg</span>
                <span>{yg.unitPrice ? `${Number(yg.unitPrice).toLocaleString()} ETB` : "—"}</span>
                <span style={{ color: "var(--color-text-muted, #64748b)" }}>{formatDateDDMMYY(yg.dateGiven)}</span>
                <span>
                  {canEdit && (
                    <button
                      type="button"
                      title="Edit yarn delivery"
                      onClick={() => startEditYarn(yg.yarnGivenId)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-muted, #64748b)",
                        padding: 0,
                        fontSize: "0.95rem",
                      }}
                    >
                      ✎
                    </button>
                  )}
                </span>
              </div>
              {yg.remark && (
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)", fontStyle: "italic", marginTop: "2px" }}>
                  Note: {yg.remark}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
