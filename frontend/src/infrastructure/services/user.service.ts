import { request } from "../http/api-client";
import type { UserSummary, UserRole, Weaver } from "../../domain/models";

export interface CreateUserDto {
  username?: string;
  password?: string;
  fullName: string;
  phone?: string;
  roles?: UserRole[];
  role?: UserRole;
  companyName?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  companyName?: string;
}

export const userService = {
  async listUsers(role?: UserRole): Promise<UserSummary[]> {
    const query = role ? `?role=${role}` : "";
    const res = await request<any>(`/users${query}`);
    return Array.isArray(res) ? res : (res.users ?? []);
  },

  async listWeavers(): Promise<Weaver[]> {
    const res = await request<any>("/users?role=weaver");
    const users: UserSummary[] = Array.isArray(res) ? res : (res.users ?? []);
    return users.map((u) => {
      const parts = u.fullName.split(" ");
      return {
        weaverId: u.weaverProfile?.weaverId ?? u.userId,
        userId: u.userId,
        firstName: parts[0] || u.fullName,
        lastName: parts.slice(1).join(" ") || "",
        fullName: u.fullName,
        phone: u.phone,
        email: u.weaverProfile?.email ?? null,
        bankAccountNumber: u.weaverProfile?.bankAccountNumber ?? null,
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
    return request<{ message: string }>(`/users/${id}/password`, {
      method: "PUT",
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
