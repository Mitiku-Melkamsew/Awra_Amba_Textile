import type { UserSummary } from "../../../domain/models";
import { Badge } from "../../../components/common";
import { toTitleCase } from "../../../utils/formatters";

export interface UserListTableProps {
  users: UserSummary[];
  loading: boolean;
  selectedUserId: number | null;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onSelectUser: (user: UserSummary) => void;
  onAddUser: () => void;
}

const ROLE_TABS = [
  { id: "all", label: "All Users" },
  { id: "weaver", label: "Weavers" },
  { id: "merchant", label: "Merchants" },
  { id: "admin", label: "Admins" },
];

export function UserListTable({
  users,
  loading,
  selectedUserId,
  selectedRole,
  onSelectRole,
  search,
  onSearchChange,
  onSelectUser,
  onAddUser,
}: UserListTableProps) {
  return (
    <div className="stack">
      {/* Controls: Search and Filter Tabs + Add user button */}
      <div className="cluster-between">
        <div className="users-search-wrap">
          <span className="users-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            className="input users-search-input"
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
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onAddUser}
          >
            + Add user
          </button>
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
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-8">
                  <div className="cluster justify-center">
                    <span className="spinner spinner-sm" />
                    <span>Loading users…</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted p-8">
                  No users match your filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelected = selectedUserId === u.userId;
                const initial = (u.fullName[0] || "U").toUpperCase();

                return (
                  <tr
                    key={u.userId}
                    onClick={() => onSelectUser(u)}
                    className={`selectable-row ${isSelected ? "selected" : ""}`}
                  >
                    <td>
                      <div className="cluster no-wrap">
                        <div className={`user-avatar ${!u.isActive ? "is-deactivated" : ""}`}>
                          {initial}
                        </div>
                        <div>
                          <div className="font-bold text-base">{toTitleCase(u.fullName)}</div>
                          <div className="text-xs text-muted">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="cluster gap-xs">
                        {(u.roles || []).map((r) => (
                          <Badge
                            key={r}
                            variant={r === "admin" ? "brand" : r === "weaver" ? "info" : "neutral"}
                            pill
                          >
                            {toTitleCase(r)}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="text-muted text-nowrap">
                      {u.phone || "—"}
                    </td>

                    <td>
                      <Badge variant={u.isActive ? "success" : "danger"} pill dot>
                        {u.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>

                    <td className="text-right">
                      <span className="row-chevron">›</span>
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
