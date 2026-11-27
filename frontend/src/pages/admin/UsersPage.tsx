import { useState } from "react";
import type { UserRole, UserSummary } from "../../domain/models";
import { userService } from "../../infrastructure/services";
import { Alert, PageHeader } from "../../components/common";
import { useUsersManager } from "./users/useUsersManager";
import { UserListTable } from "./users/UserListTable";
import { UserProfilePane } from "./users/UserProfilePane";
import { CreateUserModal } from "./users/CreateUserModal";
import { CreatedCredentialsModal } from "./users/CreatedCredentialsModal";
import { DeactivateConfirmModal } from "./users/DeactivateConfirmModal";

export function UsersPage() {
  const {
    setUsers,
    loading,
    error,
    setError,
    successMsg,
    showSuccess,
    selectedRole,
    setSelectedRole,
    search,
    setSearch,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    filteredUsers,
    loadUsers,
  } = useUsersManager();

  // Dialog states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    initialPassword?: string;
    roles: UserRole[];
  } | null>(null);

  const handleUserUpdated = (updated: UserSummary) => {
    setUsers((prev) =>
      prev.map((u) => (u.userId === updated.userId ? updated : u))
    );
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedUser) return;
    setDeactivating(true);
    try {
      await userService.toggleUserStatus(selectedUser.userId, false);
      handleUserUpdated({ ...selectedUser, isActive: false });
      showSuccess(`${selectedUser.fullName} has been deactivated.`);
      setShowDeactivateModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to deactivate user");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <PageHeader
        eyebrow="ተጠቃሚዎች · USERS"
        title="Users and roles"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Add user
          </button>
        }
      />

      {/* Global Alerts */}
      {successMsg && (
        <Alert variant="success" onClose={() => showSuccess("")}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 2-Column Master-Detail Layout */}
      <div className="users-master-detail">
        <UserListTable
          users={filteredUsers}
          loading={loading}
          selectedUserId={selectedUserId}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          search={search}
          onSearchChange={setSearch}
          onSelectUser={(u) => setSelectedUserId(u.userId)}
          onAddUser={() => setShowCreateModal(true)}
        />

        <UserProfilePane
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
          onOpenDeactivateModal={() => setShowDeactivateModal(true)}
          showSuccess={showSuccess}
          onError={(msg) => setError(msg)}
        />
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={(creds) => {
          setCreatedCredentials(creds);
          setSelectedUserId(creds.userId);
          if (selectedRole !== "all" && !creds.roles.includes(selectedRole as UserRole)) {
            setSelectedRole("all");
          }
        }}
        onRefreshList={loadUsers}
      />

      <CreatedCredentialsModal
        credentials={createdCredentials}
        onClose={() => setCreatedCredentials(null)}
      />

      <DeactivateConfirmModal
        user={selectedUser}
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleConfirmDeactivate}
        isProcessing={deactivating}
      />
    </div>
  );
}

export default UsersPage;
