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
