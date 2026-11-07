import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { Capability } from "../../domain/security/capabilities.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get(
  "/hisab",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.listSettlementPayments,
);

reportsRouter.get(
  "/hisab/:id",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.getPaymentHisab,
);

reportsRouter.get(
  "/financial-summary",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.getFinancialSummary,
);

reportsRouter.get(
  "/commercial-summary",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.getFinancialSummary,
);

reportsRouter.get(
  "/production-summary",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.getFinancialSummary,
);

reportsRouter.get(
  "/weavers-balance",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.getWeaversBalance,
);

reportsRouter.get(
  "/merchants-balance",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.getMerchantsBalance,
);
