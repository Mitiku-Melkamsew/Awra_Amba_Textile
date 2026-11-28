import type { UserRole } from "@prisma/client";
import { formatUserFullName } from "../../utils/user-name.js";

/** Public shape of the authenticated user. Never includes credentials. */
export interface AuthUserResponse {
  userId: number;
  username: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  roles: UserRole[];
  isActive: boolean;
}

/** Minimal record the serializer needs; compatible with a Prisma user + roles. */
export interface AuthUserRecord {
  userId: number;
  username: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email?: string | null;
  isActive: boolean;
  roles: Array<{ role: UserRole }>;
}

/**
 * Explicitly builds the auth/user payload. Fields are picked, never spread,
 * so a database column cannot leak into the API by accident.
 */
export function serializeAuthUser(user: AuthUserRecord): AuthUserResponse {
  return {
    userId: user.userId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: formatUserFullName(user),
    phone: user.phone,
    email: user.email ?? null,
    roles: user.roles.map((entry) => entry.role),
    isActive: user.isActive,
  };
}
