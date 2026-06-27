import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const catalogRouter = Router();

catalogRouter.get("/fabric-variants", async (_req, res, next) => {
  try {
    const variants = await prisma.fabricVariant.findMany({
      where: { isActive: true },
      include: {
        product: true,
        qualityRule: true,
        bonusRule: true,
      },
      orderBy: { fabricVariantId: "asc" },
    });
    res.json(variants);
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/yarn-variants", authenticate, async (_req, res, next) => {
  try {
    const variants = await prisma.yarnVariant.findMany({
      where: { isActive: true },
      include: { yarnType: true, color: true, supplier: true },
      orderBy: { yarnVariantId: "asc" },
    });
    res.json(variants);
  } catch (error) {
    next(error);
  }
});