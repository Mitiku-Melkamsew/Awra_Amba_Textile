import { UserRole } from "@prisma/client";
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const stockRouter = Router();

stockRouter.use(authenticate);

// GET /api/v1/stock/available-fabrics
// Public to all authenticated roles (merchants, weavers, admin)
stockRouter.get("/available-fabrics", async (req, res, next) => {
  try {
    const isOnlyMerchant =
      req.user?.roles?.includes(UserRole.merchant) && !req.user?.roles?.includes(UserRole.admin);
    const fabricVariants = await prisma.fabricVariant.findMany({
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

    res.json(
      fabricVariants.map((fv) => ({
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
        weaverRate: isOnlyMerchant ? undefined : Number(fv.fabric.prices[0]?.weaverRate ?? 0),
      })),
    );
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/stock
stockRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const [yarnVariants, fabricVariants] = await Promise.all([
      prisma.yarnVariant.findMany({
        where: { isActive: true },
        include: { yarn: true, color: true, supplier: true },
        orderBy: { sku: "asc" },
      }),
      prisma.fabricVariant.findMany({
        where: { isActive: true },
        include: {
          fabric: true,
          warpColor: true,
          weftColor: true,
          design: true,
        },
        orderBy: { sku: "asc" },
      }),
    ]);

    res.json({
      yarnVariants: yarnVariants.map((y) => ({
        ...y,
        yarnType: { yarnTypeId: y.yarnId, materialName: y.yarn.name }, // alias
      })),
      fabricVariants: fabricVariants.map((f) => ({
        ...f,
        product: f.fabric, // alias
      })),
    });
  } catch (error) {
    next(error);
  }
});
