import type { Request, Response, NextFunction } from "express";
import { Capability } from "../../domain/security/capabilities.js";
import { RbacService } from "../../application/security/rbac.service.js";
import { ForbiddenError, UnauthorizedError } from "../../domain/errors/domain-errors.js";

/**
 * RBAC authorization middleware enforcing a required capability
 */
export function requireCapability(capability: Capability) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const hasAccess = RbacService.hasCapability(req.user.roles, capability);
    if (!hasAccess) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Required capability: '${capability}'`,
        ),
      );
    }

    next();
  };
}

/**
 * RBAC authorization middleware requiring any of the provided capabilities
 */
export function requireAnyCapability(...capabilities: Capability[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const hasAccess = capabilities.some((cap) =>
      RbacService.hasCapability(req.user!.roles, cap),
    );
    if (!hasAccess) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Requires one of: ${capabilities.join(", ")}`,
        ),
      );
    }

    next();
  };
}
