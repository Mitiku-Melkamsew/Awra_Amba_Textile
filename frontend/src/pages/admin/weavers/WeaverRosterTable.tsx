import { Link } from "react-router-dom";
import type { Weaver } from "../../../api";

export interface WeaverRosterTableProps {
  weavers: Weaver[];
  sort: "name" | "id";
  search: string;
}

export function WeaverRosterTable({
  weavers,
  sort,
  search,
}: WeaverRosterTableProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Table Header Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(200px, 1.8fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(140px, 1fr)",
          alignItems: "center",
          borderBottom: "1px solid var(--border-subtle, #F1F5F9)",
          padding: "0.85rem 1.5rem",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text-muted, #64748B)",
          background: "var(--bg-subtle, #F8FAFC)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        <span>Weaver · ሸማኔ</span>
        <span>Phone</span>
        <span>Bank account</span>
        <span style={{ textAlign: "right" }}></span>
      </div>

      {/* Empty state */}
      {weavers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧑‍🤝‍🧑</div>
          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "15px" }}>
            {search ? "No weavers match your search." : "No weavers found."}
          </div>
          <div style={{ fontSize: "13px", marginTop: "0.25rem" }}>
            {search
              ? "Try searching for a different name, phone, or ID."
              : "Click '+ Add weaver' above to register the first artisan."}
          </div>
        </div>
      ) : (
        weavers.map((weaver, index) => {
          const displayName = weaver.fullName || `Weaver #${weaver.userId}`;
          const isDeactivated = weaver.isActive === false || weaver.user?.isActive === false;

          return (
            <div
              key={weaver.userId}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(200px, 1.8fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(140px, 1fr)",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle, #F1F5F9)",
                padding: "0.85rem 1.5rem",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-hover, #F8FAFC)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface, #FFFFFF)";
              }}
            >
              {/* Column 1: Avatar + Weaver Name + ID */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "var(--brand-light, #FFEDD5)",
                    color: "var(--brand, #C2410C)",
                    fontWeight: 700,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {sort === "id" ? weaver.userId : index + 1}
                </div>
                <div>
                  <Link
                    to={`/admin/weavers/${weaver.userId}`}
                    style={{
                      fontWeight: 700,
                      color: "var(--text, #0F172A)",
                      fontSize: "14.5px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {displayName}
                    {isDeactivated && (
                      <span className="badge badge--danger" style={{ fontSize: "10.5px" }}>
                        Deactivated
                      </span>
                    )}
                  </Link>
                  <div style={{ fontSize: "12px", color: "var(--text-muted, #64748B)", marginTop: 2 }}>
                    ID #{weaver.userId}
                  </div>
                </div>
              </div>

              {/* Column 2: Phone */}
              <div style={{ fontSize: "13.5px", color: "var(--text, #334155)", fontWeight: 500 }}>
                {weaver.phone || "—"}
              </div>

              {/* Column 3: Bank account */}
              <div style={{ fontSize: "13.5px", color: "var(--text-muted, #64748B)", fontWeight: 500 }}>
                [account]
              </div>

              {/* Column 4: Issue zig + Chevron Arrow */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                {!isDeactivated && (
                  <Link
                    to={`/admin/issue-zig?weaverId=${weaver.userId}`}
                    className="btn btn-secondary btn-sm"
                  >
                    + Issue Zig
                  </Link>
                )}
                <Link
                  to={`/admin/weavers/${weaver.userId}`}
                  style={{
                    color: "var(--text-subtle, #94A3B8)",
                    fontSize: "1.1rem",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    padding: "0.2rem",
                  }}
                >
                  ›
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
