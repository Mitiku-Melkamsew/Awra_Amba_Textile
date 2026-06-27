import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const fabricReturnsRouter = Router();

fabricReturnsRouter.use(authenticate, requireAdmin);

const createSchema = z.object({
  zigId: z.string(),
  fabricVariantId: z.number().int().positive(),
  quantityReturned: z.number().int().positive(),
  totalWeight: z.number().positive(),
  unitPrice: z.number().positive(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
});

fabricReturnsRouter.get("/", async (req, res, next) => {
  try {
    const zigId = req.query.zigId as string | undefined;
    const unsettled = req.query.unsettled === "true";

    const rows = await prisma.fabricReturn.findMany({
      where: {
        ...(zigId ? { zigId } : {}),
        ...(unsettled ? { paymentId: null } : {}),
      },
      include: {
        fabricVariant: { include: { product: true } },
        workOrder: { include: { weaver: true } },
      },
      orderBy: { dateReturned: "desc" },
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

fabricReturnsRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const row = await prisma.fabricReturn.create({
      data: {
        zigId: body.zigId,
        fabricVariantId: body.fabricVariantId,
        quantityReturned: body.quantityReturned,
        totalWeight: body.totalWeight,
        unitPrice: body.unitPrice,
        lengthCm: body.lengthCm,
        widthCm: body.widthCm,
        recordedByUserId: req.user!.userId,
      },
      include: {
        fabricVariant: { include: { product: true } },
        workOrder: { include: { weaver: true } },
      },
    });
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
});