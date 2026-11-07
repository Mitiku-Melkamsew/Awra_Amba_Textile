import type { Request, Response, NextFunction } from "express";
import {
  DirectTransactionService,
  normalizeYarnPurchase,
} from "../../application/services/direct-transaction.service.js";
import { ProcurementService } from "../../application/services/procurement.service.js";

export class DirectTransactionController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, status, weaverUserId, weaverId, merchantUserId, merchantId, limit, offset } =
        req.query as any;
      const wId = weaverUserId ?? weaverId;
      const mId = merchantUserId ?? merchantId;
      const result = await DirectTransactionService.listTransactions({
        type,
        status,
        weaverUserId: wId ? Number(wId) : undefined,
        merchantUserId: mId ? Number(mId) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const txn = await DirectTransactionService.getTransaction(id);
      res.json(txn);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const body = req.body;
      const type = body.type ?? body.transactionType;
      const lines = body.lines ?? body.items ?? [];

      if (type === "yarn_purchase") {
        const supplierId = body.supplierId ? Number(body.supplierId) : undefined;
        if (!supplierId) {
          throw new Error("VALIDATION: supplierId is required for yarn purchases.");
        }
        const createdPurchase = await ProcurementService.createPurchase(
          {
            supplierId,
            notes: body.notes,
            purchaseDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
            lines: lines.map((l: any) => ({
              yarnVariantId: Number(l.yarnVariantId),
              quantity: Number(l.quantity),
              unitPrice: Number(l.unitPrice),
            })),
          },
          actorUserId,
        );
        return res.status(201).json(normalizeYarnPurchase(createdPurchase));
      }

      const weaverUserId = body.weaverUserId ?? body.weaverId;
      const merchantUserId = body.merchantUserId ?? body.merchantId;
      const initialPaymentAmount = body.initialPaymentAmount ?? body.initialPayment?.amount;
      const paymentMethod = body.paymentMethod ?? body.initialPayment?.paymentMethod;

      const created = await DirectTransactionService.createTransaction({
        type,
        weaverUserId,
        merchantUserId,
        lines,
        initialPaymentAmount,
        paymentMethod,
        notes: body.notes,
        transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
        createdByUserId: actorUserId,
      });
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const payment = await DirectTransactionService.recordPayment(id, req.body, actorUserId);
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const cancelled = await DirectTransactionService.cancelTransaction(id, actorUserId);
      res.json(cancelled);
    } catch (error) {
      next(error);
    }
  }
}
