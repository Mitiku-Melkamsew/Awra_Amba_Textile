import type { Request, Response, NextFunction } from "express";
import { ReportService } from "../../application/services/report.service.js";

export class ReportController {
  static async listSettlementPayments(_req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await ReportService.listSettlementPayments();
      res.json(payments);
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentHisab(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = Number(req.params.id);
      const format = req.query.format as string;

      if (format === "csv") {
        const csv = await ReportService.exportPaymentHisabCsv(paymentId);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-${paymentId}.csv"`);
        res.send(csv);
        return;
      }

      const report = await ReportService.getPaymentHisabStatement(paymentId);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  static async getHisab(req: Request, res: Response, next: NextFunction) {
    try {
      const settlementId = Number(req.params.id);
      const format = req.query.format as string;

      if (format === "csv") {
        const csv = await ReportService.exportHisabCsv(settlementId);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-${settlementId}.csv"`);
        res.send(csv);
        return;
      }

      const report = await ReportService.getHisabStatement(settlementId);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  static async getFinancialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
      const summary = await ReportService.getFinancialSummary(startDate, endDate);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  static async getWeaversBalance(_req: Request, res: Response, next: NextFunction) {
    try {
      const balances = await ReportService.getWeaversBalanceReport();
      res.json(balances);
    } catch (error) {
      next(error);
    }
  }

  static async getMerchantsBalance(_req: Request, res: Response, next: NextFunction) {
    try {
      const balances = await ReportService.getMerchantsBalanceReport();
      res.json(balances);
    } catch (error) {
      next(error);
    }
  }
}
