import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import {
  DirectTransactionService,
  normalizeYarnPurchase,
} from "../../application/services/direct-transaction.service.js";
import { ProcurementService } from "../../application/services/procurement.service.js";
import { ValidationError } from "../../domain/errors/domain-errors.js";
import {
  serializeDirectTransaction,
  serializeDirectTransactionList,
  serializeDirectTxnPaymentResult,
} from "../serializers/direct-transaction.serializer.js";

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
      res.json(serializeDirectTransactionList(result));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const type = req.query.type as string | undefined;
      const txn = await DirectTransactionService.getTransaction(id, type);
      res.json(serializeDirectTransaction(txn));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const body = req.body;

      // Yarn purchases use the procurement schema (YarnPurchase / YarnPurchaseLine).
      // `yarn_purchase` is accepted on this endpoint as a thin facade so the
      // commercial transactions UI has a single creation path.
      if (body.type === "yarn_purchase") {
        let supplierId = body.supplierId != null ? Number(body.supplierId) : null;
        if (supplierId == null && body.lines?.[0]?.yarnVariantId) {
          const firstVar = await prisma.yarnVariant.findUnique({
            where: { yarnVariantId: Number(body.lines[0].yarnVariantId) },
            select: { supplierId: true },
          });
          if (firstVar) supplierId = firstVar.supplierId;
        }
        if (supplierId == null) {
          throw new ValidationError("supplierId is required for yarn purchases.");
        }
        const lines = (body.lines ?? []).map((l: any) => {
          if (l.yarnVariantId == null) {
            throw new ValidationError(
              "yarnVariantId is required for each yarn purchase line.",
            );
          }
          return {
            yarnVariantId: Number(l.yarnVariantId),
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
          };
        });
        const createdPurchase = await ProcurementService.createPurchase(
          {
            supplierId,
            notes: body.notes ?? null,
            lines,
          },
          actorUserId,
        );
        return res.status(201).json(serializeDirectTransaction(normalizeYarnPurchase(createdPurchase)));
      }

      const lines = (body.lines ?? []).map((l: any) => ({
        fabricVariantId: l.fabricVariantId != null ? Number(l.fabricVariantId) : null,
        yarnVariantId: l.yarnVariantId != null ? Number(l.yarnVariantId) : null,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        description: l.description ?? null,
      }));

      const created = await DirectTransactionService.createTransaction({
        type: body.type,
        weaverUserId: body.weaverUserId != null ? Number(body.weaverUserId) : null,
        merchantUserId: body.merchantUserId != null ? Number(body.merchantUserId) : null,
        lines,
        notes: body.notes ?? null,
        createdByUserId: actorUserId,
      });
      res.status(201).json(serializeDirectTransaction(created));
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const actorUserId = req.user!.userId;
      const payment = await DirectTransactionService.recordPayment(id, req.body, actorUserId);
      res.status(201).json(serializeDirectTxnPaymentResult(payment));
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const actorUserId = req.user!.userId;
      const cancelled = await DirectTransactionService.cancelTransaction(id, actorUserId);
      res.json(serializeDirectTransaction(cancelled));
    } catch (error) {
      next(error);
    }
  }
}
