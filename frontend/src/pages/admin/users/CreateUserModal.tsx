import React, { useState, useEffect } from "react";
import type { UserRole } from "../../../domain/models";
import { userService } from "../../../infrastructure/services";
import { Button, FormField, Modal } from "../../../components/common";
import { deriveUsername, derivePassword } from "./useUsersManager";

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (credentials: {
    userId: number;
    fullName: string;
    username: string;
    initialPassword?: string;
    roles: UserRole[];
  }) => void;
  onRefreshList: () => Promise<void>;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
  onRefreshList,
}: CreateUserModalProps) {
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newRoles, setNewRoles] = useState<UserRole[]>(["weaver"]);
  const [isCustomUsername, setIsCustomUsername] = useState(false);
  const [isCustomPassword, setIsCustomPassword] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  const resetForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewUsername("");
    setNewPhone("");
    setNewPassword("");
    setNewCompanyName("");
    setNewRoles(["weaver"]);
    setIsCustomUsername(false);
    setIsCustomPassword(false);
    setCreateError(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const syncDerivedCredentials = (first: string, last: string) => {
    const combined = `${first} ${last}`.trim();
    if (!isCustomUsername) {
      setNewUsername(deriveUsername(combined));
    }
    if (!isCustomPassword) {
      setNewPassword(derivePassword(combined));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateBusy(true);

    try {
      const created = await userService.createUser({
        username: newUsername.trim() || undefined,
        firstName: newFirstName.trim(),
        lastName: newLastName.trim() || undefined,
        phone: newPhone.trim() || undefined,
        password: newPassword.trim() || undefined,
        roles: newRoles,
        companyName: newRoles.includes("merchant") ? newCompanyName.trim() || undefined : undefined,
      });

      resetForm();
      onClose();
      onUserCreated({
        userId: created.userId,
        fullName: created.fullName,
        username: created.username,
        initialPassword: created.initialPassword,
        roles: created.roles,
      });
      await onRefreshList();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User"
      subtitle="Username and password will be generated automatically, or you can customize them."
      maxWidth={480}
    >
      {createError && (
        <div className="alert-banner alert-banner--error mb-4">
          ⚠️ {createError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-row">
          <FormField label="First Name (ስም)" required>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Almaz"
              value={newFirstName}
              onChange={(e) => {
                const val = e.target.value;
                setNewFirstName(val);
                syncDerivedCredentials(val, newLastName);
              }}
            />
          </FormField>

          <FormField label="Last Name (የአባት ስም)">
            <input
              type="text"
              className="input"
              placeholder="e.g. Kebede"
              value={newLastName}
              onChange={(e) => {
                const val = e.target.value;
                setNewLastName(val);
                syncDerivedCredentials(newFirstName, val);
              }}
            />
          </FormField>
        </div>

        <FormField label="Username (መለያ ስም)">
          <input
            type="text"
            className="input"
            placeholder="almaz.kebede"
            value={newUsername}
            onChange={(e) => {
              setIsCustomUsername(true);
              setNewUsername(e.target.value);
            }}
          />
        </FormField>

        <FormField label="Phone Number (ስልክ)">
          <input
            type="tel"
            className="input"
            placeholder="0911234567"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
        </FormField>

        <FormField label="Temporary Password (የይለፍ ቃል)">
          <input
            type="text"
            className="input"
            placeholder="Awra@123"
            value={newPassword}
            onChange={(e) => {
              setIsCustomPassword(true);
              setNewPassword(e.target.value);
            }}
          />
        </FormField>

        <FormField label="Assigned Roles" required>
          <div className="cluster gap-md">
            {(["weaver", "merchant", "admin"] as UserRole[]).map((r) => (
              <label key={r} className="role-checkbox-label">
                <input
                  type="checkbox"
                  checked={newRoles.includes(r)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewRoles([...newRoles, r]);
                    } else if (newRoles.length > 1) {
                      setNewRoles(newRoles.filter((x) => x !== r));
                    }
                  }}
                  className="user-role-checkbox"
                />
                <span className="text-sm font-medium">{r}</span>
              </label>
            ))}
          </div>
        </FormField>

        {newRoles.includes("merchant") && (
          <FormField label="Company / Business Name">
            <input
              type="text"
              className="input"
              placeholder="e.g. Merkato Textile Shop"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />
          </FormField>
        )}

        <div className="modal-actions-cluster">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={createBusy}>
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateUserModal;
