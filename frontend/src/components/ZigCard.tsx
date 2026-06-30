import { Link } from "react-router-dom";
import type { WorkOrder } from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";

interface ZigCardProps {
  order: WorkOrder;
  to: string;
}

const STATUS_LABELS: Record<string, string> = {
  assigned: "ተመድቧል",
  in_progress: "በሂደት",
  returned: "ተመለሰ",
  reconciled: "ተሰማረ",
};

export function ZigCard({ order, to }: ZigCardProps) {
  return (
    <Link to={to} className="zig-card">
      <div className="zig-card-top">
        <strong>{order.zigId}</strong>
        <span className={`badge ${order.status}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <p className="zig-card-product">{order.fabricVariant.product.name}</p>
      <p className="muted zig-card-meta">
        {formatDateDDMMYY(order.dateIssued)}
        {order._count && (
          <>
            {" "}
            · ጥጥ {order._count.yarnGiven} · ጨርቅ {order._count.fabricReturns}
          </>
        )}
      </p>
      <span className="zig-card-chevron">›</span>
    </Link>
  );
}