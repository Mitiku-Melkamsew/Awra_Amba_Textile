import { Link } from "react-router-dom";
import type { WorkOrder } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";

interface ZigCardProps {
  order: WorkOrder;
  to: string;
}

const STATUS_LABELS: Record<string, string> = {
  assigned:    "Assigned",
  in_progress: "In Progress",
  returned:    "Returned",
  reconciled:  "Reconciled",
};

export function ZigCard({ order, to }: ZigCardProps) {
  const variant = order.fabricVariant;
  const variantDesc = [
    variant.warpColor?.name && `warp: ${variant.warpColor.name}`,
    variant.weftColor?.name && `weft: ${variant.weftColor.name}`,
    variant.design?.name,
  ].filter(Boolean).join(" · ");

  return (
    <Link to={to} className="zig-card">
      <div className="zig-card-top">
        <span className="zig-card-id">{order.zigId}</span>
        <span className={`badge ${order.status}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <p className="zig-card-product">{variant.product.name}</p>
      {variantDesc && (
        <p className="zig-card-meta" style={{ marginBottom: "0.2rem" }}>{variantDesc}</p>
      )}
      <p className="zig-card-meta">
        {formatDateDDMMYY(order.dateIssued)}
        {order._count && (
          <>
            {" "}· 🧶 {order._count.yarnGiven} · 🪢 {order._count.fabricReturns}
          </>
        )}
      </p>
    </Link>
  );
}