import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import { NotFoundError, ConflictError } from "../../domain/errors/domain-errors.js";

export class CatalogService {
  /**
   * Unified lookup bundle for frontend dropdowns and cached selectors
   */
  static async getLookup() {
    const [fabrics, yarns, colors, designs, suppliers, qualityRules] = await Promise.all([
      prisma.fabric.findMany({
        where: { isActive: true },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { effectiveFrom: "desc" },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.yarn.findMany({
        where: { isActive: true },
        include: {
          yarnPrices: {
            where: { isActive: true },
            orderBy: { effectiveFrom: "desc" },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.color.findMany({ orderBy: { name: "asc" } }),
      prisma.design.findMany({ orderBy: { name: "asc" } }),
      prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.qualityRule.findMany({ where: { isActive: true }, orderBy: { qualityRuleId: "asc" } }),
    ]);

    return {
      fabrics,
      yarns,
      colors,
      designs,
      suppliers,
      qualityRules,
    };
  }

  // --- Fabrics ---

  static async listFabrics(activeOnly = false) {
    return prisma.fabric.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
      orderBy: { fabricId: "asc" },
    });
  }

  static async getFabric(fabricId: number) {
    const fabric = await prisma.fabric.findUnique({
      where: { fabricId },
      include: {
        prices: { orderBy: { effectiveFrom: "desc" } },
        variants: {
          include: { design: true, warpColor: true, weftColor: true },
        },
      },
    });
    if (!fabric) throw new NotFoundError(`Fabric with ID ${fabricId} not found`);
    return fabric;
  }

  static async createFabric(
    data: { name: string; standardLengthCm: number; standardWidthCm: number; standardWeightG: number },
    actorUserId: number,
  ) {
    const cleanedName = data.name.trim().toLowerCase();
    const existing = await prisma.fabric.findFirst({
      where: { name: { equals: cleanedName, mode: "insensitive" } },
    });
    if (existing) {
      throw new ConflictError(`Fabric '${data.name.trim()}' already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.fabric.create({
        data: {
          name: cleanedName,
          standardLengthCm: data.standardLengthCm,
          standardWidthCm: data.standardWidthCm,
          standardWeightG: data.standardWeightG,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.fabric.create",
          entityType: "fabric",
          entityId: created.fabricId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async updateFabric(
    fabricId: number,
    data: { name?: string; standardLengthCm?: number; standardWidthCm?: number; standardWeightG?: number; isActive?: boolean },
    actorUserId: number,
  ) {
    await this.getFabric(fabricId);

    let cleanedName: string | undefined = undefined;
    if (data.name !== undefined) {
      cleanedName = data.name.trim().toLowerCase();
      const existing = await prisma.fabric.findFirst({
        where: {
          name: { equals: cleanedName, mode: "insensitive" },
          fabricId: { not: fabricId },
        },
      });
      if (existing) {
        throw new ConflictError(`Fabric '${data.name.trim()}' already exists`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.fabric.update({
        where: { fabricId },
        data: {
          ...data,
          name: cleanedName,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.fabric.update",
          entityType: "fabric",
          entityId: fabricId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }

  // --- Yarns ---

  static async listYarns(activeOnly = false) {
    return prisma.yarn.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        yarnPrices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
  }

  static async createYarn(data: { name: string }, actorUserId: number) {
    const cleanedName = data.name.trim().toLowerCase();
    const existing = await prisma.yarn.findFirst({
      where: { name: { equals: cleanedName, mode: "insensitive" } },
    });
    if (existing) {
      throw new ConflictError(`Yarn '${data.name.trim()}' already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.yarn.create({
        data: { name: cleanedName },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.yarn.create",
          entityType: "yarn",
          entityId: created.yarnId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async updateYarn(
    yarnId: number,
    data: { name?: string; isActive?: boolean },
    actorUserId: number,
  ) {
    let cleanedName: string | undefined = undefined;
    if (data.name !== undefined) {
      cleanedName = data.name.trim().toLowerCase();
      const existing = await prisma.yarn.findFirst({
        where: {
          name: { equals: cleanedName, mode: "insensitive" },
          yarnId: { not: yarnId },
        },
      });
      if (existing) {
        throw new ConflictError(`Yarn '${data.name.trim()}' already exists`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.yarn.update({
        where: { yarnId },
        data: {
          name: cleanedName,
          isActive: data.isActive,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.yarn.update",
          entityType: "yarn",
          entityId: yarnId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }

  // --- Colors & Designs ---

  static async listColors() {
    return prisma.color.findMany({ orderBy: { name: "asc" } });
  }

  static async createColor(data: { name: string }, actorUserId: number) {
    const cleanedName = data.name.trim().toLowerCase();
    const existing = await prisma.color.findFirst({
      where: { name: { equals: cleanedName, mode: "insensitive" } },
    });
    if (existing) {
      throw new ConflictError(`Color '${data.name.trim()}' already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.color.create({
        data: { name: cleanedName },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.color.create",
          entityType: "color",
          entityId: created.colorId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async updateColor(colorId: number, data: { name: string }, actorUserId: number) {
    const cleanedName = data.name.trim().toLowerCase();
    const existing = await prisma.color.findFirst({
      where: {
        name: { equals: cleanedName, mode: "insensitive" },
        colorId: { not: colorId },
      },
    });
    if (existing) {
      throw new ConflictError(`Color '${data.name.trim()}' already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.color.update({
        where: { colorId },
        data: {
          name: cleanedName,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.color.update",
          entityType: "color",
          entityId: colorId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }

  static async deleteColor(colorId: number, actorUserId: number) {
    const referencingVariants = await prisma.fabricVariant.count({
      where: { OR: [{ warpColorId: colorId }, { weftColorId: colorId }] },
    });
    if (referencingVariants > 0) {
      throw new ConflictError("Cannot delete color referenced by fabric variants");
    }

    return prisma.$transaction(async (tx) => {
      await tx.color.delete({ where: { colorId } });
      await AuditService.record(
        {
          actorUserId,
          action: "catalog.color.delete",
          entityType: "color",
          entityId: colorId,
        },
        tx,
      );
      return { success: true };
    });
  }

  static async listDesigns() {
    return prisma.design.findMany({ orderBy: { name: "asc" } });
  }

  static async createDesign(data: { name: string }, actorUserId: number) {
    const cleanedName = data.name.trim().toLowerCase();
    const existing = await prisma.design.findFirst({
      where: { name: { equals: cleanedName, mode: "insensitive" } },
    });
    if (existing) {
      throw new ConflictError(`Design '${data.name.trim()}' already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.design.create({
        data: { name: cleanedName },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.design.create",
          entityType: "design",
          entityId: created.designId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async updateDesign(designId: number, data: { name: string }, actorUserId: number) {
    const cleanedName = data.name.trim().toLowerCase();
    const existing = await prisma.design.findFirst({
      where: {
        name: { equals: cleanedName, mode: "insensitive" },
        designId: { not: designId },
      },
    });
    if (existing) {
      throw new ConflictError(`Design '${data.name.trim()}' already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.design.update({
        where: { designId },
        data: { name: cleanedName },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.design.update",
          entityType: "design",
          entityId: designId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }

  static async deleteDesign(designId: number, actorUserId: number) {
    const referencingVariants = await prisma.fabricVariant.count({
      where: { designId },
    });
    if (referencingVariants > 0) {
      throw new ConflictError("Cannot delete design referenced by fabric variants");
    }

    return prisma.$transaction(async (tx) => {
      await tx.design.delete({ where: { designId } });
      await AuditService.record(
        {
          actorUserId,
          action: "catalog.design.delete",
          entityType: "design",
          entityId: designId,
        },
        tx,
      );
      return { success: true };
    });
  }

  // --- Suppliers ---

  static async listSuppliers(activeOnly = false) {
    return prisma.supplier.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });
  }

  static async createSupplier(data: { name: string; contactPhone?: string }, actorUserId: number) {
    const cleanedName = data.name.trim().toLowerCase();
    const existing = await prisma.supplier.findFirst({
      where: { name: { equals: cleanedName, mode: "insensitive" } },
    });
    if (existing) {
      throw new ConflictError(`Supplier '${data.name.trim()}' already exists`);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.supplier.create({
        data: { name: cleanedName, contactPhone: data.contactPhone?.trim() },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.supplier.create",
          entityType: "supplier",
          entityId: created.supplierId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async updateSupplier(
    supplierId: number,
    data: { name?: string; contactPhone?: string; isActive?: boolean },
    actorUserId: number,
  ) {
    let cleanedName: string | undefined = undefined;
    if (data.name !== undefined) {
      cleanedName = data.name.trim().toLowerCase();
      const existing = await prisma.supplier.findFirst({
        where: {
          name: { equals: cleanedName, mode: "insensitive" },
          supplierId: { not: supplierId },
        },
      });
      if (existing) {
        throw new ConflictError(`Supplier '${data.name.trim()}' already exists`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.supplier.update({
        where: { supplierId },
        data: {
          name: cleanedName,
          contactPhone: data.contactPhone?.trim(),
          isActive: data.isActive,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.supplier.update",
          entityType: "supplier",
          entityId: supplierId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }

  // --- Fabric Variants ---

  static async listFabricVariants(activeOnly = false) {
    return prisma.fabricVariant.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        fabric: {
          include: {
            prices: {
              where: { isActive: true },
              orderBy: { effectiveFrom: "desc" },
              take: 1,
            },
          },
        },
        design: true,
        warpColor: true,
        weftColor: true,
      },
      orderBy: { fabricVariantId: "asc" },
    });
  }

  static async createFabricVariant(
    data: {
      fabricId: number;
      designId: number;
      warpColorId: number;
      weftColorId: number;
      sku?: string;
    },
    actorUserId: number,
  ) {
    const existingCombination = await prisma.fabricVariant.findFirst({
      where: {
        fabricId: data.fabricId,
        designId: data.designId,
        warpColorId: data.warpColorId,
        weftColorId: data.weftColorId,
      },
    });

    if (existingCombination) {
      if (existingCombination.isActive) {
        throw new ConflictError(
          `A fabric variant with this exact combination already exists (SKU: ${existingCombination.sku}).`,
        );
      } else {
        throw new ConflictError(
          `A fabric variant with this combination already exists but is currently deactivated (SKU: ${existingCombination.sku}). Please reactivate it from the list.`,
        );
      }
    }

    const sku =
      data.sku?.trim() ||
      `FV-${data.fabricId}-${data.designId}-${data.warpColorId}-${data.weftColorId}`;

    const existingSku = await prisma.fabricVariant.findUnique({
      where: { sku },
    });
    if (existingSku) {
      throw new ConflictError(`A fabric variant with SKU "${sku}" already exists.`);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.fabricVariant.create({
        data: {
          fabricId: data.fabricId,
          designId: data.designId,
          warpColorId: data.warpColorId,
          weftColorId: data.weftColorId,
          sku,
        },
        include: {
          fabric: true,
          design: true,
          warpColor: true,
          weftColor: true,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.fabric_variant.create",
          entityType: "fabric_variant",
          entityId: created.fabricVariantId,
          details: { ...data, sku },
        },
        tx,
      );

      return created;
    });
  }

  static async setFabricVariantStatus(fabricVariantId: number, isActive: boolean, actorUserId: number) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.fabricVariant.update({
        where: { fabricVariantId },
        data: { isActive },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.fabric_variant.status",
          entityType: "fabric_variant",
          entityId: fabricVariantId,
          details: { isActive },
        },
        tx,
      );

      return updated;
    });
  }

  // --- Yarn Variants ---

  static async listYarnVariants(activeOnly = false) {
    return prisma.yarnVariant.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        yarn: {
          include: {
            yarnPrices: {
              where: { isActive: true },
              orderBy: { effectiveFrom: "desc" },
            },
          },
        },
        color: true,
        supplier: true,
      },
      orderBy: { yarnVariantId: "asc" },
    });
  }

  static async createYarnVariant(
    data: {
      yarnId: number;
      colorId: number;
      supplierId: number;
      sku?: string;
    },
    actorUserId: number,
  ) {
    const existingCombination = await prisma.yarnVariant.findFirst({
      where: {
        yarnId: data.yarnId,
        colorId: data.colorId,
        supplierId: data.supplierId,
      },
    });

    if (existingCombination) {
      if (existingCombination.isActive) {
        throw new ConflictError(
          `A yarn variant with this material, color, and supplier already exists (SKU: ${existingCombination.sku}).`,
        );
      } else {
        throw new ConflictError(
          `A yarn variant with this combination already exists but is currently deactivated (SKU: ${existingCombination.sku}). Please reactivate it from the list.`,
        );
      }
    }

    const sku =
      data.sku?.trim() ||
      `YV-${data.yarnId}-${data.supplierId}-${data.colorId}`;

    const existingSku = await prisma.yarnVariant.findUnique({
      where: { sku },
    });
    if (existingSku) {
      throw new ConflictError(`A yarn variant with SKU "${sku}" already exists.`);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.yarnVariant.create({
        data: {
          yarnId: data.yarnId,
          colorId: data.colorId,
          supplierId: data.supplierId,
          sku,
        },
        include: {
          yarn: true,
          color: true,
          supplier: true,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.yarn_variant.create",
          entityType: "yarn_variant",
          entityId: created.yarnVariantId,
          details: { ...data, sku },
        },
        tx,
      );

      return created;
    });
  }

  static async setYarnVariantStatus(yarnVariantId: number, isActive: boolean, actorUserId: number) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.yarnVariant.update({
        where: { yarnVariantId },
        data: { isActive },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.yarn_variant.status",
          entityType: "yarn_variant",
          entityId: yarnVariantId,
          details: { isActive },
        },
        tx,
      );

      return updated;
    });
  }

  // --- Prices ---

  static async listFabricPrices(fabricId?: number, activeOnly?: boolean) {
    const where: any = {};
    if (fabricId) where.fabricId = fabricId;
    if (activeOnly) {
      where.isActive = true;
      where.OR = [
        { effectiveTo: null },
        { effectiveTo: { gt: new Date() } },
      ];
    }
    return prisma.fabricPrice.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { fabric: true },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  static async createFabricPrice(
    data: { fabricId: number; weaverRate: number; sellingPrice: number; effectiveFrom?: Date },
    actorUserId: number,
  ) {
    const effectiveFrom = data.effectiveFrom ?? new Date();

    return prisma.$transaction(async (tx) => {
      await tx.fabricPrice.updateMany({
        where: {
          fabricId: data.fabricId,
          isActive: true,
          effectiveTo: null,
        },
        data: { effectiveTo: effectiveFrom },
      });

      const created = await tx.fabricPrice.create({
        data: {
          fabricId: data.fabricId,
          weaverRate: data.weaverRate,
          sellingPrice: data.sellingPrice,
          effectiveFrom,
        },
        include: { fabric: true },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.fabric_price.create",
          entityType: "fabric_price",
          entityId: created.fabricPriceId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async setFabricPriceStatus(fabricPriceId: number, isActive: boolean, actorUserId: number) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.fabricPrice.update({
        where: { fabricPriceId },
        data: { isActive },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.fabric_price.status",
          entityType: "fabric_price",
          entityId: fabricPriceId,
          details: { isActive },
        },
        tx,
      );

      return updated;
    });
  }

  static async listYarnPrices(yarnId?: number, activeOnly?: boolean) {
    const where: any = {};
    if (yarnId) where.yarnId = yarnId;
    if (activeOnly) {
      where.isActive = true;
      where.OR = [
        { effectiveTo: null },
        { effectiveTo: { gt: new Date() } },
      ];
    }
    return prisma.yarnPrice.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { yarn: true, supplier: true },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  static async createYarnPrice(
    data: { yarnId: number; supplierId: number; purchasePrice: number; sellingPrice: number; effectiveFrom?: Date },
    actorUserId: number,
  ) {
    const effectiveFrom = data.effectiveFrom ?? new Date();

    return prisma.$transaction(async (tx) => {
      await tx.yarnPrice.updateMany({
        where: {
          yarnId: data.yarnId,
          supplierId: data.supplierId,
          isActive: true,
          effectiveTo: null,
        },
        data: { effectiveTo: effectiveFrom },
      });

      const created = await tx.yarnPrice.create({
        data: {
          yarnId: data.yarnId,
          supplierId: data.supplierId,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          effectiveFrom,
        },
        include: { yarn: true, supplier: true },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.yarn_price.create",
          entityType: "yarn_price",
          entityId: created.yarnPriceId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async setYarnPriceStatus(yarnPriceId: number, isActive: boolean, actorUserId: number) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.yarnPrice.update({
        where: { yarnPriceId },
        data: { isActive },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.yarn_price.status",
          entityType: "yarn_price",
          entityId: yarnPriceId,
          details: { isActive },
        },
        tx,
      );

      return updated;
    });
  }

  // --- Quality Rules ---

  static async listQualityRules(activeOnly = false) {
    return prisma.qualityRule.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { qualityRuleId: "asc" },
    });
  }

  static async createQualityRule(
    data: { factor: string; unit: string; deductionPerUnit: number },
    actorUserId: number,
  ) {
    const cleanedFactor = data.factor.trim().toLowerCase();
    const cleanedUnit = data.unit.trim().toLowerCase();

    const existing = await prisma.qualityRule.findFirst({
      where: {
        factor: { equals: cleanedFactor, mode: "insensitive" },
        unit: { equals: cleanedUnit, mode: "insensitive" },
      },
    });
    if (existing) {
      throw new ConflictError(
        `Quality rule for factor '${data.factor.trim()}' and unit '${data.unit.trim()}' already exists`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.qualityRule.create({
        data: {
          factor: cleanedFactor,
          unit: cleanedUnit,
          deductionPerUnit: data.deductionPerUnit,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.quality_rule.create",
          entityType: "quality_rule",
          entityId: created.qualityRuleId,
          details: data,
        },
        tx,
      );

      return created;
    });
  }

  static async updateQualityRule(
    qualityRuleId: number,
    data: { factor?: string; unit?: string; deductionPerUnit?: number; isActive?: boolean },
    actorUserId: number,
  ) {
    let cleanedFactor: string | undefined = undefined;
    let cleanedUnit: string | undefined = undefined;

    if (data.factor !== undefined || data.unit !== undefined) {
      const current = await prisma.qualityRule.findUnique({ where: { qualityRuleId } });
      if (!current) throw new NotFoundError(`Quality rule with ID ${qualityRuleId} not found`);

      cleanedFactor = data.factor !== undefined ? data.factor.trim().toLowerCase() : current.factor.toLowerCase();
      cleanedUnit = data.unit !== undefined ? data.unit.trim().toLowerCase() : current.unit.toLowerCase();

      const existing = await prisma.qualityRule.findFirst({
        where: {
          factor: { equals: cleanedFactor, mode: "insensitive" },
          unit: { equals: cleanedUnit, mode: "insensitive" },
          qualityRuleId: { not: qualityRuleId },
        },
      });
      if (existing) {
        throw new ConflictError(
          `Quality rule for factor '${cleanedFactor}' and unit '${cleanedUnit}' already exists`,
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.qualityRule.update({
        where: { qualityRuleId },
        data: {
          factor: cleanedFactor,
          unit: cleanedUnit,
          deductionPerUnit: data.deductionPerUnit,
          isActive: data.isActive,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "catalog.quality_rule.update",
          entityType: "quality_rule",
          entityId: qualityRuleId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }
}
