import type { Request, Response, NextFunction } from "express";
import { StockService } from "../../application/services/stock.service.js";
import { UserRole } from "@prisma/client";

export class StockController {
  static async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await StockService.getSummary();
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  static async getFabricStock(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly !== "false";
      const fabrics = await StockService.getFabricStock(activeOnly);
      res.json(fabrics);
    } catch (error) {
      next(error);
    }
  }

  static async getYarnStock(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly !== "false";
      const yarns = await StockService.getYarnStock(activeOnly);
      res.json(yarns);
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableFabrics(req: Request, res: Response, next: NextFunction) {
    try {
      const isOnlyMerchant =
        req.user?.roles?.includes(UserRole.merchant) && !req.user?.roles?.includes(UserRole.admin);
      const available = await StockService.getAvailableFabrics(isOnlyMerchant);
      res.json(available);
    } catch (error) {
      next(error);
    }
  }
}
