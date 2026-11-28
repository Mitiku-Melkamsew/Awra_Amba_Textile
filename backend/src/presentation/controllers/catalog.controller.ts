import type { Request, Response, NextFunction } from "express";
import { CatalogService } from "../../application/services/catalog.service.js";
import { StockService } from "../../application/services/stock.service.js";
import { AbacService } from "../../application/security/abac.service.js";
import { numericParam } from "../http/params.js";
import {
  serializeCatalogLookup,
  serializeColor,
  serializeDesign,
  serializeFabric,
  serializeFabricPrice,
  serializeFabricVariant,
  serializeQualityRule,
  serializeSupplier,
  serializeYarn,
  serializeYarnPrice,
  serializeYarnVariant,
} from "../serializers/catalog.serializer.js";
import { serializeAvailableFabric } from "../serializers/stock.serializer.js";

export class CatalogController {
  static async getPublicCatalog(_req: Request, res: Response, next: NextFunction) {
    try {
      const catalog = await StockService.getAvailableFabrics(true);
      res.json(catalog.map(serializeAvailableFabric));
    } catch (error) {
      next(error);
    }
  }

  static async getLookup(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CatalogService.getLookup();
      res.json(serializeCatalogLookup(data));
    } catch (error) {
      next(error);
    }
  }

  // --- Fabrics ---

  static async listFabrics(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const fabrics = await CatalogService.listFabrics(activeOnly);
      const sanitized = fabrics.map((f) => AbacService.maskForRole(req.user?.roles ?? [], f));
      res.json(sanitized.map(serializeFabric));
    } catch (error) {
      next(error);
    }
  }

  static async getFabric(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const fabric = await CatalogService.getFabric(id);
      res.json(serializeFabric(AbacService.maskForRole(req.user?.roles ?? [], fabric)));
    } catch (error) {
      next(error);
    }
  }

  static async createFabric(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createFabric(req.body, actorUserId);
      res.status(201).json(serializeFabric(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateFabric(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateFabric(id, req.body, actorUserId);
      res.json(serializeFabric(updated));
    } catch (error) {
      next(error);
    }
  }

  // --- Yarns ---

  static async listYarns(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const yarns = await CatalogService.listYarns(activeOnly);
      res.json(yarns.map(serializeYarn));
    } catch (error) {
      next(error);
    }
  }

  static async createYarn(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createYarn(req.body, actorUserId);
      res.status(201).json(serializeYarn(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateYarn(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateYarn(id, req.body, actorUserId);
      res.json(serializeYarn(updated));
    } catch (error) {
      next(error);
    }
  }

  // --- Colors & Designs ---

  static async listColors(_req: Request, res: Response, next: NextFunction) {
    try {
      const colors = await CatalogService.listColors();
      res.json(colors.map(serializeColor));
    } catch (error) {
      next(error);
    }
  }

  static async createColor(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createColor(req.body, actorUserId);
      res.status(201).json(serializeColor(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateColor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateColor(id, req.body, actorUserId);
      res.json(serializeColor(updated));
    } catch (error) {
      next(error);
    }
  }

  static async deleteColor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const result = await CatalogService.deleteColor(id, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async listDesigns(_req: Request, res: Response, next: NextFunction) {
    try {
      const designs = await CatalogService.listDesigns();
      res.json(designs.map(serializeDesign));
    } catch (error) {
      next(error);
    }
  }

  static async createDesign(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createDesign(req.body, actorUserId);
      res.status(201).json(serializeDesign(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateDesign(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateDesign(id, req.body, actorUserId);
      res.json(serializeDesign(updated));
    } catch (error) {
      next(error);
    }
  }

  static async deleteDesign(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const result = await CatalogService.deleteDesign(id, actorUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- Suppliers ---

  static async listSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const suppliers = await CatalogService.listSuppliers(activeOnly);
      res.json(suppliers.map(serializeSupplier));
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createSupplier(req.body, actorUserId);
      res.status(201).json(serializeSupplier(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateSupplier(id, req.body, actorUserId);
      res.json(serializeSupplier(updated));
    } catch (error) {
      next(error);
    }
  }

  // --- Variants ---

  static async listFabricVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const variants = await CatalogService.listFabricVariants(activeOnly);
      res.json(variants.map(serializeFabricVariant));
    } catch (error) {
      next(error);
    }
  }

  static async createFabricVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createFabricVariant(req.body, actorUserId);
      res.status(201).json(serializeFabricVariant(created));
    } catch (error) {
      next(error);
    }
  }

  static async setFabricVariantStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setFabricVariantStatus(id, req.body.isActive, actorUserId);
      res.json(serializeFabricVariant(updated));
    } catch (error) {
      next(error);
    }
  }

  static async listYarnVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const variants = await CatalogService.listYarnVariants(activeOnly);
      res.json(variants.map(serializeYarnVariant));
    } catch (error) {
      next(error);
    }
  }

  static async createYarnVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createYarnVariant(req.body, actorUserId);
      res.status(201).json(serializeYarnVariant(created));
    } catch (error) {
      next(error);
    }
  }

  static async setYarnVariantStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setYarnVariantStatus(id, req.body.isActive, actorUserId);
      res.json(serializeYarnVariant(updated));
    } catch (error) {
      next(error);
    }
  }

  // --- Prices ---

  static async listFabricPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const fabricId = req.query.fabricId ? Number(req.query.fabricId) : undefined;
      const activeOnly = req.query.activeOnly === "true";
      const prices = await CatalogService.listFabricPrices(fabricId, activeOnly);
      const sanitized = prices.map((p) => AbacService.maskForRole(req.user?.roles ?? [], p));
      res.json(sanitized.map(serializeFabricPrice));
    } catch (error) {
      next(error);
    }
  }

  static async createFabricPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const b = req.body;
      const created = await CatalogService.createFabricPrice(
        {
          fabricId: Number(b.fabricId),
          weaverRate: Number(b.weaverRate),
          sellingPrice: Number(b.sellingPrice),
          effectiveFrom: b.effectiveFrom ? new Date(b.effectiveFrom) : undefined,
        },
        actorUserId,
      );
      res.status(201).json(serializeFabricPrice(created));
    } catch (error) {
      next(error);
    }
  }

  static async setFabricPriceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setFabricPriceStatus(id, req.body.isActive, actorUserId);
      res.json(serializeFabricPrice(updated));
    } catch (error) {
      next(error);
    }
  }

  static async listYarnPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const yarnId = req.query.yarnId ? Number(req.query.yarnId) : undefined;
      const activeOnly = req.query.activeOnly === "true";
      const prices = await CatalogService.listYarnPrices(yarnId, activeOnly);
      res.json(prices.map(serializeYarnPrice));
    } catch (error) {
      next(error);
    }
  }

  static async createYarnPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const b = req.body;
      const created = await CatalogService.createYarnPrice(
        {
          yarnId: Number(b.yarnId),
          supplierId: Number(b.supplierId),
          purchasePrice: Number(b.purchasePrice),
          sellingPrice: Number(b.sellingPrice),
          effectiveFrom: b.effectiveFrom ? new Date(b.effectiveFrom) : undefined,
        },
        actorUserId,
      );
      res.status(201).json(serializeYarnPrice(created));
    } catch (error) {
      next(error);
    }
  }

  static async setYarnPriceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setYarnPriceStatus(id, req.body.isActive, actorUserId);
      res.json(serializeYarnPrice(updated));
    } catch (error) {
      next(error);
    }
  }

  // --- Quality Rules ---

  static async listQualityRules(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const rules = await CatalogService.listQualityRules(activeOnly);
      res.json(rules.map(serializeQualityRule));
    } catch (error) {
      next(error);
    }
  }

  static async createQualityRule(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createQualityRule(req.body, actorUserId);
      res.status(201).json(serializeQualityRule(created));
    } catch (error) {
      next(error);
    }
  }

  static async updateQualityRule(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateQualityRule(id, req.body, actorUserId);
      res.json(serializeQualityRule(updated));
    } catch (error) {
      next(error);
    }
  }
}
