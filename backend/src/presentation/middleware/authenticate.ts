import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../../application/services/auth.service.js";
import { UnauthorizedError } from "../../domain/errors/domain-errors.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is required"));
  }

  try {
    const token = header.slice(7);
    req.user = await AuthService.authenticateToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
