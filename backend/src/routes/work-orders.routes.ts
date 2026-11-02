import { WorkOrderStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { resolveFabricVariant } from "../services/variant.service.js";

export const workOrdersRouter = Router();

workOrdersRouter.use(authenticate);

const fabricInclude = {
  fabric: true,
  warpColor: true,
  weftColor: true,
  design: true,
};

const yarnLineSchema = z.object({
  yarnVariantId: z.number().int().positive().optional(),
  yarnId: z.number().int().positive().optional(),
  yarnTypeId: z.number().int().positive().optional(),
  colorId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
});

const createSchema = z.object({
  zigId: z.string().regex(/^z-[\w-]+$/).optional(),
  weaverUserId: z.number().int().positive().optional(),
  weaverId: z.number().int().positive().optional(), // alias
  fabricVariantId: z.number().int().positive().optional(),
  fabricId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(), // alias
  warpColorId: z.number().int().positive().optional(),
  weftColorId: z.number().int().positive().optional(),
  designId: z.number().int().positive().optional().nullable(),
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

// GET /api/v1/work-orders
workOrdersRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as WorkOrderStatus | undefined;
    const isWeaver = req.user?.roles?.includes("weaver") && !req.user?.roles?.includes("admin");
    const weaverUserId = isWeaver ? req.user?.userId : undefined;
    const filterUserId = req.query.weaverUserId
      ? Number(req.query.weaverUserId)
      : req.query.weaverId
        ? Number(req.query.weaverId)
        : weaverUserId ?? undefined;

    const workOrders = await prisma.workOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(filterUserId ? { weaverUserId: filterUserId } : {}),
      },
      include: {
        weaver: { select: { userId: true, fullName: true, username: true, phone: true } },
        fabricVariant: { include: fabricInclude },
        _count: { select: { yarnGiven: true, fabricReturns: true } },
      },
      orderBy: { dateIssued: "desc" },
    });

    res.json(
      workOrders.map((wo) => ({
        ...wo,
        weaverId: wo.weaverUserId, // alias
      })),
    );
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

// GET /api/v1/work-orders/:zigId
workOrdersRouter.get("/:zigId", async (req, res, next) => {
  try {
    const zigId = String(req.params.zigId);
    const workOrder = await prisma.workOrder.findUnique({
      where: { zigId },
      include: {
        weaver: { select: { userId: true, fullName: true, username: true, phone: true } },
        fabricVariant: { include: fabricInclude },
        yarnGiven: {
          include: { yarnVariant: { include: { yarn: true, color: true, supplier: true } } },
        },
        yarnReturns: {
          include: { yarnVariant: { include: { yarn: true, color: true, supplier: true } } },
        },
        fabricReturns: {
          include: {
            fabricVariant: { include: fabricInclude },
          },
        },
        fabricReturnsToWeaver: {
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

    const isWeaver = req.user?.roles?.includes("weaver") && !req.user?.roles?.includes("admin");
    if (isWeaver && req.user?.userId !== workOrder.weaverUserId) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    res.json({
      ...workOrder,
      weaverId: workOrder.weaverUserId,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/work-orders
workOrdersRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const weaverUserId = body.weaverUserId ?? body.weaverId;
    if (!weaverUserId) {
      throw new Error("VALIDATION: weaverUserId (or weaverId) is required.");
    }

    const zigId = body.zigId ?? (await generateNextZigId());

    const result = await prisma.$transaction(async (tx) => {
      let fabricVariantId = body.fabricVariantId;
      if (!fabricVariantId) {
        const fabricId = body.fabricId ?? body.productId;
        if (!fabricId || !body.warpColorId || !body.weftColorId) {
          throw new Error("VALIDATION: Provide fabricVariantId or fabricId, warpColorId, and weftColorId.");
        }
        const resolved = await resolveFabricVariant(
          {
            fabricId,
            warpColorId: body.warpColorId,
            weftColorId: body.weftColorId,
            designId: body.designId ?? null,
          },
          tx,
        );
        fabricVariantId = resolved.variantId;
      }

      const order = await tx.workOrder.create({
        data: {
          zigId,
          weaverUserId,
          fabricVariantId,
          status: body.yarnLines.length > 0 ? WorkOrderStatus.in_progress : WorkOrderStatus.assigned,
          issuedByUserId: req.user!.userId,
        },
        include: {
          weaver: { select: { userId: true, fullName: true, username: true } },
          fabricVariant: { include: fabricInclude },
        },
      });

      // Issue initial yarn lines if provided
      for (const line of body.yarnLines) {
        let yarnVariantId = line.yarnVariantId;
        if (!yarnVariantId) {
          const yarnId = line.yarnId ?? line.yarnTypeId;
          if (!yarnId || !line.colorId || !line.supplierId) {
            throw new Error("VALIDATION: Yarn line requires variant or yarn, color, and supplier.");
          }
          const existingVariant = await tx.yarnVariant.findFirst({
            where: { yarnId, colorId: line.colorId, supplierId: line.supplierId },
          });
          if (existingVariant) {
            yarnVariantId = existingVariant.yarnVariantId;
          } else {
            const createdVar = await tx.yarnVariant.create({
              data: {
                yarnId,
                colorId: line.colorId,
                supplierId: line.supplierId,
                sku: `YV-${yarnId}-${line.supplierId}-${line.colorId}-${Date.now().toString(36)}`,
              },
            });
            yarnVariantId = createdVar.yarnVariantId;
          }
        }

        await tx.yarnGiven.create({
          data: {
            zigId: order.zigId,
            yarnVariantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            recordedByUserId: req.user!.userId,
          },
        });

        // Deduct yarn stock
        await tx.yarnVariant.update({
          where: { yarnVariantId },
          data: { stockSnapshot: { decrement: line.quantity } },
        });
      }

      return order;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/work-orders/:zigId/mark-returned
workOrdersRouter.post("/:zigId/mark-returned", requireAdmin, async (req, res, next) => {
  try {
    const zigId = String(req.params.zigId);
    const order = await prisma.workOrder.findUniqueOrThrow({ where: { zigId } });

    if (order.status === "reconciled") {
      throw new Error("CONFLICT: Cannot mark a reconciled zig as returned.");
    }
    if (order.status === "cancelled") {
      throw new Error("CONFLICT: Cannot mark a cancelled zig as returned.");
    }

    const updated = await prisma.workOrder.update({
      where: { zigId },
      data: { status: WorkOrderStatus.returned },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/work-orders/:zigId/cancel
workOrdersRouter.post("/:zigId/cancel", requireAdmin, async (req, res, next) => {
  try {
    const zigId = String(req.params.zigId);
    const order = await prisma.workOrder.findUniqueOrThrow({ where: { zigId } });

    if (order.status === "reconciled") {
      throw new Error("CONFLICT: Cannot cancel a reconciled zig.");
    }

    const updated = await prisma.workOrder.update({
      where: { zigId },
      data: { status: WorkOrderStatus.cancelled },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/work-orders/yarn-returns
const yarnReturnSchema = z.object({
  zigId: z.string(),
  yarnVariantId: z.number().int().positive(),
  quantity: z.number().positive(),
  remark: z.string().optional(),
});

workOrdersRouter.post("/yarn-returns", requireAdmin, async (req, res, next) => {
  try {
    const body = yarnReturnSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.findUniqueOrThrow({ where: { zigId: body.zigId } });
      if (order.status === "reconciled") {
        throw new Error("CONFLICT: Cannot return yarn for a reconciled zig.");
      }

      // Check total issued yarn for this zig & variant
      const yarnGivenTotal = await tx.yarnGiven.aggregate({
        where: { zigId: body.zigId, yarnVariantId: body.yarnVariantId },
        _sum: { quantity: true },
      });
      const issuedQty = Number(yarnGivenTotal._sum.quantity ?? 0);

      // Check total already returned
      const prevReturns = await tx.yarnReturn.aggregate({
        where: { zigId: body.zigId, yarnVariantId: body.yarnVariantId },
        _sum: { quantity: true },
      });
      const prevReturnedQty = Number(prevReturns._sum.quantity ?? 0);

      if (prevReturnedQty + body.quantity > issuedQty) {
        throw new Error(
          `VALIDATION: Total returned yarn (${prevReturnedQty + body.quantity}) cannot exceed issued quantity (${issuedQty}).`,
        );
      }

      const yarnReturn = await tx.yarnReturn.create({
        data: {
          zigId: body.zigId,
          yarnVariantId: body.yarnVariantId,
          quantity: body.quantity,
          recordedByUserId: req.user!.userId,
          remark: body.remark,
        },
      });

      // Increase yarn stock
      await tx.yarnVariant.update({
        where: { yarnVariantId: body.yarnVariantId },
        data: { stockSnapshot: { increment: body.quantity } },
      });

      return yarnReturn;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/work-orders/fabric-returns-to-weavers
const fabricReturnToWeaverSchema = z.object({
  zigId: z.string(),
  fabricVariantId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  remark: z.string().optional(),
});

workOrdersRouter.post("/fabric-returns-to-weavers", requireAdmin, async (req, res, next) => {
  try {
    const body = fabricReturnToWeaverSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.findUniqueOrThrow({ where: { zigId: body.zigId } });
      if (order.status === "reconciled") {
        throw new Error("CONFLICT: Cannot return fabric to weaver for a reconciled zig.");
      }

      const returnToWeaver = await tx.fabricReturnToWeaver.create({
        data: {
          zigId: body.zigId,
          fabricVariantId: body.fabricVariantId,
          quantity: body.quantity,
          recordedByUserId: req.user!.userId,
          remark: body.remark,
        },
      });

      // Reduce fabric stock
      await tx.fabricVariant.update({
        where: { fabricVariantId: body.fabricVariantId },
        data: { stockSnapshot: { decrement: body.quantity } },
      });

      return returnToWeaver;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
