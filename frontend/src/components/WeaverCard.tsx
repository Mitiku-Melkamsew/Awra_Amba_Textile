import { Link } from "react-router-dom";
import type { Weaver } from "../api";

interface WeaverCardProps {
  weaver: Weaver;
  to: string;
}

export function WeaverCard({ weaver, to }: WeaverCardProps) {
  const initials = (weaver.firstName.charAt(0) + (weaver.lastName ? weaver.lastName.charAt(0) : "")).toUpperCase();

  return (
    <Link to={to} className="weaver-row">
      <div className="weaver-avatar" aria-hidden="true">
        {initials}
      </div>
      <div className="weaver-row-body">
        <div className="weaver-row-name">
          {weaver.firstName} {weaver.lastName}
        </div>
        <div className="weaver-row-meta" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "2px" }}>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
            #{weaver.weaverId}
          </span>
          {weaver.phone && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--text-muted)" }}>
              <span>📞</span> {weaver.phone}
            </span>
          )}
          {weaver.bankAccountNumber && (
            <span style={{ fontSize: "11px", background: "var(--bg-subtle)", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "var(--text-muted)" }}>
              🏦 {weaver.bankAccountNumber}
            </span>
          )}
        </div>
      </div>
      <span className="weaver-row-chevron" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default WeaverCard;
