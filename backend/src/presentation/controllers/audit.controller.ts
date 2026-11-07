import type { Request, Response, NextFunction } from "express";
import { AuditService } from "../../application/services/audit.service.js";

export class AuditController {
  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const { actorUserId, entityType, entityName, entityId, startDate, endDate, limit, offset } = req.query as any;

      const result = await AuditService.query({
        actorUserId: actorUserId ? Number(actorUserId) : undefined,
        entityType: entityType ?? entityName,
        entityId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
