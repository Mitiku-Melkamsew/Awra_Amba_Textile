import { request } from "../http/api-client";
import type { AuthUser, UserRole } from "../../domain/models";

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/** Client may still collect first/last for UX; we always send fullName to API. */
export interface SignupDto {
  username: string;
  password: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  role?: UserRole;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async signup(data: SignupDto): Promise<LoginResponse> {
    const fullName =
      (data.fullName && data.fullName.trim()) ||
      (data.companyName && data.companyName.trim()) ||
      [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

    return request<LoginResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        fullName,
        phone: data.phone ?? null,
        role: data.role ?? "weaver",
      }),
    });
  },

  async getMe(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>("/auth/me");
  },

  async updateProfile(data: {
    fullName: string;
    username: string;
    phone?: string | null;
  }): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};
