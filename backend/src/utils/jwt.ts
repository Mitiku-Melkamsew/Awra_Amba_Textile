import jwt from "jsonwebtoken";
import type { AuthUser } from "../types/express.js";

const RAW_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!RAW_SECRET || RAW_SECRET.includes("CHANGE_ME"))) {
  throw new Error("FATAL: JWT_SECRET environment variable is not configured or uses a placeholder in production.");
}

const JWT_SECRET: string = RAW_SECRET || "dev-jwt-fallback-secret-awra-amba";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "8h") as jwt.SignOptions["expiresIn"];

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
}
