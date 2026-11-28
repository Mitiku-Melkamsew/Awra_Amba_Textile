import type { Request, Response, NextFunction } from "express";
import { ReportService } from "../../application/services/report.service.js";
import { numericParam } from "../http/params.js";
import {
  serializeFinancialSummary,
  serializeHisabReport,
  serializeMerchantBalanceItem,
  serializeProductionSummary,
  serializeSettlementPaymentReportItem,
  serializeWeaverBalanceItem,
} from "../serializers/report.serializer.js";

export class ReportController {
  static async listSettlementPayments(_req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await ReportService.listSettlementPayments();
      res.json(payments.map(serializeSettlementPaymentReportItem));
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentHisab(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = numericParam(req);
      if (req.query.format === "csv") {
        const csv = await ReportService.exportPaymentHisabCsv(paymentId);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-PAYMENT-${paymentId}.csv"`);
        res.send(csv);
        return;
      }

      res.json(serializeHisabReport(await ReportService.getPaymentHisab(paymentId)));
    } catch (error) {
      next(error);
    }
  }

  static async getSettlementHisab(req: Request, res: Response, next: NextFunction) {
    try {
      const settlementId = numericParam(req);
      if (req.query.format === "csv") {
        const csv = await ReportService.exportSettlementHisabCsv(settlementId);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-SETTLEMENT-${settlementId}.csv"`);
        res.send(csv);
        return;
      }

      res.json(serializeHisabReport(await ReportService.getSettlementHisab(settlementId)));
    } catch (error) {
      next(error);
    }
  }

  static async getFinancialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
      const summary = await ReportService.getFinancialSummary(startDate, endDate);
      res.json(serializeFinancialSummary(summary));
    } catch (error) {
      next(error);
    }
  }

  static async getProductionSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
      const summary = await ReportService.getProductionSummary(startDate, endDate);
      res.json(serializeProductionSummary(summary));
    } catch (error) {
      next(error);
    }
  }

  static async getWeaversBalance(_req: Request, res: Response, next: NextFunction) {
    try {
      const balances = await ReportService.getWeaversBalanceReport();
      res.json(balances.map(serializeWeaverBalanceItem));
    } catch (error) {
      next(error);
    }
  }

  static async getMerchantsBalance(_req: Request, res: Response, next: NextFunction) {
    try {
      const balances = await ReportService.getMerchantsBalanceReport();
      res.json(balances.map(serializeMerchantBalanceItem));
    } catch (error) {
      next(error);
    }
  }
}
