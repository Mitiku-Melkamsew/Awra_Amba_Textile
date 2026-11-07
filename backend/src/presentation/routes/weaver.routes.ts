import { Router } from "express";
import { WeaverPortalController } from "../controllers/weaver-portal.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { Capability } from "../../domain/security/capabilities.js";

export const weaverPortalRouter = Router();

weaverPortalRouter.use(authenticate);

weaverPortalRouter.get("/profile", WeaverPortalController.getProfile);

weaverPortalRouter.get(
  "/work-orders",
  requireCapability(Capability.WORK_ORDERS_READ_OWN),
  WeaverPortalController.getMyWorkOrders,
);

weaverPortalRouter.get(
  "/work-orders/:zigId",
  requireCapability(Capability.WORK_ORDERS_READ_OWN),
  WeaverPortalController.getMyWorkOrderDetail,
);

weaverPortalRouter.get(
  "/settlements",
  requireCapability(Capability.SETTLEMENTS_READ_OWN),
  WeaverPortalController.getMySettlements,
);

weaverPortalRouter.get(
  "/settlements/:id/statement",
  requireCapability(Capability.SETTLEMENTS_READ_OWN),
  WeaverPortalController.getMySettlementStatement,
);

weaverPortalRouter.get(
  "/direct-transactions",
  requireCapability(Capability.DIRECT_TRANSACTIONS_READ_OWN),
  WeaverPortalController.getMyDirectTransactions,
);
