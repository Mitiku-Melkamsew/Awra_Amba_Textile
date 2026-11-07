import { Router } from "express";
import { SettlementController } from "../controllers/settlement.controller.js";
import { ReportController } from "../controllers/report.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import {
  CommitBatchSettlementSchema,
  CommitSingleSettlementSchema,
  PaySettlementSchema,
  OverrideSettlementLineSchema,
  SettlementPreviewQuerySchema,
} from "../dtos/settlement.dto.js";

export const settlementsRouter = Router();

settlementsRouter.use(authenticate);

settlementsRouter.get(
  "/unsettled",
  requireCapability(Capability.SETTLEMENTS_PREVIEW),
  SettlementController.getUnsettled,
);

settlementsRouter.get(
  "/preview",
  requireCapability(Capability.SETTLEMENTS_PREVIEW),
  SettlementController.preview,
);
settlementsRouter.post(
  "/preview",
  requireCapability(Capability.SETTLEMENTS_PREVIEW),
  validateBody(SettlementPreviewQuerySchema),
  SettlementController.preview,
);

settlementsRouter.post(
  "/batches",
  requireCapability(Capability.SETTLEMENTS_COMMIT),
  validateBody(CommitBatchSettlementSchema),
  SettlementController.commitBatch,
);

settlementsRouter.post(
  "/single",
  requireCapability(Capability.SETTLEMENTS_COMMIT),
  validateBody(CommitSingleSettlementSchema),
  SettlementController.commitSingle,
);

settlementsRouter.get(
  "/batches",
  requireCapability(Capability.SETTLEMENTS_COMMIT),
  SettlementController.listBatches,
);
settlementsRouter.get(
  "/batches/:id/hisab.csv",
  requireCapability(Capability.SETTLEMENTS_COMMIT),
  SettlementController.getBatchCsv,
);

settlementsRouter.get(
  "/batches/:id",
  requireCapability(Capability.SETTLEMENTS_COMMIT),
  SettlementController.getBatch,
);

settlementsRouter.get(
  "/:id/hisab-statement",
  requireCapability(Capability.REPORTS_READ_FINANCIAL),
  ReportController.getHisab,
);

settlementsRouter.post(
  "/:id/pay",
  requireCapability(Capability.SETTLEMENTS_PAY),
  validateBody(PaySettlementSchema),
  SettlementController.pay,
);
settlementsRouter.post(
  "/batches/:id/pay",
  requireCapability(Capability.SETTLEMENTS_PAY),
  validateBody(PaySettlementSchema),
  SettlementController.payBatch,
);

settlementsRouter.post(
  "/lines/:id/override",
  requireCapability(Capability.SETTLEMENTS_OVERRIDE),
  validateBody(OverrideSettlementLineSchema),
  SettlementController.overrideLine,
);
settlementsRouter.patch(
  "/lines/:id/override",
  requireCapability(Capability.SETTLEMENTS_OVERRIDE),
  validateBody(OverrideSettlementLineSchema),
  SettlementController.overrideLine,
);
