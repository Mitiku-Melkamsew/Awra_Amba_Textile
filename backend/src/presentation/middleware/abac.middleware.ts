import type { Request, Response, NextFunction } from "express";
import { AbacService } from "../../application/security/abac.service.js";
import { UnauthorizedError } from "../../domain/errors/domain-errors.js";
import type { AbacAction, AbacResource } from "../../domain/security/abac-policy.types.js";

/**
 * ABAC middleware ensuring weaver ownership
 */
export function requireWeaverOwnership(
  getWeaverUserId: (req: Request) => number | Promise<number>,
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError("Authentication required"));

    try {
      const targetUserId = await getWeaverUserId(req);
      AbacService.enforceWeaverOwnership(
        { userId: req.user.userId, username: req.user.username, roles: req.user.roles },
        { entityType: "weaver_resource", weaverUserId: targetUserId },
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * ABAC middleware ensuring merchant ownership
 */
export function requireMerchantOwnership(
  getMerchantUserId: (req: Request) => number | Promise<number>,
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError("Authentication required"));

    try {
      const targetUserId = await getMerchantUserId(req);
      AbacService.enforceMerchantOwnership(
        { userId: req.user.userId, username: req.user.username, roles: req.user.roles },
        { entityType: "merchant_resource", merchantUserId: targetUserId },
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * ABAC middleware evaluating state-based mutation rules
 */
export function requireResourceState(
  action: AbacAction,
  getResource: (req: Request) => AbacResource | Promise<AbacResource>,
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const resource = await getResource(req);
      AbacService.enforceResourceState(action, resource);
      next();
    } catch (error) {
      next(error);
    }
  };
}
