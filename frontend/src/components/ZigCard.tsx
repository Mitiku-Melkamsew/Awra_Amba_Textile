import { Link } from "react-router-dom";
import type { WorkOrder } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";

interface ZigCardProps {
  order: WorkOrder;
  to: string;
}

const STATUS_LABELS: Record<string, string> = {
  assigned:    "Assigned / ተመድቧል",
  in_progress: "In Progress / በሂደት",
  returned:    "Returned / ተመለሰ",
  reconciled:  "Reconciled / ተሰማረ",
};

export function ZigCard({ order, to }: ZigCardProps) {
  const variant = order.fabricVariant;
  const warp = variant.warpColor?.name;
  const weft = variant.weftColor?.name;
  const design = variant.design?.name;

  return (
    <Link to={to} className="zig-card">
      <div className="zig-card-top">
        <span className="zig-card-id" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ color: "var(--accent)", fontSize: "12px" }}>#</span>
          {order.zigId}
        </span>
        <span className={`badge ${order.status}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <p className="zig-card-product">
        {variant.fabric?.name ?? variant.product?.name ?? "Handwoven Fabric"}
      </p>

      {(warp || weft || design) && (
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", margin: "0.4rem 0 0.5rem" }}>
          {warp && weft && warp === weft ? (
            <span style={{ fontSize: "11px", background: "var(--bg-subtle)", border: "1px solid var(--border)", padding: "0.15rem 0.45rem", borderRadius: "999px", color: "var(--text-muted)" }}>
              🎨 {warp}
            </span>
          ) : (
            <>
              {warp && (
                <span style={{ fontSize: "11px", background: "var(--bg-subtle)", border: "1px solid var(--border)", padding: "0.15rem 0.45rem", borderRadius: "999px", color: "var(--text-muted)" }}>
                  ውርፍ: {warp}
                </span>
              )}
              {weft && (
                <span style={{ fontSize: "11px", background: "var(--bg-subtle)", border: "1px solid var(--border)", padding: "0.15rem 0.45rem", borderRadius: "999px", color: "var(--text-muted)" }}>
                  ስፍ: {weft}
                </span>
              )}
            </>
          )}
          {design && (
            <span style={{ fontSize: "11px", background: "var(--brand-light)", color: "var(--brand)", padding: "0.15rem 0.45rem", borderRadius: "999px", fontWeight: 600 }}>
              ✨ {design}
            </span>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border-subtle)" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
          <span>📅</span> {formatDateDDMMYY(order.dateIssued)}
        </span>
        {order._count && (
          <div style={{ display: "flex", gap: "0.4rem", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)" }}>
            <span title="Yarn issued batches" style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
              🧶 {order._count.yarnGiven}
            </span>
            <span>·</span>
            <span title="Fabric returns recorded" style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
              🪢 {order._count.fabricReturns}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default ZigCard;
