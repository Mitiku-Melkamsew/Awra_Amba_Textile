import { request } from "../http/api-client";
import type { UserSummary, UserRole, Weaver } from "../../domain/models";

export interface CreateUserDto {
  username?: string;
  password?: string;
  firstName: string;
  lastName?: string | null;
  phone?: string;
  roles?: UserRole[];
  role?: UserRole;
  companyName?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string | null;
  phone?: string;
  companyName?: string;
}

export const userService = {
  async listUsers(filter?: { role?: UserRole; isActive?: boolean } | UserRole): Promise<UserSummary[]> {
    const params = new URLSearchParams();
    if (typeof filter === "string") {
      params.append("role", filter);
    } else if (filter) {
      if (filter.role) params.append("role", filter.role);
      if (filter.isActive !== undefined) params.append("isActive", String(filter.isActive));
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await request<any>(`/users${query}`);
    return Array.isArray(res) ? res : (res.users ?? []);
  },

  async listWeavers(filter?: { isActive?: boolean }): Promise<Weaver[]> {
    const params = new URLSearchParams({ role: "weaver" });
    if (filter?.isActive !== undefined) {
      params.append("isActive", String(filter.isActive));
    }
    const res = await request<any>(`/users?${params.toString()}`);
    const users: UserSummary[] = Array.isArray(res) ? res : (res.users ?? []);
    return users.map((u) => {
      const fullName = u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
      return {
        userId: u.userId,
        firstName: u.firstName || fullName,
        lastName: u.lastName ?? "",
        fullName,
        phone: u.phone,
        email: u.email ?? null,
        isActive: u.isActive,
        user: {
          userId: u.userId,
          username: u.username,
          isActive: u.isActive,
        },
      };
    });
  },

  async getUser(id: number): Promise<UserSummary> {
    return request<UserSummary>(`/users/${id}`);
  },

  async createUser(data: CreateUserDto): Promise<UserSummary> {
    return request<UserSummary>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: number, data: UpdateUserDto): Promise<UserSummary> {
    return request<UserSummary>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async updateUserRoles(id: number, roles: UserRole[]): Promise<{ roles: UserRole[] }> {
    return request<{ roles: UserRole[] }>(`/users/${id}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles }),
    });
  },

  async resetPassword(id: number, newPassword: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  },

  async toggleUserStatus(id: number, isActive: boolean): Promise<{ isActive: boolean }> {
    return request<{ isActive: boolean }>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },
};
