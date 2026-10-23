import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { adjustFabricReturnStock } from "../services/stock-adjustment.service.js";
import { resolveFabricVariant } from "../services/variant.service.js";

export const fabricReturnsRouter = Router();

fabricReturnsRouter.use(authenticate, requireAdmin);

const createSchema = z.object({
  zigId: z.string(),
  fabricVariantId: z.number().int().positive().optional(),
  /** Fabric type of the return when described by details; defaults to the zig's own product. */
  productId: z.number().int().positive().optional(),
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
  product: true,
  warpColor: true,
  weftColor: true,
  design: true,
};

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

fabricReturnsRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { zigId: body.zigId },
        include: { fabricVariant: { include: { product: true } } },
      });

      if (!workOrder) {
        throw new Error("NOT_FOUND:Work order not found.");
      }

      let variantId = body.fabricVariantId ?? null;
      let resolved = null as Awaited<ReturnType<typeof resolveFabricVariant>> | null;

      if (variantId) {
        await tx.fabricVariant.findUniqueOrThrow({ where: { fabricVariantId: variantId } });
        resolved = { variantId, created: false, sku: "" };
        const existing = await tx.fabricVariant.findUnique({ where: { fabricVariantId: variantId } });
        if (existing) resolved.sku = existing.sku;
      } else {
        if (!body.warpColorId || !body.weftColorId) {
          throw new Error("VALIDATION:Provide fabric variant or warp/weft colors.");
        }
        const productId = body.productId ?? workOrder.fabricVariant.productId;
        resolved = await resolveFabricVariant(
          {
            productId,
            warpColorId: body.warpColorId,
            weftColorId: body.weftColorId,
            designId: body.designId ?? null,
            basePrice: body.unitPrice,
          },
          tx,
        );
        variantId = resolved.variantId;
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
          remark: body.remark,
          recordedByUserId: req.user!.userId,
        },
        include: {
          fabricVariant: { include: fabricInclude },
          workOrder: { include: { weaver: true } },
        },
      });

      return { row, variantResolved: resolved! };
    });

    res.status(201).json({
      ...result.row,
      variantResolved: {
        created: result.variantResolved.created,
        sku: result.variantResolved.sku,
      },
    });
  } catch (error) {
    next(error);
  }
});

const updateSchema = createSchema.omit({ zigId: true });

fabricReturnsRouter.patch("/:returnId", async (req, res, next) => {
  try {
    const returnId = Number(req.params.returnId);
    if (!Number.isInteger(returnId) || returnId <= 0) {
      res.status(400).json({ error: "Invalid return id." });
      return;
    }

    const body = updateSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.fabricReturn.findUnique({
        where: { returnId },
        include: { workOrder: { include: { fabricVariant: { include: { product: true } } } } },
      });

      if (!existing) {
        throw new Error("NOT_FOUND:Fabric return not found.");
      }
      if (existing.paymentId != null) {
        throw new Error("FORBIDDEN:This fabric return is already settled and cannot be edited.");
      }

      let variantId = body.fabricVariantId ?? null;
      let resolved = null as Awaited<ReturnType<typeof resolveFabricVariant>> | null;

      if (variantId) {
        const variant = await tx.fabricVariant.findUnique({ where: { fabricVariantId: variantId } });
        if (!variant) {
          throw new Error("NOT_FOUND:Fabric variant not found.");
        }
        resolved = { variantId, created: false, sku: variant.sku };
      } else {
        if (!body.warpColorId || !body.weftColorId) {
          throw new Error("VALIDATION:Provide fabric variant or warp/weft colors.");
        }
        const productId = body.productId ?? existing.workOrder.fabricVariant.productId;
        resolved = await resolveFabricVariant(
          {
            productId,
            warpColorId: body.warpColorId,
            weftColorId: body.weftColorId,
            designId: body.designId ?? null,
            basePrice: body.unitPrice,
          },
          tx,
        );
        variantId = resolved.variantId;
      }

      await adjustFabricReturnStock(
        tx,
        existing.fabricVariantId,
        existing.quantityReturned,
        variantId,
        body.quantityReturned,
      );

      const row = await tx.fabricReturn.update({
        where: { returnId },
        data: {
          fabricVariantId: variantId,
          quantityReturned: body.quantityReturned,
          totalWeight: body.totalWeight,
          unitPrice: body.unitPrice,
          lengthCm: body.lengthCm,
          widthCm: body.widthCm,
          remark: body.remark,
        },
        include: {
          fabricVariant: { include: fabricInclude },
          workOrder: { include: { weaver: true } },
        },
      });

      return { row, variantResolved: resolved! };
    });

    res.json({
      ...result.row,
      variantResolved: {
        created: result.variantResolved.created,
        sku: result.variantResolved.sku,
      },
    });
  } catch (error) {
    next(error);
  }
});