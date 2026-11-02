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
  purchaseDate: z.string().datetime().optional().or(z.string()),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

// GET /api/v1/procurement/yarn-purchases
procurementRouter.get("/yarn-purchases", async (_req, res, next) => {
  try {
    const purchases = await prisma.yarnPurchase.findMany({
      include: {
        supplier: true,
        lines: { include: { yarnVariant: { include: { yarn: true, color: true } } } },
        createdBy: { select: { username: true } },
      },
      orderBy: { purchaseDate: "desc" },
      take: 100,
    });
    res.json(purchases);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/procurement/yarn-purchases
procurementRouter.post("/yarn-purchases", async (req, res, next) => {
  try {
    const body = createPurchaseSchema.parse(req.body);

    const purchase = await prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.yarnPurchase.create({
        data: {
          supplierId: body.supplierId,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
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
          lines: { include: { yarnVariant: { include: { yarn: true, color: true } } } },
        },
      });

      // Increment yarn stock for each line
      for (const line of body.lines) {
        await tx.yarnVariant.update({
          where: { yarnVariantId: line.yarnVariantId },
          data: { stockSnapshot: { increment: line.quantity } },
        });
      }

      return createdPurchase;
    });

    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
});
