import React, { useState, useEffect } from "react";
import type { UserSummary, UserRole } from "../../../domain/models";
import { userService } from "../../../infrastructure/services";
import { Badge, Button, Card } from "../../../components/common";

export interface UserProfilePaneProps {
  user: UserSummary | null;
  onUserUpdated: (updated: UserSummary) => void;
  onOpenDeactivateModal: () => void;
  showSuccess: (msg: string) => void;
  onError: (err: string) => void;
}

export function UserProfilePane({
  user,
  onUserUpdated,
  onOpenDeactivateModal,
  showSuccess,
  onError,
}: UserProfilePaneProps) {
  const [paneRoles, setPaneRoles] = useState<UserRole[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  // Password reset accordion
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setPaneRoles(user.roles || []);
      setShowPasswordReset(false);
      setNewPasswordInput("");
    }
  }, [user]);

  if (!user) {
    return (
      <Card style={{ position: "sticky", top: "1.5rem" }}>
        <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-muted)" }}>
          Select a user to manage roles and account details.
        </div>
      </Card>
    );
  }

  const handleToggleRole = (role: UserRole) => {
    if (paneRoles.includes(role)) {
      if (paneRoles.length === 1) return; // Keep at least one role
      setPaneRoles(paneRoles.filter((r) => r !== role));
    } else {
      setPaneRoles([...paneRoles, role]);
    }
  };

  const handleSaveRoles = async () => {
    setSavingRoles(true);
    try {
      await userService.updateUserRoles(user.userId, paneRoles);
      showSuccess(`Roles successfully updated for ${user.fullName}.`);
      onUserUpdated({ ...user, roles: paneRoles });
    } catch (err: any) {
      onError(err.message || "Failed to update roles");
    } finally {
      setSavingRoles(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) return;
    setResettingPassword(true);
    try {
      await userService.resetPassword(user.userId, newPasswordInput.trim());
      showSuccess(`Password successfully updated for ${user.username}.`);
      setShowPasswordReset(false);
      setNewPasswordInput("");
    } catch (err: any) {
      onError(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await userService.toggleUserStatus(user.userId, true);
      showSuccess(`${user.fullName} has been reactivated.`);
      onUserUpdated({ ...user, isActive: true });
    } catch (err: any) {
      onError(err.message || "Failed to update status");
    }
  };

  return (
    <Card style={{ position: "sticky", top: "1.5rem", padding: "var(--space-6)" }}>
      {/* User Header */}
      <div className="cluster-between" style={{ marginBottom: "var(--space-6)" }}>
        <div className="cluster">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--brand-light, #ffedd5)",
              color: "var(--brand, #c2410c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "18px",
            }}
          >
            {(user.fullName[0] || "U").toUpperCase()}
          </div>
          <div>
            <h3 className="card-title">{user.fullName}</h3>
            <div className="text-sm text-muted">@{user.username}</div>
          </div>
        </div>

        <Badge variant={user.isActive ? "success" : "danger"} pill dot>
          {user.isActive ? "Active" : "Deactivated"}
        </Badge>
      </div>

      {/* Roles Section */}
      <div className="stack-sm" style={{ marginBottom: "var(--space-6)" }}>
        <h4 className="text-sm font-bold">Roles & Permissions</h4>

        <div className="stack-sm">
          {/* Weaver Role Card */}
          <div
            onClick={() => handleToggleRole("weaver")}
            className="cluster"
            style={{
              alignItems: "flex-start",
              border: `1.5px solid ${paneRoles.includes("weaver") ? "var(--brand)" : "var(--border)"}`,
              background: paneRoles.includes("weaver") ? "var(--orange-bg, #fffdf5)" : "var(--surface)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-3)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={paneRoles.includes("weaver")}
              onChange={() => {}}
              style={{ marginTop: "3px", accentColor: "var(--brand)" }}
            />
            <div style={{ flex: 1 }}>
              <div className="font-bold text-sm">Weaver (ሸማኔ)</div>
              <div className="text-xs text-muted" style={{ marginTop: "2px" }}>
                Access to personal zigs, settlements, wage calculations and rates.
              </div>
            </div>
          </div>

          {/* Merchant Role Card */}
          <div
            onClick={() => handleToggleRole("merchant")}
            className="cluster"
            style={{
              alignItems: "flex-start",
              border: `1.5px solid ${paneRoles.includes("merchant") ? "var(--brand)" : "var(--border)"}`,
              background: paneRoles.includes("merchant") ? "var(--orange-bg, #fffdf5)" : "var(--surface)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-3)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={paneRoles.includes("merchant")}
              onChange={() => {}}
              style={{ marginTop: "3px", accentColor: "var(--brand)" }}
            />
            <div style={{ flex: 1 }}>
              <div className="font-bold text-sm">Merchant (ነጋዴ)</div>
              <div className="text-xs text-muted" style={{ marginTop: "2px" }}>
                Access to wholesale catalog and commercial orders.
              </div>
            </div>
          </div>

          {/* Admin Role Card */}
          <div
            onClick={() => handleToggleRole("admin")}
            className="cluster"
            style={{
              alignItems: "flex-start",
              border: `1.5px solid ${paneRoles.includes("admin") ? "var(--brand)" : "var(--border)"}`,
              background: paneRoles.includes("admin") ? "var(--orange-bg, #fffdf5)" : "var(--surface)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-3)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={paneRoles.includes("admin")}
              onChange={() => {}}
              style={{ marginTop: "3px", accentColor: "var(--brand)" }}
            />
            <div style={{ flex: 1 }}>
              <div className="font-bold text-sm">Administrator</div>
              <div className="text-xs text-muted" style={{ marginTop: "2px" }}>
                Full system control: users, prices, inventory, payroll settlements.
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveRoles}
          isLoading={savingRoles}
          style={{ width: "100%", marginTop: "var(--space-2)" }}
        >
          Save roles
        </Button>
      </div>

      {/* Password Management */}
      <div className="stack-sm" style={{ marginBottom: "var(--space-6)" }}>
        <h4 className="text-sm font-bold">Password</h4>
        {!showPasswordReset ? (
          <Button
            variant="secondary"
            onClick={() => setShowPasswordReset(true)}
            style={{ width: "100%" }}
          >
            Reset password
          </Button>
        ) : (
          <form onSubmit={handleResetPassword} className="stack-sm">
            <input
              type="text"
              className="input"
              placeholder="Enter new password"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              required
            />
            <div className="cluster" style={{ gap: "var(--space-2)" }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowPasswordReset(false);
                  setNewPasswordInput("");
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={resettingPassword}
                style={{ flex: 1 }}
              >
                Update
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Account Status / Danger Zone */}
      <div className="stack-sm">
        <h4 className="text-sm font-bold">Account Access</h4>
        {user.isActive ? (
          <div>
            <Button
              variant="danger"
              size="sm"
              onClick={onOpenDeactivateModal}
              style={{ width: "100%" }}
            >
              Deactivate user…
            </Button>
            <p className="text-xs text-muted" style={{ marginTop: "var(--space-1)" }}>
              They will no longer be able to sign in. All historical records remain intact.
            </p>
          </div>
        ) : (
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReactivate}
              style={{ width: "100%", color: "var(--green)" }}
            >
              Reactivate user…
            </Button>
            <p className="text-xs text-muted" style={{ marginTop: "var(--space-1)" }}>
              Restores login access for this user.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default UserProfilePane;
