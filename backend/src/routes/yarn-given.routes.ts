import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { resolveTransactionLine } from "../services/transaction-line-resolver.service.js";

export const yarnGivenRouter = Router();

yarnGivenRouter.use(authenticate, requireAdmin);

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
  zigId: z.string(),
  lines: z.array(yarnLineSchema).min(1),
});

const yarnInclude = {
  yarn: true,
  color: true,
  supplier: true,
};

// GET /api/v1/yarn-given
yarnGivenRouter.get("/", async (req, res, next) => {
  try {
    const zigId = req.query.zigId as string | undefined;
    const rows = await prisma.yarnGiven.findMany({
      where: zigId ? { zigId } : undefined,
      include: {
        yarnVariant: { include: yarnInclude },
        workOrder: { include: { weaver: true } },
      },
      orderBy: { dateGiven: "desc" },
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/yarn-given
yarnGivenRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.findUniqueOrThrow({
        where: { zigId: body.zigId },
      });

      if (order.status === "reconciled" || order.status === "cancelled") {
        throw new Error(`CONFLICT: Cannot issue yarn to a ${order.status} zig.`);
      }

      const rows = [];
      const variantResolved = [];

      for (const line of body.lines) {
        const resolved = await resolveTransactionLine("yarn", line, tx);
        const variant = await tx.yarnVariant.findUnique({
          where: { yarnVariantId: resolved.yarnVariantId! },
          include: { yarn: true },
        });
        if (!variant?.isActive || !variant.yarn.isActive) {
          throw new Error("VALIDATION: Inactive yarn catalog items cannot be used.");
        }
        const activePrice = await tx.yarnPrice.findFirst({
          where: {
            yarnId: variant.yarnId,
            supplierId: variant.supplierId,
            isActive: true,
            effectiveFrom: { lte: new Date() },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
          },
        });
        if (!activePrice) {
          throw new Error("VALIDATION: No active yarn price exists for the issue date.");
        }

        const row = await tx.yarnGiven.create({
          data: {
            zigId: body.zigId,
            yarnVariantId: resolved.yarnVariantId!,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            recordedByUserId: req.user!.userId,
          },
          include: {
            yarnVariant: { include: yarnInclude },
            workOrder: true,
          },
        });

        // Decrement yarn stock
        await tx.yarnVariant.update({
          where: { yarnVariantId: resolved.yarnVariantId! },
          data: { stockSnapshot: { decrement: line.quantity } },
        });

        rows.push(row);
        variantResolved.push({
          created: resolved.variantCreated,
          sku: resolved.sku ?? "",
        });
      }

      // Progress work order if still assigned
      if (order.status === "assigned") {
        await tx.workOrder.update({
          where: { zigId: body.zigId },
          data: { status: "in_progress" },
        });
      }

      return { rows, variantResolved };
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

const updateYarnGivenSchema = z.object({
  yarnVariantId: z.number().int().positive().optional(),
  yarnId: z.number().int().positive().optional(),
  yarnTypeId: z.number().int().positive().optional(),
  colorId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
});

// PATCH /api/v1/yarn-given/:id
yarnGivenRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid yarn delivery ID" });
      return;
    }

    const body = updateYarnGivenSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.yarnGiven.findUnique({
        where: { yarnGivenId: id },
        include: { workOrder: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND: Yarn delivery record not found.");
      }

      if (existing.workOrder.status === "reconciled" || existing.workOrder.status === "cancelled") {
        throw new Error(`CONFLICT: Cannot edit yarn delivery for a ${existing.workOrder.status} zig.`);
      }

      let variantId = body.yarnVariantId ?? existing.yarnVariantId;
      if (!body.yarnVariantId && (body.yarnId || body.yarnTypeId || body.colorId || body.supplierId)) {
        const resolved = await resolveTransactionLine(
          "yarn",
          {
            ...body,
            quantity: body.quantity ?? Number(existing.quantity),
            unitPrice: body.unitPrice ?? Number(existing.unitPrice),
          },
          tx,
        );
        variantId = resolved.yarnVariantId!;
      }

      const newQty = body.quantity ?? Number(existing.quantity);

      // Adjust stock snapshots
      if (variantId !== existing.yarnVariantId) {
        await tx.yarnVariant.update({
          where: { yarnVariantId: existing.yarnVariantId },
          data: { stockSnapshot: { increment: existing.quantity } },
        });
        await tx.yarnVariant.update({
          where: { yarnVariantId: variantId },
          data: { stockSnapshot: { decrement: newQty } },
        });
      } else if (newQty !== Number(existing.quantity)) {
        const diff = newQty - Number(existing.quantity);
        await tx.yarnVariant.update({
          where: { yarnVariantId: existing.yarnVariantId },
          data: { stockSnapshot: { decrement: diff } },
        });
      }

      const updated = await tx.yarnGiven.update({
        where: { yarnGivenId: id },
        data: {
          yarnVariantId: variantId,
          quantity: newQty,
          ...(body.unitPrice !== undefined ? { unitPrice: body.unitPrice } : {}),
        },
        include: {
          yarnVariant: { include: yarnInclude },
          workOrder: true,
        },
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/yarn-given/:id
yarnGivenRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid yarn delivery ID" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.yarnGiven.findUnique({
        where: { yarnGivenId: id },
        include: { workOrder: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND: Yarn delivery record not found.");
      }

      if (existing.workOrder.status === "reconciled" || existing.workOrder.status === "cancelled") {
        throw new Error(`CONFLICT: Cannot delete yarn delivery for a ${existing.workOrder.status} zig.`);
      }

      // Revert stock snapshot (increment back)
      await tx.yarnVariant.update({
        where: { yarnVariantId: existing.yarnVariantId },
        data: { stockSnapshot: { increment: existing.quantity } },
      });

      await tx.yarnGiven.delete({ where: { yarnGivenId: id } });
    });

    res.json({ success: true, message: "Yarn delivery record removed." });
  } catch (error) {
    next(error);
  }
});
