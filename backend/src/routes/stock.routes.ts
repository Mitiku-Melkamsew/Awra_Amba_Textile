import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const stockRouter = Router();

stockRouter.use(authenticate, requireAdmin);

// GET /api/v1/stock
stockRouter.get("/", async (_req, res, next) => {
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
