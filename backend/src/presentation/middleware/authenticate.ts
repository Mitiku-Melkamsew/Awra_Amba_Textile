import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../utils/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { UnauthorizedError } from "../../domain/errors/domain-errors.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is required"));
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
      select: {
        userId: true,
        username: true,
        isActive: true,
        tokenVersion: true,
        roles: { select: { role: true } },
      },
    });

    if (!user || !user.isActive) {
      return next(new UnauthorizedError("User account is inactive or no longer exists"));
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      return next(new UnauthorizedError("Session has been invalidated. Please sign in again."));
    }

    req.user = {
      userId: user.userId,
      username: user.username,
      roles: user.roles.map((r) => r.role),
      tokenVersion: user.tokenVersion,
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired authentication token"));
  }
}
