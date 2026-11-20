import type { UserSummary } from "../../../domain/models";
import { Badge, Button } from "../../../components/common";

export interface UserListTableProps {
  users: UserSummary[];
  loading: boolean;
  selectedUserId: number | null;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onSelectUser: (user: UserSummary) => void;
}

const ROLE_TABS = [
  { id: "all", label: "All Users" },
  { id: "weaver", label: "Weavers" },
  { id: "merchant", label: "Merchants" },
  { id: "admin", label: "Admins" },
];

function getAvatarColors(name: string, isActive: boolean) {
  if (!isActive) return { bg: "#f1f5f9", text: "#94a3b8" };
  const initial = (name[0] || "U").toUpperCase();
  if (initial === "A" || initial === "S") return { bg: "#ffedd5", text: "#9a3412" };
  if (initial === "W") return { bg: "#fed7aa", text: "#c2410c" };
  if (initial === "M") return { bg: "#fef3c7", text: "#92400e" };
  return { bg: "#ffedd5", text: "#9a3412" };
}

export function UserListTable({
  users,
  loading,
  selectedUserId,
  selectedRole,
  onSelectRole,
  search,
  onSearchChange,
  onSelectUser,
}: UserListTableProps) {
  return (
    <div className="stack">
      {/* Controls: Search and Filter Tabs */}
      <div className="cluster-between">
        <div style={{ position: "relative", minWidth: 260, flex: "1 1 260px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-subtle)",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            className="input"
            style={{ paddingLeft: "2.25rem" }}
            placeholder="Search by name, @username, or phone…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="cluster">
          {ROLE_TABS.map((tab) => {
            const isSelected = selectedRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-pill ${isSelected ? "active" : ""}`}
                onClick={() => onSelectRole(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Roles</th>
              <th>Phone</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center" style={{ padding: "var(--space-8)" }}>
                  <div className="cluster" style={{ justifyContent: "center" }}>
                    <span className="spinner spinner-sm" />
                    <span>Loading users…</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted" style={{ padding: "var(--space-8)" }}>
                  No users match your filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelected = selectedUserId === u.userId;
                const avatar = getAvatarColors(u.fullName, u.isActive);
                const initial = (u.fullName[0] || "U").toUpperCase();

                return (
                  <tr
                    key={u.userId}
                    onClick={() => onSelectUser(u)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--orange-bg, #fff7ed)" : undefined,
                    }}
                  >
                    <td>
                      <div className="cluster" style={{ flexWrap: "nowrap" }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: avatar.bg,
                            color: avatar.text,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                            flexShrink: 0,
                          }}
                        >
                          {initial}
                        </div>
                        <div>
                          <div className="font-bold text-base">{u.fullName}</div>
                          <div className="text-xs text-muted">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="cluster" style={{ gap: "4px" }}>
                        {(u.roles || []).map((r) => (
                          <Badge
                            key={r}
                            variant={r === "admin" ? "brand" : r === "weaver" ? "info" : "neutral"}
                            pill
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="text-muted" style={{ whiteSpace: "nowrap" }}>
                      {u.phone || "—"}
                    </td>

                    <td>
                      <Badge variant={u.isActive ? "success" : "danger"} pill dot>
                        {u.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>

                    <td className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(u);
                        }}
                      >
                        ✏️ Edit
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserListTable;
