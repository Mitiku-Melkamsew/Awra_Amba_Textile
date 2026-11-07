import { Router } from "express";
import { StockController } from "../controllers/stock.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { Capability } from "../../domain/security/capabilities.js";

export const stockRouter = Router();

stockRouter.use(authenticate);

// Publicly available to all authenticated roles
stockRouter.get(
  "/available-fabrics",
  requireCapability(Capability.CATALOG_READ),
  StockController.getAvailableFabrics,
);

// Admin / Inventory Managers
stockRouter.get(
  "/",
  requireCapability(Capability.STOCK_READ),
  StockController.getSummary,
);

stockRouter.get(
  "/summary",
  requireCapability(Capability.STOCK_READ),
  StockController.getSummary,
);

stockRouter.get(
  "/fabrics",
  requireCapability(Capability.STOCK_READ),
  StockController.getFabricStock,
);

stockRouter.get(
  "/yarns",
  requireCapability(Capability.STOCK_READ),
  StockController.getYarnStock,
);
