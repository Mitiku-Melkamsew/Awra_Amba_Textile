import { Link } from "react-router-dom";
import type { Weaver } from "../api";

interface WeaverCardProps {
  weaver: Weaver;
  to: string;
}

export function WeaverCard({ weaver, to }: WeaverCardProps) {
  const initials = weaver.firstName.charAt(0) + weaver.lastName.charAt(0);

  return (
    <Link to={to} className="weaver-row">
      <div className="weaver-avatar">{initials}</div>
      <div className="weaver-row-body">
        <div className="weaver-row-name">
          {weaver.firstName} {weaver.lastName}
        </div>
        <div className="weaver-row-meta">
          #{weaver.weaverId}
          {weaver.phone && ` · ${weaver.phone}`}
        </div>
      </div>
      <span className="weaver-row-chevron">›</span>
    </Link>
  );
}