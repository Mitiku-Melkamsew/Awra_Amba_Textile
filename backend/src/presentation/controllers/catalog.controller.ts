import type { Request, Response, NextFunction } from "express";
import { CatalogService } from "../../application/services/catalog.service.js";
import { AbacService } from "../../application/security/abac.service.js";

export class CatalogController {
  static async getLookup(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await CatalogService.getLookup();
      res.json(data);
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
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  }

  static async getFabric(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const fabric = await CatalogService.getFabric(id);
      res.json(AbacService.maskForRole(req.user?.roles ?? [], fabric));
    } catch (error) {
      next(error);
    }
  }

  static async createFabric(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createFabric(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async updateFabric(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateFabric(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // --- Yarns ---

  static async listYarns(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const yarns = await CatalogService.listYarns(activeOnly);
      res.json(yarns);
    } catch (error) {
      next(error);
    }
  }

  static async createYarn(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createYarn(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async updateYarn(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateYarn(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // --- Colors & Designs ---

  static async listColors(_req: Request, res: Response, next: NextFunction) {
    try {
      const colors = await CatalogService.listColors();
      res.json(colors);
    } catch (error) {
      next(error);
    }
  }

  static async createColor(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createColor(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async updateColor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateColor(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteColor(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
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
      res.json(designs);
    } catch (error) {
      next(error);
    }
  }

  static async createDesign(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createDesign(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async updateDesign(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateDesign(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteDesign(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
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
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createSupplier(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateSupplier(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // --- Variants ---

  static async listFabricVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const variants = await CatalogService.listFabricVariants(activeOnly);
      res.json(variants);
    } catch (error) {
      next(error);
    }
  }

  static async createFabricVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createFabricVariant(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async setFabricVariantStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setFabricVariantStatus(id, req.body.isActive, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async listYarnVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const variants = await CatalogService.listYarnVariants(activeOnly);
      res.json(variants);
    } catch (error) {
      next(error);
    }
  }

  static async createYarnVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createYarnVariant(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async setYarnVariantStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setYarnVariantStatus(id, req.body.isActive, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // --- Prices ---

  static async listFabricPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const fabricId = req.query.fabricId ? Number(req.query.fabricId) : undefined;
      const prices = await CatalogService.listFabricPrices(fabricId);
      const sanitized = prices.map((p) => AbacService.maskForRole(req.user?.roles ?? [], p));
      res.json(sanitized);
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
          fabricId: b.fabricId,
          weaverRate: b.weaverRate ?? b.weaverUnitPrice,
          sellingPrice: b.sellingPrice ?? b.sellingUnitPrice,
          effectiveFrom: b.effectiveFrom ? new Date(b.effectiveFrom) : undefined,
        },
        actorUserId,
      );
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async setFabricPriceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setFabricPriceStatus(id, req.body.isActive, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async listYarnPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const yarnId = req.query.yarnId ? Number(req.query.yarnId) : undefined;
      const prices = await CatalogService.listYarnPrices(yarnId);
      res.json(prices);
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
          yarnId: b.yarnId,
          supplierId: b.supplierId,
          purchasePrice: b.purchasePrice ?? b.costPerKg,
          sellingPrice: b.sellingPrice ?? b.sellingPricePerKg,
          effectiveFrom: b.effectiveFrom ? new Date(b.effectiveFrom) : undefined,
        },
        actorUserId,
      );
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async setYarnPriceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.setYarnPriceStatus(id, req.body.isActive, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // --- Quality Rules ---

  static async listQualityRules(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const rules = await CatalogService.listQualityRules(activeOnly);
      res.json(rules);
    } catch (error) {
      next(error);
    }
  }

  static async createQualityRule(req: Request, res: Response, next: NextFunction) {
    try {
      const actorUserId = req.user!.userId;
      const created = await CatalogService.createQualityRule(req.body, actorUserId);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async updateQualityRule(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const actorUserId = req.user!.userId;
      const updated = await CatalogService.updateQualityRule(id, req.body, actorUserId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}
