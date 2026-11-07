export type UserRole = "admin" | "weaver" | "merchant";

export interface AuthUser {
  userId: number;
  username: string;
  fullName?: string;
  role: UserRole;
  roles: UserRole[];
  weaverId: number | null;
  merchantId: number | null;
}

export interface UserSummary {
  userId: number;
  username: string;
  fullName: string;
  phone: string | null;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  initialPassword?: string;
  weaverProfile?: {
    weaverId: number;
    email?: string | null;
    bankAccountNumber?: string | null;
  } | null;
  merchantProfile?: {
    merchantId: number;
    companyName: string;
    contactPhone?: string | null;
  } | null;
}

export interface Weaver {
  weaverId: number;
  userId?: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone: string | null;
  email: string | null;
  bankAccountNumber: string | null;
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
  merchantId: number;
  userId: number;
  companyName: string;
  contactPhone: string | null;
  createdAt?: string;
}
