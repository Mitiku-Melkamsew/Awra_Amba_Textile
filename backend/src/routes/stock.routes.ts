import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const stockRouter = Router();

stockRouter.use(authenticate, requireAdmin);

stockRouter.get("/", async (_req, res, next) => {
  try {
    const [yarnVariants, fabricVariants] = await Promise.all([
      prisma.yarnVariant.findMany({
        where: { isActive: true },
        include: { yarnType: true, color: true, supplier: true },
        orderBy: { sku: "asc" },
      }),
      prisma.fabricVariant.findMany({
        where: { isActive: true },
        include: {
          product: true,
          warpColor: true,
          weftColor: true,
          design: true,
        },
        orderBy: { sku: "asc" },
      }),
    ]);

    res.json({ yarnVariants, fabricVariants });
  } catch (error) {
    next(error);
  }
});