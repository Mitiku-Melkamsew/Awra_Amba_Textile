import { useEffect, useState } from "react";
import { userService } from "../../infrastructure/services";
import type { UserSummary, UserRole } from "../../domain/models";

function deriveUsername(fullName: string): string {
  const cleaned = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".");
  return cleaned.length >= 2 ? cleaned.slice(0, 30) : "";
}

function derivePassword(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.replace(/[^a-zA-Z0-9]/g, "");
  if (first && first.length >= 2) {
    return `${first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()}@123`;
  }
  return "Awra@123";
}

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newRoles, setNewRoles] = useState<UserRole[]>(["weaver"]);
  const [isCustomUsername, setIsCustomUsername] = useState(false);
  const [isCustomPassword, setIsCustomPassword] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  // Success credentials modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    initialPassword?: string;
    roles: UserRole[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Role edit modal
  const [editingRolesUser, setEditingRolesUser] = useState<UserSummary | null>(null);
  const [targetRoles, setTargetRoles] = useState<UserRole[]>([]);

  // Password modal
  const [resetPasswordUser, setResetPasswordUser] = useState<UserSummary | null>(null);
  const [newPassInput, setNewPassInput] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await userService.listUsers(
        selectedRole !== "all" ? (selectedRole as UserRole) : undefined
      );
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const handleFullNameChange = (val: string) => {
    setNewFullName(val);
    if (!isCustomUsername) {
      setNewUsername(deriveUsername(val));
    }
    if (!isCustomPassword) {
      setNewPassword(derivePassword(val));
    }
  };

  const openCreateModal = () => {
    setNewFullName("");
    setNewUsername("");
    setNewPhone("");
    setNewPassword("");
    setNewCompanyName("");
    setNewRoles(["weaver"]);
    setIsCustomUsername(false);
    setIsCustomPassword(false);
    setCreateError(null);
    setShowCreateModal(true);
  };

  async function handleToggleStatus(u: UserSummary) {
    try {
      await userService.toggleUserStatus(u.userId, !u.isActive);
      setUsers((prev) =>
        prev.map((item) =>
          item.userId === u.userId ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateBusy(true);
    try {
      const created = await userService.createUser({
        username: newUsername.trim() || undefined,
        fullName: newFullName.trim(),
        phone: newPhone.trim() || undefined,
        password: newPassword.trim() || undefined,
        roles: newRoles,
        companyName: newRoles.includes("merchant") ? newCompanyName.trim() || undefined : undefined,
      });

      setShowCreateModal(false);
      setNewUsername("");
      setNewFullName("");
      setNewPhone("");
      setNewPassword("");
      setNewCompanyName("");
      setNewRoles(["weaver"]);
      setIsCustomUsername(false);
      setIsCustomPassword(false);

      setCreatedCredentials({
        fullName: created.fullName,
        username: created.username,
        initialPassword: created.initialPassword,
        roles: created.roles,
      });
      loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleSaveRoles() {
    if (!editingRolesUser) return;
    try {
      await userService.updateUserRoles(editingRolesUser.userId, targetRoles);
      setEditingRolesUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update roles");
    }
  }

  async function handleSavePassword() {
    if (!resetPasswordUser || !newPassInput) return;
    try {
      await userService.resetPassword(resetPasswordUser.userId, newPassInput);
      alert(`Password successfully updated for ${resetPasswordUser.username}`);
      setResetPasswordUser(null);
      setNewPassInput("");
    } catch (err: any) {
      alert(err.message || "Failed to reset password");
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div className="users-page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2>User & Role Management</h2>
          <p className="subtitle">Manage system accounts, assign RBAC permissions, and oversee user lifecycles.</p>
        </div>
        <button
          className="btn-primary"
          onClick={openCreateModal}
          style={{ padding: "0.6rem 1.2rem", cursor: "pointer", fontWeight: 600 }}
        >
          + Add New User
        </button>
      </header>

      {error && <div className="alert alert-error" style={{ padding: "1rem", background: "#fee2e2", color: "#b91c1c", marginBottom: "1rem", borderRadius: "6px" }}>{error}</div>}

      <div className="filters-bar" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name, username or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "240px", padding: "0.5rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{ padding: "0.5rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="weaver">Weavers</option>
          <option value="merchant">Merchants</option>
        </select>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: "2rem", textAlign: "center" }}>Loading users...</div>
      ) : (
        <div className="table-responsive" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "0.75rem 1rem" }}>User</th>
                <th style={{ padding: "0.75rem 1rem" }}>Roles</th>
                <th style={{ padding: "0.75rem 1rem" }}>Phone</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem" }}>Created</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.userId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b" }}>@{u.username}</div>
                      {u.merchantProfile?.companyName && (
                        <div style={{ fontSize: "0.8rem", color: "#0284c7" }}>
                          🏢 {u.merchantProfile.companyName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {(u.roles || []).map((r) => (
                          <span
                            key={r}
                            style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              background:
                                r === "admin" ? "#fef3c7" : r === "merchant" ? "#e0f2fe" : "#dcfce7",
                              color:
                                r === "admin" ? "#92400e" : r === "merchant" ? "#0369a1" : "#15803d",
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>{u.phone || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: u.isActive ? "#dcfce7" : "#fee2e2",
                          color: u.isActive ? "#166534" : "#991b1b",
                        }}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#64748b" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: "pointer" }}
                          onClick={() => {
                            setEditingRolesUser(u);
                            setTargetRoles(u.roles || []);
                          }}
                        >
                          Roles
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: "pointer" }}
                          onClick={() => {
                            setResetPasswordUser(u);
                            setNewPassInput("");
                          }}
                        >
                          Password
                        </button>
                        <button
                          className="btn-outline"
                          style={{
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            color: u.isActive ? "#dc2626" : "#16a34a",
                            borderColor: u.isActive ? "#fca5a5" : "#86efac",
                          }}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Add New System User</h3>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "#64748b" }}>
              Username and initial password are automatically created based on the user's name. The user can update their password later.
            </p>

            {createError && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Aster Aweke or Abebe Bikila"
                  value={newFullName}
                  onChange={(e) => handleFullNameChange(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  <span>Username</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>Auto-generated from name</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    setIsCustomUsername(true);
                    setNewUsername(e.target.value);
                  }}
                  placeholder="e.g. aster.aweke"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  <span>Initial Password</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>Auto-generated from name</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => {
                    setIsCustomPassword(true);
                    setNewPassword(e.target.value);
                  }}
                  placeholder="e.g. Aster@123"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0911..."
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Assign Roles
                </label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                  {(["admin", "weaver", "merchant"] as UserRole[]).map((r) => (
                    <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newRoles.includes(r)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRoles([...newRoles, r]);
                          } else {
                            setNewRoles(newRoles.filter((item) => item !== r));
                          }
                        }}
                      />
                      <span style={{ textTransform: "capitalize" }}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {newRoles.includes("merchant") && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Company / Trade Name
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Addis Textile Trading"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createBusy}
                  style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createBusy || !newFullName.trim()}
                  style={{ padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 600 }}
                >
                  {createBusy ? "Creating User..." : "✓ Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATED USER CREDENTIALS MODAL */}
      {createdCredentials && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "1rem",
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.35rem" }}>🎉</div>
              <h3 style={{ margin: "0 0 0.25rem", color: "#0f172a" }}>User Created Successfully!</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Account for <strong>{createdCredentials.fullName}</strong> is ready.
              </p>
            </div>

            <div
              style={{
                background: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                marginBottom: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Username
                </span>
                <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "#ea580c" }}>
                  {createdCredentials.username}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Initial Password
                </span>
                <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "#059669" }}>
                  {createdCredentials.initialPassword || "—"}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  Assigned Roles
                </span>
                <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.2rem" }}>
                  {createdCredentials.roles.map((r) => (
                    <span
                      key={r}
                      style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        background: r === "admin" ? "#fef3c7" : r === "merchant" ? "#e0f2fe" : "#dcfce7",
                        color: r === "admin" ? "#92400e" : r === "merchant" ? "#0369a1" : "#15803d",
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "0.75rem",
                borderRadius: "6px",
                fontSize: "0.825rem",
                color: "#1e40af",
                marginBottom: "1.25rem",
                display: "flex",
                gap: "0.5rem",
              }}
            >
              <span>💡</span>
              <span>
                Share these initial credentials with the user. The user can update their password anytime after signing in.
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => {
                  const text = `Awra Amba Textile Account:\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.initialPassword || ""}\nLogin: ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                }}
                className="btn-secondary"
                style={{ flex: 1, padding: "0.6rem", fontWeight: 600, cursor: "pointer" }}
              >
                {copied ? "✓ Copied to Clipboard!" : "📋 Copy Credentials"}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCreatedCredentials(null)}
                style={{ flex: 1, padding: "0.6rem", fontWeight: 600, cursor: "pointer" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLES MODAL */}
      {editingRolesUser && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Roles for {editingRolesUser.fullName}</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Select active authorization roles:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", margin: "1.5rem 0" }}>
              {(["admin", "weaver", "merchant"] as UserRole[]).map((r) => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={targetRoles.includes(r)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTargetRoles([...targetRoles, r]);
                      } else {
                        setTargetRoles(targetRoles.filter((item) => item !== r));
                      }
                    }}
                  />
                  <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{r}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                className="btn-secondary"
                onClick={() => setEditingRolesUser(null)}
                style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveRoles}
                style={{ padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 600 }}
              >
                Save Roles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-card"
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Reset Password</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Set a new password for <strong>@{resetPasswordUser.username}</strong> ({resetPasswordUser.fullName}).
            </p>
            <div style={{ margin: "1.25rem 0" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Enter new password"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                className="btn-secondary"
                onClick={() => setResetPasswordUser(null)}
                style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSavePassword}
                style={{ padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 600 }}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
