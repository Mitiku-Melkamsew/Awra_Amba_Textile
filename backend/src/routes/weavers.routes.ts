import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const weaversRouter = Router();

weaversRouter.use(authenticate);

const createWeaverSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  bankAccountNumber: z.string().max(40).optional(),
});

weaversRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const weavers = await prisma.weaver.findMany({
      where: { isActive: true },
      orderBy: [{ weaverId: "asc" }],
    });
    res.json(weavers);
  } catch (error) {
    next(error);
  }
});

weaversRouter.get("/:id", async (req, res, next) => {
  try {
    const weaverId = Number(req.params.id);
    if (req.user?.role !== "admin" && req.user?.weaverId !== weaverId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const weaver = await prisma.weaver.findUnique({ where: { weaverId } });
    if (!weaver) {
      res.status(404).json({ error: "Weaver not found" });
      return;
    }
    res.json(weaver);
  } catch (error) {
    next(error);
  }
});

weaversRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = createWeaverSchema.parse(req.body);
    const weaver = await prisma.weaver.create({ data: body });
    res.status(201).json(weaver);
  } catch (error) {
    next(error);
  }
});

weaversRouter.get("/:id/unsettled", async (req, res, next) => {
  try {
    const weaverId = Number(req.params.id);
    if (req.user?.role !== "admin" && req.user?.weaverId !== weaverId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const [returns, yarnGiven, sales] = await Promise.all([
      prisma.fabricReturn.findMany({
        where: { paymentId: null, workOrder: { weaverId } },
        include: { fabricVariant: { include: { product: true } } },
        orderBy: { returnId: "asc" },
      }),
      prisma.yarnGiven.findMany({
        where: { paymentId: null, workOrder: { weaverId } },
        include: { yarnVariant: true },
        orderBy: { yarnGivenId: "asc" },
      }),
      prisma.sale.findMany({
        where: {
          paymentId: null,
          weaverId,
          movementType: { in: ["weaver_yarn_sale", "weaver_fabric_purchase"] },
        },
        orderBy: { saleId: "asc" },
      }),
    ]);

    res.json({ returns, yarnGiven, sales });
  } catch (error) {
    next(error);
  }
});