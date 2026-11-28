import type { Request, Response, NextFunction } from "express";
import { ProcurementService } from "../../application/services/procurement.service.js";
import { numericParam } from "../http/params.js";
import {
  serializeYarnPurchase,
  serializeYarnPurchaseList,
} from "../serializers/direct-transaction.serializer.js";

export class ProcurementController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const result = await ProcurementService.listPurchases(limit, offset);
      res.json(serializeYarnPurchaseList(result));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const purchase = await ProcurementService.getPurchase(id);
      res.json(serializeYarnPurchase(purchase));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      // Schema fields only: yarnVariantId, quantity, unitPrice
      const lines = (req.body.lines ?? []).map((l: any) => ({
        yarnVariantId: Number(l.yarnVariantId),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      }));
      const created = await ProcurementService.createPurchase(
        {
          supplierId: Number(req.body.supplierId),
          notes: req.body.notes ?? null,
          lines,
          purchaseDate: req.body.purchaseDate
            ? new Date(req.body.purchaseDate)
            : undefined,
        },
        actorUserId,
      );
      res.status(201).json(serializeYarnPurchase(created));
    } catch (error) {
      next(error);
    }
  }
}
