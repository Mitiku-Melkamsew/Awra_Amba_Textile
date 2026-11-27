import { Link, useNavigate } from "react-router-dom";
import type { Weaver } from "../../../api";
import { toTitleCase } from "../../../utils/formatters";

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
  const navigate = useNavigate();

  return (
    <div className="weavers-table-card">
      {/* Table Header Row */}
      <div className="weavers-table-header">
        <span>Weaver · ሸማኔ</span>
        <span>Phone</span>
        <span></span>
      </div>

      {/* Empty state */}
      {weavers.length === 0 ? (
        <div className="weavers-empty-state">
          <div className="weavers-empty-icon">🧑‍🤝‍🧑</div>
          <div className="weavers-empty-title">
            {search ? "No weavers match your search." : "No weavers found."}
          </div>
          <div className="weavers-empty-sub">
            {search
              ? "Try searching for a different name, phone, or ID."
              : "Click '+ Add weaver' above to register the first weaver."}
          </div>
        </div>
      ) : (
        weavers.map((weaver, index) => {
          const displayName = toTitleCase(weaver.fullName) || `Weaver #${weaver.userId}`;
          const isDeactivated = weaver.isActive === false || weaver.user?.isActive === false;

          return (
            <div
              key={weaver.userId}
              className="weavers-table-row"
              onClick={() => navigate(`/admin/weavers/${weaver.userId}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/admin/weavers/${weaver.userId}`);
                }
              }}
            >
              {/* Column 1: Avatar + Weaver Name + ID */}
              <div className="weavers-name-col">
                <div className={`weavers-avatar ${isDeactivated ? "deactivated" : ""}`}>
                  {sort === "id" ? weaver.userId : index + 1}
                </div>
                <div>
                  <div className="weavers-name-link">
                    {displayName}
                    {isDeactivated && (
                      <span className="badge badge--danger" style={{ fontSize: "10.5px", marginLeft: "0.4rem" }}>
                        Deactivated
                      </span>
                    )}
                  </div>
                  <div className="weavers-subtext">
                    ID #{weaver.userId}
                  </div>
                </div>
              </div>

              {/* Column 2: Phone */}
              <div className="weavers-cell-text">
                {weaver.phone || "—"}
              </div>

              {/* Column 3: Issue zig action (no chevron icon, whole row navigates) */}
              <div className="weavers-actions-col">
                {!isDeactivated && (
                  <Link
                    to={`/admin/issue-zig?weaverId=${weaver.userId}`}
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    + Issue Zig
                  </Link>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default WeaverRosterTable;
