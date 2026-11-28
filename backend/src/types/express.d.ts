import type { UserRole } from "../domain/types/enums.js";

export interface AuthUser {
  userId: number;
  username: string;
  roles: UserRole[];
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
