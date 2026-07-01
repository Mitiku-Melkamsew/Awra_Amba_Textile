import { WorkOrderStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { resolveTransactionLine } from "../services/transaction-line-resolver.service.js";
import { resolveFabricVariant } from "../services/variant.service.js";

export const workOrdersRouter = Router();

workOrdersRouter.use(authenticate);

const fabricInclude = {
  product: true,
  warpColor: true,
  weftColor: true,
  design: true,
};

const yarnLineSchema = z.object({
  yarnVariantId: z.number().int().positive().optional(),
  yarnTypeId: z.number().int().positive().optional(),
  colorId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

const createSchema = z.object({
  zigId: z.string().regex(/^z-[\w-]+$/).optional(),
  weaverId: z.number().int().positive(),
  productId: z.number().int().positive(),
  warpColorId: z.number().int().positive(),
  weftColorId: z.number().int().positive(),
  designId: z.number().int().positive().optional().nullable(),
  unitPrice: z.number().positive().optional(),
  yarnLines: z.array(yarnLineSchema).default([]),
});

async function generateNextZigId(): Promise<string> {
  const orders = await prisma.workOrder.findMany({
    select: { zigId: true },
    orderBy: { dateIssued: "desc" },
    take: 200,
  });
  let max = 0;
  for (const order of orders) {
    const match = order.zigId.match(/^z-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `z-${max + 1}`;
}

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
        fabricVariant: { include: fabricInclude },
        _count: { select: { yarnGiven: true, fabricReturns: true } },
      },
      orderBy: { dateIssued: "desc" },
    });

    res.json(workOrders);
  } catch (error) {
    next(error);
  }
});

workOrdersRouter.get("/next-id", requireAdmin, async (_req, res, next) => {
  try {
    const zigId = await generateNextZigId();
    res.json({ zigId });
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
        fabricVariant: { include: fabricInclude },
        yarnGiven: {
          include: { yarnVariant: { include: { yarnType: true, color: true, supplier: true } } },
        },
        fabricReturns: {
          include: {
            fabricVariant: { include: fabricInclude },
          },
        },
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
    const zigId = body.zigId ?? (await generateNextZigId());

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { productId: body.productId },
      });
      const unitPrice = body.unitPrice ?? Number(product.basePrice);

      const fabricResolved = await resolveFabricVariant(
        {
          productId: body.productId,
          warpColorId: body.warpColorId,
          weftColorId: body.weftColorId,
          designId: body.designId ?? null,
          basePrice: unitPrice,
        },
        tx,
      );

      const workOrder = await tx.workOrder.create({
        data: {
          zigId,
          weaverId: body.weaverId,
          fabricVariantId: fabricResolved.variantId,
          issuedByUserId: req.user!.userId,
        },
        include: {
          weaver: true,
          fabricVariant: { include: fabricInclude },
        },
      });

      const yarnGiven: Array<{
        yarnGivenId: number;
        quantity: unknown;
        unitPrice: unknown;
        yarnVariant: unknown;
      }> = [];
      const yarnResolved: Array<{ created: boolean; sku: string }> = [];

      for (const line of body.yarnLines) {
        const resolved = await resolveTransactionLine("yarn", line, tx);

        const row = await tx.yarnGiven.create({
          data: {
            zigId,
            yarnVariantId: resolved.yarnVariantId!,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            recordedByUserId: req.user!.userId,
          },
          include: {
            yarnVariant: { include: { yarnType: true, color: true, supplier: true } },
          },
        });

        yarnGiven.push(row);
        yarnResolved.push({
          created: resolved.variantCreated,
          sku: resolved.sku ?? "",
        });
      }

      return { workOrder, fabricResolved, yarnResolved, yarnGiven };
    });

    res.status(201).json({
      ...result.workOrder,
      fabricResolved: {
        created: result.fabricResolved.created,
        sku: result.fabricResolved.sku,
      },
      yarnGiven: result.yarnGiven,
      yarnResolved: result.yarnResolved,
    });
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
        fabricVariant: { include: fabricInclude },
      },
    });
    res.json(workOrder);
  } catch (error) {
    next(error);
  }
});