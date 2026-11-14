import { Link } from "react-router-dom";
import type { Weaver } from "../api";

interface WeaverCardProps {
  weaver: Weaver;
  to: string;
}

export function WeaverCard({ weaver, to }: WeaverCardProps) {
  const wid = weaver.userId;
  const isDeactivated = weaver.isActive === false || weaver.user?.isActive === false;
  const displayName =
    weaver.fullName ||
    `${weaver.firstName ?? ""} ${weaver.lastName ?? ""}`.trim() ||
    `Weaver #${wid}`;
  const initials = (displayName.slice(0, 2) || "W").toUpperCase();

  return (
    <Link
      to={to}
      className="weaver-row"
      style={isDeactivated ? { opacity: 0.75, background: "#f8fafc" } : undefined}
    >
      <div
        className="weaver-avatar"
        aria-hidden="true"
        style={isDeactivated ? { background: "#94a3b8" } : undefined}
      >
        {initials}
      </div>
      <div className="weaver-row-body">
        <div className="weaver-row-name" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{displayName}</span>
          {isDeactivated && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "4px",
                background: "#fee2e2",
                color: "#b91c1c",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Deactivated / የተዘጋ
            </span>
          )}
        </div>
        <div className="weaver-row-meta" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "2px" }}>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
            #{wid}
          </span>
          {weaver.phone && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--text-muted)" }}>
              <span>📞</span> {weaver.phone}
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
