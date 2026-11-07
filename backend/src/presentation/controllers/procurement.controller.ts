import type { Request, Response, NextFunction } from "express";
import { ProcurementService } from "../../application/services/procurement.service.js";

export class ProcurementController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const result = await ProcurementService.listPurchases(limit, offset);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const purchase = await ProcurementService.getPurchase(id);
      res.json(purchase);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const lines = (req.body.lines ?? []).map((l: any) => ({
        yarnVariantId: l.yarnVariantId,
        quantity: l.quantity ?? l.quantityKg,
        unitPrice: l.unitPrice ?? l.unitCost,
      }));
      const created = await ProcurementService.createPurchase(
        {
          ...req.body,
          lines,
          purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined,
        },
        actorUserId,
      );
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }
}
