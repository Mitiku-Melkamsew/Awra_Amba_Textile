import { UserRole } from "@prisma/client";

export interface AuthUser {
  userId: number;
  username: string;
  roles: UserRole[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
