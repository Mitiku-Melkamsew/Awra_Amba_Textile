import type { UserRole } from "../../domain/types/enums.js";
import { project, type AnyRecord } from "./project.js";

const USER_SUMMARY_KEYS = [
  "userId",
  "username",
  "firstName",
  "lastName",
  "fullName",
  "phone",
  "email",
  "isActive",
  "createdAt",
  "roles",
  "initialPassword",
] as const;

export interface UserSummaryResponse {
  userId: number;
  username: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt?: Date | string;
  roles: UserRole[];
  initialPassword?: string;
}

export interface UserBalanceResponse {
  userId: number;
  roles: UserRole[];
  weaverBalance?: {
    directPurchasePayable: number;
    unsettledReturnedZigsCount: number;
  };
  merchantBalance?: {
    outstandingReceivable: number;
  };
}

export function serializeUserSummary(user: AnyRecord): UserSummaryResponse {
  const out = project(user, USER_SUMMARY_KEYS) as UserSummaryResponse;
  if (Array.isArray(user.roles)) {
    out.roles = user.roles.map((r: any) => (typeof r === "string" ? r : r.role));
  }
  return out;
}

export function serializeUserList(result: { users: AnyRecord[]; total: number }) {
  return {
    users: (result.users ?? []).map(serializeUserSummary),
    total: Number(result.total ?? 0),
  };
}

export function serializeUserBalance(balance: AnyRecord): UserBalanceResponse {
  const out: UserBalanceResponse = {
    userId: balance.userId,
    roles: Array.isArray(balance.roles) ? [...balance.roles] : [],
  };
  if (balance.weaverBalance) {
    out.weaverBalance = {
      directPurchasePayable: Number(balance.weaverBalance.directPurchasePayable ?? 0),
      unsettledReturnedZigsCount: Number(balance.weaverBalance.unsettledReturnedZigsCount ?? 0),
    };
  }
  if (balance.merchantBalance) {
    out.merchantBalance = {
      outstandingReceivable: Number(balance.merchantBalance.outstandingReceivable ?? 0),
    };
  }
  return out;
}

export function serializeWeaverProfile(profile: AnyRecord) {
  const base = serializeUserSummary(profile);
  return {
    ...base,
    activeOrdersCount: Number(profile.activeOrdersCount ?? 0),
    ...(profile.balance ? { balance: serializeUserBalance(profile.balance) } : {}),
  };
}

export function serializeMerchantProfile(profile: AnyRecord) {
  const base = serializeUserSummary(profile);
  return {
    ...base,
    ...(profile.balance ? { balance: serializeUserBalance(profile.balance) } : {}),
  };
}
