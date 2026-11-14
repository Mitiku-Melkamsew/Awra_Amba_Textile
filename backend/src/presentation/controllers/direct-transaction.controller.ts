import type { Request, Response, NextFunction } from "express";
import {
  DirectTransactionService,
  normalizeYarnPurchase,
} from "../../application/services/direct-transaction.service.js";
import { ProcurementService } from "../../application/services/procurement.service.js";

export class DirectTransactionController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, status, weaverUserId, merchantUserId, limit, offset } =
        req.query as any;
      const result = await DirectTransactionService.listTransactions({
        type,
        status,
        weaverUserId: weaverUserId ? Number(weaverUserId) : undefined,
        merchantUserId: merchantUserId ? Number(merchantUserId) : undefined,
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
      // Yarn purchases belong to /api/v1/procurement, not direct transactions.
      // DirectTxnType only: fabric_purchase_from_weaver | yarn_sale_to_weaver | fabric_sale_to_merchant
      const type = body.type;
      const lines = (body.lines ?? []).map((l: any) => ({
        fabricVariantId: l.fabricVariantId != null ? Number(l.fabricVariantId) : null,
        yarnVariantId: l.yarnVariantId != null ? Number(l.yarnVariantId) : null,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        description: l.description ?? null,
      }));

      const created = await DirectTransactionService.createTransaction({
        type,
        weaverUserId: body.weaverUserId != null ? Number(body.weaverUserId) : null,
        merchantUserId: body.merchantUserId != null ? Number(body.merchantUserId) : null,
        lines,
        initialPaymentAmount:
          body.initialPaymentAmount != null ? Number(body.initialPaymentAmount) : undefined,
        paymentMethod: body.paymentMethod ?? undefined,
        notes: body.notes ?? null,
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
