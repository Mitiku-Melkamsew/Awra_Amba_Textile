import React, { useState, useEffect } from "react";
import type { UserSummary, UserRole } from "../../../domain/models";
import { ApiError } from "../../../infrastructure/http/api-client";
import { userService } from "../../../infrastructure/services";
import { Badge, Button, Card } from "../../../components/common";
import { toTitleCase } from "../../../utils/formatters";

const PASSWORD_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && Array.isArray(err.details) && err.details.length > 0) {
    const msgs = err.details
      .map((d: unknown) =>
        d && typeof d === "object" && "message" in d ? String((d as { message: unknown }).message) : ""
      )
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join(". ");
  }
  return err instanceof Error ? err.message : fallback;
}

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
      <Card className="user-profile-card">
        <div className="user-profile-empty">
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
      showSuccess(`Roles successfully updated for ${toTitleCase(user.fullName)}.`);
      onUserUpdated({ ...user, roles: paneRoles });
    } catch (err: any) {
      onError(err.message || "Failed to update roles");
    } finally {
      setSavingRoles(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPasswordInput.trim();
    if (!trimmed) return;
    if (trimmed.length < 8 || !PASSWORD_COMPLEXITY_RE.test(trimmed)) {
      onError("Password must be at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }
    setResettingPassword(true);
    try {
      await userService.resetPassword(user.userId, trimmed);
      showSuccess(`Password successfully updated for ${user.username}.`);
      setShowPasswordReset(false);
      setNewPasswordInput("");
    } catch (err: unknown) {
      onError(formatApiError(err, "Failed to reset password"));
    } finally {
      setResettingPassword(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await userService.toggleUserStatus(user.userId, true);
      showSuccess(`${toTitleCase(user.fullName)} has been reactivated.`);
      onUserUpdated({ ...user, isActive: true });
    } catch (err: any) {
      onError(err.message || "Failed to update status");
    }
  };

  return (
    <Card className="user-profile-card">
      {/* User Header */}
      <div className="cluster-between user-profile-header">
        <div className="cluster">
          <div className="user-avatar-lg">
            {(user.fullName[0] || "U").toUpperCase()}
          </div>
          <div>
            <h3 className="card-title">{toTitleCase(user.fullName)}</h3>
            <div className="text-sm text-muted">@{user.username}</div>
          </div>
        </div>

        <Badge variant={user.isActive ? "success" : "danger"} pill dot>
          {user.isActive ? "Active" : "Deactivated"}
        </Badge>
      </div>

      {/* Roles Section */}
      <div className="stack-sm user-profile-section">
        <h4 className="text-sm font-bold">Roles & Permissions</h4>

        <div className="stack-sm">
          {/* Weaver Role Card */}
          <div
            onClick={() => handleToggleRole("weaver")}
            className={`user-role-card ${paneRoles.includes("weaver") ? "selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={paneRoles.includes("weaver")}
              onChange={() => {}}
              className="user-role-checkbox"
            />
            <div className="user-role-content">
              <div className="user-role-title">Weaver (ሸማኔ)</div>
              <div className="user-role-desc">
                Access to personal zigs, settlements, wage calculations and rates.
              </div>
            </div>
          </div>

          {/* Merchant Role Card */}
          <div
            onClick={() => handleToggleRole("merchant")}
            className={`user-role-card ${paneRoles.includes("merchant") ? "selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={paneRoles.includes("merchant")}
              onChange={() => {}}
              className="user-role-checkbox"
            />
            <div className="user-role-content">
              <div className="user-role-title">Merchant (ነጋዴ)</div>
              <div className="user-role-desc">
                Access to wholesale catalog and commercial orders.
              </div>
            </div>
          </div>

          {/* Admin Role Card */}
          <div
            onClick={() => handleToggleRole("admin")}
            className={`user-role-card ${paneRoles.includes("admin") ? "selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={paneRoles.includes("admin")}
              onChange={() => {}}
              className="user-role-checkbox"
            />
            <div className="user-role-content">
              <div className="user-role-title">Administrator</div>
              <div className="user-role-desc">
                Full system control: users, prices, inventory, payroll settlements.
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveRoles}
          isLoading={savingRoles}
          fullWidth
          className="mt-2"
        >
          Save roles
        </Button>
      </div>

      {/* Password Management */}
      <div className="stack-sm user-profile-section">
        <h4 className="text-sm font-bold">Password</h4>
        {!showPasswordReset ? (
          <Button
            variant="secondary"
            onClick={() => setShowPasswordReset(true)}
            fullWidth
          >
            Reset password
          </Button>
        ) : (
          <form onSubmit={handleResetPassword} className="stack-sm">
            <input
              type="text"
              className="input"
              placeholder="Min 8 chars (A-z, 0-9)"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-muted">
              At least 8 characters with uppercase, lowercase, and a number.
            </p>
            <div className="cluster gap-sm">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowPasswordReset(false);
                  setNewPasswordInput("");
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={resettingPassword}
                fullWidth
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
              fullWidth
            >
              Deactivate user…
            </Button>
            <p className="text-xs text-muted mt-1">
              They will no longer be able to sign in. All historical records remain intact.
            </p>
          </div>
        ) : (
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReactivate}
              fullWidth
            >
              Reactivate user…
            </Button>
            <p className="text-xs text-muted mt-1">
              Restores login access for this user.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default UserProfilePane;
