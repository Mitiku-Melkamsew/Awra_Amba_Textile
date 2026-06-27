import { WorkOrderStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const workOrdersRouter = Router();

workOrdersRouter.use(authenticate);

const createSchema = z.object({
  zigId: z.string().regex(/^z-\d+$/),
  weaverId: z.number().int().positive(),
  fabricVariantId: z.number().int().positive(),
});

const statusSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus),
});

workOrdersRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as WorkOrderStatus | undefined;
    const weaverId = req.user?.role === "weaver" ? req.user.weaverId : undefined;
    const filterWeaverId = req.query.weaverId ? Number(req.query.weaverId) : weaverId ?? undefined;

    const workOrders = await prisma.workOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(filterWeaverId ? { weaverId: filterWeaverId } : {}),
      },
      include: {
        weaver: true,
        fabricVariant: { include: { product: true } },
        _count: { select: { yarnGiven: true, fabricReturns: true } },
      },
      orderBy: { dateIssued: "desc" },
    });

    res.json(workOrders);
  } catch (error) {
    next(error);
  }
});

workOrdersRouter.get("/:zigId", async (req, res, next) => {
  try {
    const zigId = String(req.params.zigId);
    const workOrder = await prisma.workOrder.findUnique({
      where: { zigId },
      include: {
        weaver: true,
        fabricVariant: { include: { product: true } },
        yarnGiven: { include: { yarnVariant: true } },
        fabricReturns: { include: { fabricVariant: { include: { product: true } } } },
      },
    });

    if (!workOrder) {
      res.status(404).json({ error: "Work order not found" });
      return;
    }

    if (req.user?.role === "weaver" && req.user.weaverId !== workOrder.weaverId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    res.json(workOrder);
  } catch (error) {
    next(error);
  }
});

workOrdersRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const workOrder = await prisma.workOrder.create({
      data: {
        zigId: body.zigId,
        weaverId: body.weaverId,
        fabricVariantId: body.fabricVariantId,
        issuedByUserId: req.user!.userId,
      },
      include: {
        weaver: true,
        fabricVariant: { include: { product: true } },
      },
    });
    res.status(201).json(workOrder);
  } catch (error) {
    next(error);
  }
});

workOrdersRouter.patch("/:zigId/status", requireAdmin, async (req, res, next) => {
  try {
    const zigId = String(req.params.zigId);
    const body = statusSchema.parse(req.body);
    const workOrder = await prisma.workOrder.update({
      where: { zigId },
      data: { status: body.status },
      include: {
        weaver: true,
        fabricVariant: { include: { product: true } },
      },
    });
    res.json(workOrder);
  } catch (error) {
    next(error);
  }
});