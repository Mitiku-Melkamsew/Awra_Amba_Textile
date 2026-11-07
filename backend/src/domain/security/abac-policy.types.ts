import { UserRole } from "@prisma/client";

export interface AbacSubject {
  userId: number;
  username: string;
  roles: UserRole[];
  isActive?: boolean;
}

export interface AbacResource {
  entityType: string;
  entityId?: string | number;
  weaverUserId?: number | null;
  merchantUserId?: number | null;
  status?: string;
  settlementLineId?: number | null;
  paymentId?: number | null;
  amountPaid?: number;
  [key: string]: unknown;
}

export type AbacAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "cancel"
  | "deliver"
  | "pay"
  | "override";

export interface AbacContext {
  currentTime?: Date;
  ipAddress?: string;
}

export interface AbacDecision {
  allow: boolean;
  reason?: string;
}
