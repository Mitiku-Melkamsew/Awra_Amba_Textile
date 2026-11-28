import type { Request, Response, NextFunction } from "express";
import { AuditService } from "../../application/services/audit.service.js";
import { serializeAuditList } from "../serializers/audit.serializer.js";

export class AuditController {
  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const { actorUserId, action, entityType, entityName, entityId, startDate, endDate, limit, offset } = req.query as any;

      const result = await AuditService.query({
        actorUserId: actorUserId ? Number(actorUserId) : undefined,
        action: typeof action === "string" && action.trim() ? action.trim() : undefined,
        entityType: entityType ?? entityName,
        entityId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });

      res.json(serializeAuditList(result));
    } catch (error) {
      next(error);
    }
  }
}
