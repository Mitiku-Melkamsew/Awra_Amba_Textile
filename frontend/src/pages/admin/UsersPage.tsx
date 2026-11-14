import { useEffect, useState, useMemo } from "react";
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

function getAvatarColors(name: string, isActive: boolean) {
  if (!isActive) return { bg: "#f1f5f9", text: "#94a3b8" };
  const initial = (name[0] || "U").toUpperCase();
  if (initial === "A" || initial === "S") return { bg: "#ffedd5", text: "#9a3412" };
  if (initial === "W") return { bg: "#fed7aa", text: "#c2410c" };
  if (initial === "M") return { bg: "#fef3c7", text: "#92400e" };
  return { bg: "#ffedd5", text: "#9a3412" };
}

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Selected user for the right pane
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Selected user edited roles
  const [paneRoles, setPaneRoles] = useState<UserRole[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  // Reset password state in right pane
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  // Deactivate confirm modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Add User Modal state
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

  // Created credentials popup
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    initialPassword?: string;
    roles: UserRole[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await userService.listUsers(
        selectedRole !== "all" ? (selectedRole as UserRole) : undefined
      );
      setUsers(data);
      if (data.length > 0 && selectedUserId === null) {
        setSelectedUserId(data[0].userId);
        setPaneRoles(data[0].roles || []);
      }
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

  // Keep selected user in sync
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return users[0] || null;
    return users.find((u) => u.userId === selectedUserId) || users[0] || null;
  }, [users, selectedUserId]);

  // Sync paneRoles whenever selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setPaneRoles(selectedUser.roles || []);
      setShowPasswordReset(false);
      setNewPasswordInput("");
    }
  }, [selectedUser?.userId]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      return (
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    });
  }, [users, search]);

  const handleSelectUser = (u: UserSummary) => {
    setSelectedUserId(u.userId);
    setPaneRoles(u.roles || []);
    setShowPasswordReset(false);
    setNewPasswordInput("");
  };

  const handleTogglePaneRole = (role: UserRole) => {
    if (paneRoles.includes(role)) {
      if (paneRoles.length === 1) return; // Keep at least one role
      setPaneRoles(paneRoles.filter((r) => r !== role));
    } else {
      setPaneRoles([...paneRoles, role]);
    }
  };

  const handleSavePaneRoles = async () => {
    if (!selectedUser) return;
    setSavingRoles(true);
    setError(null);
    try {
      await userService.updateUserRoles(selectedUser.userId, paneRoles);
      setSuccessMsg(`Roles successfully updated for ${selectedUser.fullName}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === selectedUser.userId ? { ...u, roles: paneRoles } : u
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to update roles");
    } finally {
      setSavingRoles(false);
    }
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPasswordInput.trim()) return;
    setResettingPassword(true);
    try {
      await userService.resetPassword(selectedUser.userId, newPasswordInput.trim());
      setSuccessMsg(`Password successfully updated for ${selectedUser.username}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowPasswordReset(false);
      setNewPasswordInput("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleActiveStatus = async () => {
    if (!selectedUser) return;
    try {
      const nextActive = !selectedUser.isActive;
      await userService.toggleUserStatus(selectedUser.userId, nextActive);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === selectedUser.userId ? { ...u, isActive: nextActive } : u
        )
      );
      setSuccessMsg(
        nextActive
          ? `${selectedUser.fullName} has been reactivated.`
          : `${selectedUser.fullName} has been deactivated.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowDeactivateModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

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

  const handleCreateUser = async (e: React.FormEvent) => {
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
      setCreatedCredentials({
        fullName: created.fullName,
        username: created.username,
        initialPassword: created.initialPassword,
        roles: created.roles,
      });
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem 3rem" }}>
      {/* Overline & Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
            ተጠቃሚዎች · USERS
          </div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Users and roles
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#c2410c",
            color: "#ffffff",
            border: "none",
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(194, 65, 12, 0.2)",
            transition: "background 0.15s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#9a3412")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#c2410c")}
        >
          <span>+</span> Add user
        </button>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>✓</span> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          background: "#ffffff",
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1", minWidth: "260px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name, username or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.25rem",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {[
            { id: "all", label: "All" },
            { id: "admin", label: "Admins" },
            { id: "weaver", label: "Weavers" },
            { id: "merchant", label: "Merchants" },
          ].map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                style={{
                  background: isSelected ? "#059669" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#475569",
                  border: isSelected ? "1px solid #059669" : "1px solid #e2e8f0",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Split Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 380px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Users Table */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12.5px" }}>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>User</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Roles</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Phone</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "0.85rem 1rem", fontWeight: 600, textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                    Loading users…
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUser?.userId === u.userId;
                  const colors = getAvatarColors(u.fullName, u.isActive);
                  const initial = (u.fullName[0] || "U").toUpperCase();

                  return (
                    <tr
                      key={u.userId}
                      onClick={() => handleSelectUser(u)}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        background: isSelected ? "#fffdf5" : "transparent",
                        borderLeft: isSelected ? "3px solid #c2410c" : "3px solid transparent",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* User Avatar + Name + Username */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: colors.bg,
                              color: colors.text,
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
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {u.fullName}
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {(u.roles || []).map((r) => {
                            if (r === "admin") {
                              return (
                                <span key={r} style={{ background: "#ffedd5", color: "#9a3412", fontSize: "12px", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                                  Admin
                                </span>
                              );
                            }
                            if (r === "weaver") {
                              return (
                                <span key={r} style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                                  Weaver
                                </span>
                              );
                            }
                            return (
                              <span key={r} style={{ background: "#f1f5f9", color: "#334155", fontSize: "12px", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                                Merchant
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: "0.85rem 1rem", color: "#64748b", whiteSpace: "nowrap" }}>
                        {u.phone ? `[${u.phone}]` : "—"}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {u.isActive ? (
                          <span style={{ background: "#dcfce7", color: "#166534", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            ✓ Active
                          </span>
                        ) : (
                          <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td style={{ padding: "0.85rem 1rem", color: "#64748b", whiteSpace: "nowrap", fontSize: "13px" }}>
                        [date]
                      </td>

                      {/* Action */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(u);
                          }}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            padding: "0.35rem 0.85rem",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#334155",
                            cursor: "pointer",
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: User Management Pane */}
        <div
          style={{
            position: "sticky",
            top: "1.5rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            padding: "1.5rem",
          }}
        >
          {selectedUser ? (
            <>
              {/* User Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: getAvatarColors(selectedUser.fullName, selectedUser.isActive).bg,
                      color: getAvatarColors(selectedUser.fullName, selectedUser.isActive).text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "16px",
                    }}
                  >
                    {(selectedUser.fullName[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                      {selectedUser.fullName}
                    </h3>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      @{selectedUser.username}
                    </div>
                  </div>
                </div>

                {selectedUser.isActive ? (
                  <span style={{ background: "#dcfce7", color: "#166534", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                    ✓ Active
                  </span>
                ) : (
                  <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "12.5px", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                    Deactivated
                  </span>
                )}
              </div>

              {/* Roles Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  Roles
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {/* Weaver Card */}
                  <div
                    onClick={() => handleTogglePaneRole("weaver")}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      border: paneRoles.includes("weaver") ? "1.5px solid #c2410c" : "1px solid #e2e8f0",
                      background: paneRoles.includes("weaver") ? "#fffdf5" : "#ffffff",
                      borderRadius: "8px",
                      padding: "0.75rem 0.85rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={paneRoles.includes("weaver")}
                      onChange={() => {}}
                      style={{ marginTop: "0.2rem", accentColor: "#c2410c" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                        Weaver
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "0.15rem", lineHeight: 1.35 }}>
                        Sees their own zigs, settlements and transactions, plus fabric prices.
                      </div>
                    </div>
                  </div>

                  {/* Merchant Card */}
                  <div
                    onClick={() => handleTogglePaneRole("merchant")}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      border: paneRoles.includes("merchant") ? "1.5px solid #c2410c" : "1px solid #e2e8f0",
                      background: paneRoles.includes("merchant") ? "#fffdf5" : "#ffffff",
                      borderRadius: "8px",
                      padding: "0.75rem 0.85rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={paneRoles.includes("merchant")}
                      onChange={() => {}}
                      style={{ marginTop: "0.2rem", accentColor: "#c2410c" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                        Merchant
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "0.15rem", lineHeight: 1.35 }}>
                        Sees the catalog and their own transactions.
                      </div>
                    </div>
                  </div>

                  {/* Admin Card */}
                  <div
                    onClick={() => handleTogglePaneRole("admin")}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      border: paneRoles.includes("admin") ? "1.5px solid #c2410c" : "1px solid #e2e8f0",
                      background: paneRoles.includes("admin") ? "#fffdf5" : "#ffffff",
                      borderRadius: "8px",
                      padding: "0.75rem 0.85rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={paneRoles.includes("admin")}
                      onChange={() => {}}
                      style={{ marginTop: "0.2rem", accentColor: "#c2410c" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                        Admin
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "0.15rem", lineHeight: 1.35 }}>
                        Full access: production, prices, users, settlements and payments.
                      </div>
                      <div style={{ background: "#fffbe8", color: "#92400e", fontSize: "11.5px", padding: "0.25rem 0.45rem", borderRadius: "4px", marginTop: "0.4rem", fontWeight: 600 }}>
                        ⚠️ Can pay settlements and change prices
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSavePaneRoles}
                  disabled={savingRoles}
                  style={{
                    marginTop: "0.85rem",
                    width: "100%",
                    background: "#c2410c",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.65rem",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: savingRoles ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(194, 65, 12, 0.2)",
                  }}
                >
                  {savingRoles ? "Saving…" : "Save roles"}
                </button>
              </div>

              {/* Password Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  Password
                </h4>

                {!showPasswordReset ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    style={{
                      width: "100%",
                      background: "#ffffff",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Reset password
                  </button>
                ) : (
                  <form onSubmit={handleSaveResetPassword} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <input
                      type="text"
                      placeholder="Enter new password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      required
                      style={{
                        padding: "0.55rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13.5px",
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordReset(false);
                          setNewPasswordInput("");
                        }}
                        style={{
                          flex: 1,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          padding: "0.5rem",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resettingPassword}
                        style={{
                          flex: 1,
                          background: "#c2410c",
                          color: "#ffffff",
                          border: "none",
                          padding: "0.5rem",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: resettingPassword ? "not-allowed" : "pointer",
                        }}
                      >
                        {resettingPassword ? "Updating…" : "Update"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Account Section */}
              <div>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  Account
                </h4>

                {selectedUser.isActive ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowDeactivateModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "#dc2626",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      Deactivate this user...
                    </button>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "0.25rem" }}>
                      They can no longer sign in. Their records stay.
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={handleToggleActiveStatus}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "#059669",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      Reactivate this user...
                    </button>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "0.25rem" }}>
                      Restore login access for this user.
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#94a3b8", fontSize: "14px" }}>
              Select a user to manage roles and account details.
            </div>
          )}
        </div>
      </div>

      {/* Deactivate Safety Modal */}
      {showDeactivateModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setShowDeactivateModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "18px", fontWeight: 800, color: "#991b1b" }}>
              Deactivate {selectedUser.fullName}?
            </h3>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              They will no longer be able to sign in to the platform. All historical transactions, zigs, and payment logs will remain intact.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#475569",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleActiveStatus}
                style={{
                  background: "#dc2626",
                  border: "none",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Yes, deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
              Add New User
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 1.25rem" }}>
              Username and password will be generated automatically, or you can customize them.
            </p>

            {createError && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "0.6rem 0.8rem", borderRadius: "8px", fontSize: "13px", marginBottom: "1rem" }}>
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Full Name (የተጠቃሚ ሙሉ ስም) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almaz Kebede"
                  value={newFullName}
                  onChange={(e) => handleFullNameChange(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="almaz.kebede"
                  value={newUsername}
                  onChange={(e) => {
                    setIsCustomUsername(true);
                    setNewUsername(e.target.value);
                  }}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="0911234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                  Temporary Password
                </label>
                <input
                  type="text"
                  placeholder="Awra@123"
                  value={newPassword}
                  onChange={(e) => {
                    setIsCustomPassword(true);
                    setNewPassword(e.target.value);
                  }}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.5rem" }}>
                  Roles
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {(["weaver", "merchant", "admin"] as UserRole[]).map((r) => (
                    <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "13.5px", cursor: "pointer", textTransform: "capitalize" }}>
                      <input
                        type="checkbox"
                        checked={newRoles.includes(r)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRoles([...newRoles, r]);
                          } else {
                            if (newRoles.length > 1) {
                              setNewRoles(newRoles.filter((x) => x !== r));
                            }
                          }
                        }}
                        style={{ accentColor: "#c2410c" }}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              {newRoles.includes("merchant") && (
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>
                    Company / Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Merkato Textile Shop"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBusy}
                  style={{
                    background: "#c2410c",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: createBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {createBusy ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Credentials Modal */}
      {createdCredentials && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setCreatedCredentials(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "28px", textAlign: "center", marginBottom: "0.5rem" }}>🎉</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "18px", fontWeight: 800, textAlign: "center", color: "#0f172a" }}>
              User Successfully Created
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", textAlign: "center", margin: "0 0 1.25rem" }}>
              Share these credentials with {createdCredentials.fullName}.
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "13.5px" }}>
                <span style={{ color: "#64748b" }}>Username:</span>
                <strong style={{ color: "#0f172a" }}>{createdCredentials.username}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "13.5px" }}>
                <span style={{ color: "#64748b" }}>Password:</span>
                <strong style={{ color: "#c2410c" }}>{createdCredentials.initialPassword || "••••••••"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                <span style={{ color: "#64748b" }}>Roles:</span>
                <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{createdCredentials.roles.join(", ")}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Username: ${createdCredentials.username}\nPassword: ${createdCredentials.initialPassword}`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  flex: 1,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  padding: "0.6rem",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ Copied!" : "Copy info"}
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                style={{
                  flex: 1,
                  background: "#c2410c",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.6rem",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
