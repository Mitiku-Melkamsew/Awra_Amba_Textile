import { request } from "../http/api-client";
import type { AuthUser, UserRole } from "../../domain/models";

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SignupDto {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
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
    return request<LoginResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>("/auth/me");
  },
};
