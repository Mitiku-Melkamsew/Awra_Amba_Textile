export type UserRole = "admin" | "weaver" | "merchant";

export interface AuthUser {
  userId: number;
  username: string;
  fullName?: string;
  role: UserRole;
  roles: UserRole[];
  isActive?: boolean;
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
 * Schema has no separate weavers table — userId is the primary identifier.
 */
export interface Weaver {
  userId: number;
  fullName: string;
  phone: string | null;
  email?: string | null;
  isActive?: boolean;
  user?: {
    userId: number;
    username: string;
    isActive: boolean;
  } | null;
  _count?: {
    workOrders?: number;
    settlements?: number;
  };
}

export interface Merchant {
  userId: number;
  companyName?: string;
  contactPhone?: string | null;
  fullName?: string;
  isActive?: boolean;
  createdAt?: string;
}
