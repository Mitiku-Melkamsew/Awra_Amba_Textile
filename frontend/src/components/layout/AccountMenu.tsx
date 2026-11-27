import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../infrastructure/http/api-client";
import { authService } from "../../infrastructure/services";
import { Alert, Badge, Button, Modal } from "../common";
import { toTitleCase } from "../../utils/formatters";

const PASSWORD_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

function formatError(err: unknown, fallback: string): string {
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

export function AccountMenu() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Profile details state
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Change-password state inside Profile Management modal
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [menuOpen]);

  const rawName = user?.fullName || user?.username || "Account";
  const displayName = toTitleCase(rawName);
  const initials =
    rawName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";

  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];

  const handleSignOut = () => {
    setMenuOpen(false);
    logout();
    navigate("/", { replace: true });
  };

  const handleOpenProfile = () => {
    setMenuOpen(false);
    const fallbackParts = (user?.fullName || "").trim().split(/\s+/).filter(Boolean);
    setFirstNameInput(user?.firstName ?? fallbackParts[0] ?? "");
    setLastNameInput(
      user?.lastName ?? (fallbackParts.length > 1 ? fallbackParts.slice(1).join(" ") : "")
    );
    setUsernameInput(user?.username || "");
    setPhoneInput(user?.phone || "");
    setProfileError("");
    setProfileSuccess("");
    setPasswordError("");
    setPasswordSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileOpen(true);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const trimmedFirst = firstNameInput.trim();
    const trimmedLast = lastNameInput.trim();
    const trimmedUsername = usernameInput.trim();
    const trimmedPhone = phoneInput.trim();

    if (!trimmedFirst) {
      setProfileError("First name is required.");
      return;
    }
    if (trimmedUsername.length < 3) {
      setProfileError("Username must be at least 3 characters.");
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        firstName: trimmedFirst,
        lastName: trimmedLast || null,
        username: trimmedUsername,
        phone: trimmedPhone || null,
      });
      setProfileSuccess("Profile updated successfully.");
    } catch (err: unknown) {
      setProfileError(formatError(err, "Failed to update profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (newPassword.length < 8 || !PASSWORD_COMPLEXITY_RE.test(newPassword)) {
      setPasswordError(
        "New password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError(formatError(err, "Failed to update password."));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <div className="account-menu" ref={menuRef}>
        <button
          type="button"
          className="account-trigger"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="account-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="account-name">{displayName}</span>
          <span className="account-caret" aria-hidden="true">
            ▾
          </span>
        </button>

        {menuOpen && (
          <div className="account-dropdown" role="menu">
            <div className="account-dropdown-header">
              <div className="account-dropdown-title">{displayName}</div>
              {user?.username && (
                <div className="account-dropdown-sub">@{user.username}</div>
              )}
              {roles.length > 0 && (
                <div className="account-dropdown-roles">
                  {roles.map((r) => (
                    <Badge
                      key={r}
                      variant={r === "admin" ? "brand" : r === "weaver" ? "info" : "neutral"}
                      pill
                    >
                      {toTitleCase(r)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="account-dropdown-divider" />

            <button
              type="button"
              className="account-dropdown-item"
              role="menuitem"
              onClick={handleOpenProfile}
            >
              <span>Profile management</span>
            </button>

            <button
              type="button"
              className="account-dropdown-item is-danger"
              role="menuitem"
              onClick={handleSignOut}
            >
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Profile management"
        subtitle={user?.username ? `@${user.username}` : undefined}
        maxWidth={480}
      >
        <div className="stack">
          <form onSubmit={handleSaveProfile} className="stack-sm">
            <div className="cluster-between">
              <h4 className="account-section-title">Account details</h4>
              <div className="cluster gap-xs">
                {roles.map((r) => (
                  <Badge
                    key={r}
                    variant={r === "admin" ? "brand" : r === "weaver" ? "info" : "neutral"}
                    pill
                  >
                    {toTitleCase(r)}
                  </Badge>
                ))}
              </div>
            </div>

            {profileSuccess && (
              <Alert variant="success" onClose={() => setProfileSuccess("")}>
                {profileSuccess}
              </Alert>
            )}
            {profileError && (
              <Alert variant="error" onClose={() => setProfileError("")}>
                {profileError}
              </Alert>
            )}

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">First name</span>
                <input
                  type="text"
                  className="input"
                  value={firstNameInput}
                  onChange={(e) => setFirstNameInput(e.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Last name (optional)</span>
                <input
                  type="text"
                  className="input"
                  value={lastNameInput}
                  onChange={(e) => setLastNameInput(e.target.value)}
                />
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Username</span>
                <input
                  type="text"
                  className="input"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  minLength={3}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Phone number</span>
                <input
                  type="tel"
                  className="input"
                  placeholder="+251 9xx xxx xxx"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
              </label>
            </div>

            <div className="account-modal-actions">
              <Button type="submit" variant="primary" size="sm" isLoading={savingProfile}>
                Save profile
              </Button>
            </div>
          </form>

          <div className="account-dropdown-divider" />

          <form onSubmit={handleChangePassword} className="stack-sm account-password-form">
            <h4 className="account-section-title">Change password</h4>

            {passwordSuccess && (
              <Alert variant="success" onClose={() => setPasswordSuccess("")}>
                {passwordSuccess}
              </Alert>
            )}
            {passwordError && (
              <Alert variant="error" onClose={() => setPasswordError("")}>
                {passwordError}
              </Alert>
            )}

            <label className="form-field">
              <span className="form-label">Current password</span>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">New password</span>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 chars (A-z, 0-9)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Confirm new password</span>
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </div>

            <p className="text-xs text-muted">
              At least 8 characters with uppercase, lowercase, and a number.
            </p>

            <div className="account-modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setProfileOpen(false)}
              >
                Close
              </Button>
              <Button type="submit" variant="primary" isLoading={savingPassword}>
                Update password
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

export default AccountMenu;
