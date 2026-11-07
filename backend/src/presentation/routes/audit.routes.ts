import { Router } from "express";
import { AuditController } from "../controllers/audit.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { Capability } from "../../domain/security/capabilities.js";

export const auditRouter = Router();

auditRouter.use(authenticate, requireCapability(Capability.AUDIT_READ));

auditRouter.get("/", AuditController.query);
