import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { resolveFabricVariant } from "../services/variant.service.js";

export const fabricReturnsRouter = Router();

fabricReturnsRouter.use(authenticate, requireAdmin);

const createSchema = z.object({
  zigId: z.string(),
  fabricVariantId: z.number().int().positive().optional(),
  fabricId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(), // alias
  warpColorId: z.number().int().positive().optional(),
  weftColorId: z.number().int().positive().optional(),
  designId: z.number().int().positive().optional().nullable(),
  quantityReturned: z.number().int().positive(),
  totalWeight: z.number().positive(),
  unitPrice: z.number().positive(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  remark: z.string().max(500).optional(),
});

const fabricInclude = {
  fabric: true,
  warpColor: true,
  weftColor: true,
  design: true,
};

// GET /api/v1/fabric-returns
fabricReturnsRouter.get("/", async (req, res, next) => {
  try {
    const zigId = req.query.zigId as string | undefined;
    const unsettled = req.query.unsettled === "true";

    const rows = await prisma.fabricReturn.findMany({
      where: {
        ...(zigId ? { zigId } : {}),
        ...(unsettled ? { settlementLineReturns: { none: {} } } : {}),
      },
      include: {
        fabricVariant: { include: fabricInclude },
        workOrder: { include: { weaver: true } },
      },
      orderBy: { dateReturned: "desc" },
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/fabric-returns
fabricReturnsRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUniqueOrThrow({
        where: { zigId: body.zigId },
        include: { fabricVariant: { include: { fabric: true } } },
      });

      if (workOrder.status === "reconciled" || workOrder.status === "cancelled") {
        throw new Error(`CONFLICT: Cannot record fabric return for a ${workOrder.status} zig.`);
      }

      let variantId = body.fabricVariantId;
      if (!variantId) {
        const fabricId = body.fabricId ?? body.productId ?? workOrder.fabricVariant.fabricId;
        if (!body.warpColorId || !body.weftColorId) {
          throw new Error("VALIDATION: Provide fabric variant or warp and weft colors.");
        }
        const resolved = await resolveFabricVariant(
          {
            fabricId,
            warpColorId: body.warpColorId,
            weftColorId: body.weftColorId,
            designId: body.designId ?? workOrder.fabricVariant.designId,
          },
          tx,
        );
        variantId = resolved.variantId;
      }

      // Record production fact
      const variant = await tx.fabricVariant.findUnique({
        where: { fabricVariantId: variantId },
        include: { fabric: true },
      });
      if (!variant?.isActive || !variant.fabric.isActive) {
        throw new Error("VALIDATION: Inactive fabric catalog items cannot be used.");
      }
      const activePrice = await tx.fabricPrice.findFirst({
        where: {
          fabricId: variant.fabricId,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
        },
      });
      if (!activePrice) {
        throw new Error("VALIDATION: No active fabric price exists for the return date.");
      }
      const row = await tx.fabricReturn.create({
        data: {
          zigId: body.zigId,
          fabricVariantId: variantId,
          quantityReturned: body.quantityReturned,
          totalWeight: body.totalWeight,
          unitPrice: body.unitPrice,
          lengthCm: body.lengthCm,
          widthCm: body.widthCm,
          recordedByUserId: req.user!.userId,
          remark: body.remark,
        },
        include: {
          fabricVariant: { include: fabricInclude },
          workOrder: { include: { weaver: true } },
        },
      });

      // Increment fabric stock
      await tx.fabricVariant.update({
        where: { fabricVariantId: variantId },
        data: { stockSnapshot: { increment: body.quantityReturned } },
      });

      // Advance work order status from assigned to in_progress if needed
      if (workOrder.status === "assigned") {
        await tx.workOrder.update({
          where: { zigId: body.zigId },
          data: { status: "in_progress" },
        });
      }

      return row;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

const updateSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  fabricId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  warpColorId: z.number().int().positive().optional(),
  weftColorId: z.number().int().positive().optional(),
  designId: z.number().int().positive().optional().nullable(),
  quantityReturned: z.number().int().positive().optional(),
  totalWeight: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  lengthCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
});

// PATCH /api/v1/fabric-returns/:id
fabricReturnsRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid fabric return ID" });
      return;
    }

    const body = updateSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.fabricReturn.findUnique({
        where: { returnId: id },
        include: { workOrder: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND: Fabric return not found.");
      }

      if (existing.workOrder.status === "reconciled" || existing.workOrder.status === "cancelled") {
        throw new Error(`CONFLICT: Cannot edit fabric return for a ${existing.workOrder.status} zig.`);
      }

      let variantId = body.fabricVariantId ?? existing.fabricVariantId;
      if (!body.fabricVariantId && (body.fabricId || body.productId || body.warpColorId || body.weftColorId)) {
        const fabricId = body.fabricId ?? body.productId;
        if (fabricId && body.warpColorId && body.weftColorId) {
          const resolved = await resolveFabricVariant(
            {
              fabricId,
              warpColorId: body.warpColorId,
              weftColorId: body.weftColorId,
              designId: body.designId,
            },
            tx,
          );
          variantId = resolved.variantId;
        }
      }

      const newQty = body.quantityReturned ?? existing.quantityReturned;

      // Adjust stock snapshot if variant or quantity changed
      if (variantId !== existing.fabricVariantId) {
        await tx.fabricVariant.update({
          where: { fabricVariantId: existing.fabricVariantId },
          data: { stockSnapshot: { decrement: existing.quantityReturned } },
        });
        await tx.fabricVariant.update({
          where: { fabricVariantId: variantId },
          data: { stockSnapshot: { increment: newQty } },
        });
      } else if (newQty !== existing.quantityReturned) {
        const diff = newQty - existing.quantityReturned;
        await tx.fabricVariant.update({
          where: { fabricVariantId: existing.fabricVariantId },
          data: { stockSnapshot: { increment: diff } },
        });
      }

      const updated = await tx.fabricReturn.update({
        where: { returnId: id },
        data: {
          fabricVariantId: variantId,
          quantityReturned: newQty,
          ...(body.totalWeight !== undefined ? { totalWeight: body.totalWeight } : {}),
          ...(body.unitPrice !== undefined ? { unitPrice: body.unitPrice } : {}),
          ...(body.lengthCm !== undefined ? { lengthCm: body.lengthCm } : {}),
          ...(body.widthCm !== undefined ? { widthCm: body.widthCm } : {}),
          ...(body.remark !== undefined ? { remark: body.remark } : {}),
        },
        include: {
          fabricVariant: { include: fabricInclude },
          workOrder: { include: { weaver: true } },
        },
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/fabric-returns/:id
fabricReturnsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid fabric return ID" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.fabricReturn.findUnique({
        where: { returnId: id },
        include: { workOrder: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND: Fabric return not found.");
      }

      if (existing.workOrder.status === "reconciled" || existing.workOrder.status === "cancelled") {
        throw new Error(`CONFLICT: Cannot delete fabric return for a ${existing.workOrder.status} zig.`);
      }

      // Revert stock snapshot
      await tx.fabricVariant.update({
        where: { fabricVariantId: existing.fabricVariantId },
        data: { stockSnapshot: { decrement: existing.quantityReturned } },
      });

      await tx.fabricReturn.delete({ where: { returnId: id } });
    });

    res.json({ success: true, message: "Fabric return removed." });
  } catch (error) {
    next(error);
  }
});
