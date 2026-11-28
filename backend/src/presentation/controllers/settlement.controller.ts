import type { Request, Response, NextFunction } from "express";
import { SettlementService } from "../../application/services/settlement.service.js";
import { numericParam } from "../http/params.js";

export class SettlementController {
  static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const rawCutoff = req.query.cutoffDate ?? req.body?.cutoffDate;
      const cutoff = rawCutoff ? new Date(String(rawCutoff)) : null;
      const includeZigIds = req.body?.includeZigIds ?? (req.query.includeZigIds ? String(req.query.includeZigIds).split(",").map((s: string) => s.trim()).filter(Boolean) : []);
      const preview = await SettlementService.generatePreview(
        cutoff,
        req.user!.userId,
        req.body?.overrides ?? [],
        includeZigIds,
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
        req.body,
        actorUserId,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const result = await SettlementService.cancelSettlement(id, req.body, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getPendingSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await SettlementService.getPendingSettlementsSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  static async getZigsLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const statusFilter = req.query.status as string | undefined;
      const ledger = await SettlementService.getZigsLedger(statusFilter);
      res.json(ledger);
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
      const id = numericParam(req);
      const batch = await SettlementService.getBatch(id);
      res.json(batch);
    } catch (error) {
      next(error);
    }
  }

  static async getSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const settlement = await SettlementService.getSettlement(id);
      res.json(settlement);
    } catch (error) {
      next(error);
    }
  }

  static async getBatchCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const csv = await SettlementService.exportBatchCsv(id);
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
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const payment = await SettlementService.paySettlement(id, req.body, actorUserId);
      res.json(payment);
    } catch (error) {
      next(error);
    }
  }

  static async payBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const result = await SettlementService.payBatch(id, req.body, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async cancelBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const result = await SettlementService.cancelBatch(id, req.body, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async overrideLine(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await SettlementService.overrideLine(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}
