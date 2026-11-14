export type UserRole = "admin" | "weaver" | "merchant";

export interface AuthUser {
  userId: number;
  username: string;
  fullName?: string;
  role: UserRole;
  roles: UserRole[];
  /** @deprecated use userId when role is weaver; no separate weaverId in schema */
  weaverId: number | null;
  merchantId: number | null;
}

export interface UserSummary {
  userId: number;
  username: string;
  fullName: string;
  phone: string | null;
  email?: string | null;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  initialPassword?: string;
}

/**
 * Weaver is a User with the weaver role.
 * Schema has no separate weavers table — weaverId === userId.
 */
export interface Weaver {
  /** Same as userId (schema has no separate weaver id). */
  weaverId: number;
  userId: number;
  fullName: string;
  phone: string | null;
  email?: string | null;
  user?: {
    userId: number;
    username: string;
    isActive: boolean;
  } | null;
  _count?: {
    workOrders?: number;
    settlements?: number;
  };
  // Transition helpers for UI that still splits names
  firstName?: string;
  lastName?: string;
  bankAccountNumber?: string | null;
}

export interface Merchant {
  merchantId: number;
  userId: number;
  companyName?: string;
  contactPhone?: string | null;
  fullName?: string;
  createdAt?: string;
}
