import { request, setToken } from "../http/api-client";
import type { AuthUser, UserRole } from "../../domain/models";

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/** Auth signup payload aligned with User model (firstName + optional lastName). */
export interface SignupDto {
  username: string;
  password: string;
  firstName: string;
  lastName?: string | null;
  phone?: string;
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
    return request<LoginResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() || null,
        phone: data.phone ?? null,
        role: data.role ?? "weaver",
      }),
    });
  },

  async getMe(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>("/auth/me");
  },

  async updateProfile(data: {
    firstName: string;
    lastName?: string | null;
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
  ): Promise<{ success: boolean; message: string; token?: string }> {
    const res = await request<{ success: boolean; message: string; token?: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.token) {
      setToken(res.token);
    }
    return res;
  },
};
