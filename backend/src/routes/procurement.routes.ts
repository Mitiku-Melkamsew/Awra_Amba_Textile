import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const procurementRouter = Router();

procurementRouter.use(authenticate, requireAdmin);

const lineSchema = z.object({
  yarnVariantId: z.number().int().positive(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

const createPurchaseSchema = z.object({
  supplierId: z.number().int().positive(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

procurementRouter.get("/yarn-purchases", async (_req, res, next) => {
  try {
    const purchases = await prisma.yarnPurchase.findMany({
      include: {
        supplier: true,
        lines: { include: { yarnVariant: { include: { yarnType: true, color: true } } } },
        createdBy: { select: { username: true } },
      },
      orderBy: { purchaseDate: "desc" },
      take: 50,
    });
    res.json(purchases);
  } catch (error) {
    next(error);
  }
});

procurementRouter.post("/yarn-purchases", async (req, res, next) => {
  try {
    const body = createPurchaseSchema.parse(req.body);
    const purchase = await prisma.yarnPurchase.create({
      data: {
        supplierId: body.supplierId,
        notes: body.notes,
        createdByUserId: req.user!.userId,
        lines: {
          create: body.lines.map((line) => ({
            yarnVariantId: line.yarnVariantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
        lines: { include: { yarnVariant: { include: { yarnType: true, color: true } } } },
      },
    });
    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
});