import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { SettlementService } from "../../application/services/settlement.service.js";
import { exportBatchSettlementCsv } from "../../services/settlement-preview.service.js";

export class SettlementController {
  static async getUnsettled(req: Request, res: Response, next: NextFunction) {
    try {
      const cutoff = req.query.cutoffDate ? new Date(String(req.query.cutoffDate)) : null;
      const unsettled = await SettlementService.getUnsettled(cutoff);
      res.json(unsettled);
    } catch (error) {
      next(error);
    }
  }

  static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const rawCutoff =
        req.query.cutoffDate ?? req.query.periodEnd ?? req.body?.cutoffDate ?? req.body?.periodEnd;
      const cutoff = rawCutoff ? new Date(String(rawCutoff)) : null;
      const preview = await SettlementService.generatePreview(
        cutoff,
        req.user!.userId,
        req.body?.overrides ?? [],
      );
      res.json(preview);
    } catch (error) {
      next(error);
    }
  }

  static async commitBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const result = await SettlementService.commitBatch(
        {
          batchId: req.body.batchId,
          paymentMethod: req.body.paymentMethod,
          notes: req.body.notes,
        },
        actorUserId,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async commitSingle(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const result = await SettlementService.commitSingleSettlement({
        ...req.body,
        recordedByUserId: actorUserId,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async listBatches(_req: Request, res: Response, next: NextFunction) {
    try {
      const batches = await SettlementService.listBatches();
      res.json(batches);
    } catch (error) {
      next(error);
    }
  }

  static async getBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const batch = await SettlementService.getBatch(id);
      res.json(batch);
    } catch (error) {
      next(error);
    }
  }

  static async getBatchCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const csv = await exportBatchSettlementCsv(id);
      if (csv === null) {
        res.status(404).json({ error: `Settlement batch ${id} not found` });
        return;
      }
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="HISAB-BATCH-${id}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  static async pay(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const payment = await SettlementService.paySettlement(id, req.body, actorUserId);
      res.json(payment);
    } catch (error) {
      next(error);
    }
  }

  static async payBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const result = await SettlementService.payBatch(id, req.body, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async overrideLine(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await SettlementService.overrideLine(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}
