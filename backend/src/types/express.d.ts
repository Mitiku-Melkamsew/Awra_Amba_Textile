import { UserRole } from "@prisma/client";

export interface AuthUser {
  userId: number;
  username: string;
  role: UserRole;
  weaverId: number | null;
  merchantId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};