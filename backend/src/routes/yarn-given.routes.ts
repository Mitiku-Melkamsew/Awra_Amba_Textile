import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const yarnGivenRouter = Router();

yarnGivenRouter.use(authenticate, requireAdmin);

const createSchema = z.object({
  zigId: z.string(),
  yarnVariantId: z.number().int().positive(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

yarnGivenRouter.get("/", async (req, res, next) => {
  try {
    const zigId = req.query.zigId as string | undefined;
    const rows = await prisma.yarnGiven.findMany({
      where: zigId ? { zigId } : undefined,
      include: { yarnVariant: true, workOrder: { include: { weaver: true } } },
      orderBy: { dateGiven: "desc" },
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

yarnGivenRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const row = await prisma.yarnGiven.create({
      data: {
        zigId: body.zigId,
        yarnVariantId: body.yarnVariantId,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        recordedByUserId: req.user!.userId,
      },
      include: { yarnVariant: true, workOrder: true },
    });
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
});