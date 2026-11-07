import { Router } from "express";
import { CatalogController } from "../controllers/catalog.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import {
  CreateFabricSchema,
  UpdateFabricSchema,
  CreateYarnSchema,
  UpdateYarnSchema,
  CreateColorSchema,
  UpdateColorSchema,
  CreateDesignSchema,
  UpdateDesignSchema,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  CreateFabricVariantSchema,
  CreateYarnVariantSchema,
  CreateFabricPriceSchema,
  CreateYarnPriceSchema,
  CreateQualityRuleSchema,
  UpdateQualityRuleSchema,
  SetActiveStatusSchema,
} from "../dtos/catalog.dto.js";

export const catalogRouter = Router();

catalogRouter.use(authenticate);

// Lookup bundle
catalogRouter.get("/lookup", requireCapability(Capability.CATALOG_READ), CatalogController.getLookup);

// Fabrics
catalogRouter.get("/fabrics", requireCapability(Capability.CATALOG_READ), CatalogController.listFabrics);
catalogRouter.get("/fabrics/:id", requireCapability(Capability.CATALOG_READ), CatalogController.getFabric);
catalogRouter.post(
  "/fabrics",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(CreateFabricSchema),
  CatalogController.createFabric,
);
catalogRouter.patch(
  "/fabrics/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateFabricSchema),
  CatalogController.updateFabric,
);
catalogRouter.put(
  "/fabrics/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateFabricSchema),
  CatalogController.updateFabric,
);
catalogRouter.patch(
  "/fabrics/:id/status",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.updateFabric,
);

// Yarns
catalogRouter.get("/yarns", requireCapability(Capability.CATALOG_READ), CatalogController.listYarns);
catalogRouter.post(
  "/yarns",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(CreateYarnSchema),
  CatalogController.createYarn,
);
catalogRouter.patch(
  "/yarns/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateYarnSchema),
  CatalogController.updateYarn,
);
catalogRouter.put(
  "/yarns/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateYarnSchema),
  CatalogController.updateYarn,
);
catalogRouter.patch(
  "/yarns/:id/status",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.updateYarn,
);

// Colors
catalogRouter.get("/colors", requireCapability(Capability.CATALOG_READ), CatalogController.listColors);
catalogRouter.post(
  "/colors",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(CreateColorSchema),
  CatalogController.createColor,
);
catalogRouter.patch(
  "/colors/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateColorSchema),
  CatalogController.updateColor,
);
catalogRouter.put(
  "/colors/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateColorSchema),
  CatalogController.updateColor,
);
catalogRouter.delete("/colors/:id", requireCapability(Capability.CATALOG_MANAGE), CatalogController.deleteColor);

// Designs
catalogRouter.get("/designs", requireCapability(Capability.CATALOG_READ), CatalogController.listDesigns);
catalogRouter.post(
  "/designs",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(CreateDesignSchema),
  CatalogController.createDesign,
);
catalogRouter.patch(
  "/designs/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateDesignSchema),
  CatalogController.updateDesign,
);
catalogRouter.put(
  "/designs/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateDesignSchema),
  CatalogController.updateDesign,
);
catalogRouter.delete("/designs/:id", requireCapability(Capability.CATALOG_MANAGE), CatalogController.deleteDesign);

// Suppliers
catalogRouter.get("/suppliers", requireCapability(Capability.CATALOG_READ), CatalogController.listSuppliers);
catalogRouter.post(
  "/suppliers",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(CreateSupplierSchema),
  CatalogController.createSupplier,
);
catalogRouter.patch(
  "/suppliers/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateSupplierSchema),
  CatalogController.updateSupplier,
);
catalogRouter.put(
  "/suppliers/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(UpdateSupplierSchema),
  CatalogController.updateSupplier,
);
catalogRouter.patch(
  "/suppliers/:id/status",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.updateSupplier,
);

// Fabric Variants
catalogRouter.get("/fabric-variants", requireCapability(Capability.CATALOG_READ), CatalogController.listFabricVariants);
catalogRouter.post(
  "/fabric-variants",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(CreateFabricVariantSchema),
  CatalogController.createFabricVariant,
);
catalogRouter.patch(
  "/fabric-variants/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.setFabricVariantStatus,
);
catalogRouter.patch(
  "/fabric-variants/:id/status",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.setFabricVariantStatus,
);

// Yarn Variants
catalogRouter.get("/yarn-variants", requireCapability(Capability.CATALOG_READ), CatalogController.listYarnVariants);
catalogRouter.post(
  "/yarn-variants",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(CreateYarnVariantSchema),
  CatalogController.createYarnVariant,
);
catalogRouter.patch(
  "/yarn-variants/:id",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.setYarnVariantStatus,
);
catalogRouter.patch(
  "/yarn-variants/:id/status",
  requireCapability(Capability.CATALOG_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.setYarnVariantStatus,
);

// Prices: Fabric & Yarn
catalogRouter.get("/fabric-prices", requireCapability(Capability.CATALOG_READ), CatalogController.listFabricPrices);
catalogRouter.get("/prices/fabrics", requireCapability(Capability.CATALOG_READ), CatalogController.listFabricPrices);
catalogRouter.post(
  "/fabric-prices",
  requireCapability(Capability.PRICES_MANAGE),
  validateBody(CreateFabricPriceSchema),
  CatalogController.createFabricPrice,
);
catalogRouter.post(
  "/prices/fabrics",
  requireCapability(Capability.PRICES_MANAGE),
  validateBody(CreateFabricPriceSchema),
  CatalogController.createFabricPrice,
);
catalogRouter.patch(
  "/fabric-prices/:id",
  requireCapability(Capability.PRICES_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.setFabricPriceStatus,
);

catalogRouter.get("/yarn-prices", requireCapability(Capability.PRICES_READ), CatalogController.listYarnPrices);
catalogRouter.get("/prices/yarns", requireCapability(Capability.PRICES_READ), CatalogController.listYarnPrices);
catalogRouter.post(
  "/yarn-prices",
  requireCapability(Capability.PRICES_MANAGE),
  validateBody(CreateYarnPriceSchema),
  CatalogController.createYarnPrice,
);
catalogRouter.post(
  "/prices/yarns",
  requireCapability(Capability.PRICES_MANAGE),
  validateBody(CreateYarnPriceSchema),
  CatalogController.createYarnPrice,
);
catalogRouter.patch(
  "/yarn-prices/:id",
  requireCapability(Capability.PRICES_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.setYarnPriceStatus,
);

// Quality Rules
catalogRouter.get("/quality-rules", requireCapability(Capability.CATALOG_READ), CatalogController.listQualityRules);
catalogRouter.post(
  "/quality-rules",
  requireCapability(Capability.QUALITY_RULES_MANAGE),
  validateBody(CreateQualityRuleSchema),
  CatalogController.createQualityRule,
);
catalogRouter.patch(
  "/quality-rules/:id",
  requireCapability(Capability.QUALITY_RULES_MANAGE),
  validateBody(UpdateQualityRuleSchema),
  CatalogController.updateQualityRule,
);
catalogRouter.put(
  "/quality-rules/:id",
  requireCapability(Capability.QUALITY_RULES_MANAGE),
  validateBody(UpdateQualityRuleSchema),
  CatalogController.updateQualityRule,
);
catalogRouter.patch(
  "/quality-rules/:id/status",
  requireCapability(Capability.QUALITY_RULES_MANAGE),
  validateBody(SetActiveStatusSchema),
  CatalogController.updateQualityRule,
);
