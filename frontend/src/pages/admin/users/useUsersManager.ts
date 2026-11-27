import { useEffect, useState, useMemo, useCallback } from "react";
import { userService } from "../../../infrastructure/services";
import type { UserSummary, UserRole } from "../../../domain/models";

export function deriveUsername(fullName: string): string {
  const cleaned = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".");
  return cleaned.length >= 2 ? cleaned.slice(0, 30) : "";
}

export function derivePassword(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.replace(/[^a-zA-Z0-9]/g, "");
  if (first && first.length >= 2) {
    return `${first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()}@123`;
  }
  return "Awra@123";
}

export function useUsersManager() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Load users callback
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.listUsers(
        selectedRole !== "all" ? (selectedRole as UserRole) : undefined
      );
      setUsers(data);
      if (data.length > 0 && selectedUserId === null) {
        setSelectedUserId(data[0].userId);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedUserId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return users[0] || null;
    return users.find((u) => u.userId === selectedUserId) || users[0] || null;
  }, [users, selectedUserId]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const combined = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.fullName;
      return (
        !q ||
        combined.toLowerCase().includes(q) ||
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    });
  }, [users, search]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return {
    users,
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
  };
}
