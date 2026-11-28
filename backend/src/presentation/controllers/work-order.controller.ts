import type { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { WorkOrderService } from "../../application/services/work-order.service.js";
import { ForbiddenError } from "../../domain/errors/domain-errors.js";
import { numericParam } from "../http/params.js";
import {
  serializeFabricReturn,
  serializeWorkOrder,
  serializeWorkOrderList,
  serializeYarnGiven,
} from "../serializers/work-order.serializer.js";

export class WorkOrderController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const isOnlyWeaver =
        req.user?.roles?.includes(UserRole.weaver) &&
        !req.user?.roles?.includes(UserRole.admin);

      const { status, limit, offset } = req.query as any;
      const rawWeaverId = req.query.weaverUserId;
      const weaverUserId = isOnlyWeaver
        ? req.user!.userId
        : (rawWeaverId ? Number(rawWeaverId) : undefined);

      const result = await WorkOrderService.listWorkOrders({
        status,
        weaverUserId,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      res.json(serializeWorkOrderList(result));
    } catch (error) {
      next(error);
    }
  }

  static async getNextZigId(_req: Request, res: Response, next: NextFunction) {
    try {
      const zigId = await WorkOrderService.generateNextZigId();
      res.json({ zigId });
    } catch (error) {
      next(error);
    }
  }

  static async getByZigId(req: Request, res: Response, next: NextFunction) {
    try {
      const zigId = String(req.params.zigId);
      const order = await WorkOrderService.getWorkOrder(zigId);

      const isOnlyWeaver =
        req.user?.roles?.includes(UserRole.weaver) &&
        !req.user?.roles?.includes(UserRole.admin);

      if (isOnlyWeaver && order.weaverUserId !== req.user!.userId) {
        throw new ForbiddenError("You are not authorized to view this work order");
      }

      res.json(serializeWorkOrder(order));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      // Accept only schema fields: weaverUserId, fabricVariantId, zigId, yarnLines
      const created = await WorkOrderService.createWorkOrder(req.body, actorUserId);
      res.status(201).json(serializeWorkOrder(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const zigId = String(req.params.zigId);
      const actorUserId = req.user!.userId;
      const updated = await WorkOrderService.updateStatus(zigId, req.body.status, actorUserId);
      res.json(serializeWorkOrder(updated));
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const zigId = String(req.params.zigId);
      const actorUserId = req.user!.userId;
      const cancelled = await WorkOrderService.cancelWorkOrder(zigId, actorUserId);
      res.json(serializeWorkOrder(cancelled));
    } catch (error) {
      next(error);
    }
  }

  // --- Yarn Given ---

  static async addYarnGiven(req: Request, res: Response, next: NextFunction) {
    try {
      const zigId = String(req.params.zigId);
      const actorUserId = req.user!.userId;
      const rawLines = req.body.lines ?? [req.body];
      const lines = rawLines.map((l: any) => ({
        yarnVariantId: Number(l.yarnVariantId),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice ?? 0),
      }));
      const created = await WorkOrderService.addYarnGiven(zigId, lines, actorUserId);
      res.status(201).json(Array.isArray(created) ? created.map(serializeYarnGiven) : serializeYarnGiven(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateYarnGiven(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await WorkOrderService.updateYarnGiven(id, req.body, actorUserId);
      res.json(serializeYarnGiven(updated));
    } catch (error) {
      next(error);
    }
  }

  static async deleteYarnGiven(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const result = await WorkOrderService.deleteYarnGiven(id, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- Fabric Returns ---

  static async addFabricReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const zigId = String(req.params.zigId);
      const actorUserId = req.user!.userId;
      const created = await WorkOrderService.addFabricReturn(
        { ...req.body, zigId },
        actorUserId,
      );
      res.status(201).json(serializeFabricReturn(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateFabricReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await WorkOrderService.updateFabricReturn(id, req.body, actorUserId);
      res.json(serializeFabricReturn(updated));
    } catch (error) {
      next(error);
    }
  }

  static async deleteFabricReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const result = await WorkOrderService.deleteFabricReturn(id, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

}
