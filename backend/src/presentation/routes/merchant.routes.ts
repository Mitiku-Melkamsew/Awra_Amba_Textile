import { Router } from "express";
import { MerchantPortalController } from "../controllers/merchant-portal.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { validateParams } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import { NumericIdParamSchema } from "../dtos/common.dto.js";

export const merchantPortalRouter = Router();

merchantPortalRouter.use(authenticate);

merchantPortalRouter.get("/profile", MerchantPortalController.getProfile);

merchantPortalRouter.get(
  "/catalog",
  requireCapability(Capability.CATALOG_READ),
  MerchantPortalController.getCatalog,
);

merchantPortalRouter.get(
  "/transactions",
  requireCapability(Capability.DIRECT_TRANSACTIONS_READ_OWN),
  MerchantPortalController.getMyTransactions,
);

merchantPortalRouter.get(
  "/transactions/:id",
  requireCapability(Capability.DIRECT_TRANSACTIONS_READ_OWN),
  validateParams(NumericIdParamSchema),
  MerchantPortalController.getMyTransactionDetail,
);
