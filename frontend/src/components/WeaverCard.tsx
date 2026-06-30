import { Link } from "react-router-dom";
import type { Weaver } from "../api";

interface WeaverCardProps {
  weaver: Weaver;
  to: string;
}

export function WeaverCard({ weaver, to }: WeaverCardProps) {
  return (
    <Link to={to} className="weaver-card">
      <div className="weaver-card-avatar">
        {weaver.firstName.charAt(0)}
        {weaver.lastName.charAt(0)}
      </div>
      <div className="weaver-card-body">
        <strong>
          {weaver.firstName} {weaver.lastName}
        </strong>
        <span className="muted">#{weaver.weaverId}</span>
        {weaver.phone && <span className="weaver-card-phone">{weaver.phone}</span>}
      </div>
      <span className="weaver-card-chevron">›</span>
    </Link>
  );
}