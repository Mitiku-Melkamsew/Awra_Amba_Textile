import { prisma } from "../../lib/prisma.js";

export class StockService {
  /**
   * Complete inventory summary of all yarn and fabric variants
   */
  static async getSummary() {
    const [yarns, fabrics] = await Promise.all([
      prisma.yarnVariant.findMany({
        where: { isActive: true },
        include: { yarn: true, color: true, supplier: true },
        orderBy: { sku: "asc" },
      }),
      prisma.fabricVariant.findMany({
        where: { isActive: true },
        include: { fabric: true, warpColor: true, weftColor: true, design: true },
        orderBy: { sku: "asc" },
      }),
    ]);

    const totalYarnStockPieces = yarns.reduce((sum, y) => sum + Number(y.stockSnapshot), 0);
    const totalFabricStockPieces = fabrics.reduce((sum, f) => sum + Number(f.stockSnapshot), 0);

    return {
      totalYarnStockPieces: Math.round(totalYarnStockPieces),
      totalYarnStockKg: Number(totalYarnStockPieces.toFixed(2)), // compatibility alias
      totalFabricStockPieces,
      yarns,
      fabrics,
    };
  }

  /**
   * Fabric stock broken down by variant
   */
  static async getFabricStock(activeOnly = true) {
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
        warpColor: true,
        weftColor: true,
        design: true,
      },
      orderBy: { sku: "asc" },
    });
  }

  /**
   * Yarn stock broken down by variant
   */
  static async getYarnStock(activeOnly = true) {
    return prisma.yarnVariant.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        yarn: {
          include: {
            yarnPrices: {
              where: { isActive: true },
              orderBy: { effectiveFrom: "desc" },
              take: 1,
            },
          },
        },
        color: true,
        supplier: true,
      },
      orderBy: { sku: "asc" },
    });
  }

  /**
   * Available fabrics for commercial catalogs and order selectors
   */
  static async getAvailableFabrics(maskInternalPrices = false) {
    const variants = await prisma.fabricVariant.findMany({
      where: { isActive: true },
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
        warpColor: true,
        weftColor: true,
        design: true,
      },
      orderBy: { sku: "asc" },
    });

    if (variants.length > 0) {
      return variants.map((fv) => ({
        fabricVariantId: fv.fabricVariantId,
        sku: fv.sku,
        fabricId: fv.fabricId,
        fabricName: fv.fabric.name,
        standardLengthCm: fv.fabric.standardLengthCm,
        standardWidthCm: fv.fabric.standardWidthCm,
        standardWeightG: fv.fabric.standardWeightG,
        design: fv.design?.name ?? "Standard",
        warpColor: fv.warpColor?.name ?? "Natural",
        weftColor: fv.weftColor?.name ?? "Natural",
        sellingPrice: Number(fv.fabric.prices[0]?.sellingPrice ?? 0),
        weaverRate: maskInternalPrices ? undefined : Number(fv.fabric.prices[0]?.weaverRate ?? 0),
      }));
    }

    const fabrics = await prisma.fabric.findMany({
      where: { isActive: true },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return fabrics.map((f, idx) => ({
      fabricVariantId: idx + 1,
      sku: `F-${String(f.fabricId).padStart(3, "0")}`,
      fabricId: f.fabricId,
      fabricName: f.name,
      standardLengthCm: f.standardLengthCm,
      standardWidthCm: f.standardWidthCm,
      standardWeightG: f.standardWeightG,
      design: "Standard",
      warpColor: "Natural",
      weftColor: "Natural",
      sellingPrice: Number(f.prices[0]?.sellingPrice ?? 0),
      weaverRate: maskInternalPrices ? undefined : Number(f.prices[0]?.weaverRate ?? 0),
    }));
  }
}
