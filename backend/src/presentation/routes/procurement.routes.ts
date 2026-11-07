import { Router } from "express";
import { ProcurementController } from "../controllers/procurement.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import { CreateProcurementSchema } from "../dtos/procurement.dto.js";

export const procurementRouter = Router();

procurementRouter.use(authenticate, requireCapability(Capability.PROCUREMENT_MANAGE));

procurementRouter.get("/yarn-purchases", ProcurementController.list);
procurementRouter.get("/yarn-purchases/:id", ProcurementController.getById);
procurementRouter.post(
  "/yarn-purchases",
  validateBody(CreateProcurementSchema),
  ProcurementController.create,
);
