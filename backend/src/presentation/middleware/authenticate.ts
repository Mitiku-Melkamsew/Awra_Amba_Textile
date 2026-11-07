import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../utils/jwt.js";
import { UnauthorizedError } from "../../domain/errors/domain-errors.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is required"));
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired authentication token"));
  }
}
