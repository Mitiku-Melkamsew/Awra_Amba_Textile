import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { resolveFabricVariant } from "../services/variant.service.js";

export const fabricReturnsRouter = Router();

fabricReturnsRouter.use(authenticate, requireAdmin);

const createSchema = z.object({
  zigId: z.string(),
  warpColorId: z.number().int().positive(),
  weftColorId: z.number().int().positive(),
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

      const productId = workOrder.fabricVariant.productId;
      const resolved = await resolveFabricVariant(
        {
          productId,
          warpColorId: body.warpColorId,
          weftColorId: body.weftColorId,
          designId: body.designId ?? null,
          basePrice: body.unitPrice,
        },
        tx,
      );

      const row = await tx.fabricReturn.create({
        data: {
          zigId: body.zigId,
          fabricVariantId: resolved.variantId,
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

      return { row, variantResolved: resolved };
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