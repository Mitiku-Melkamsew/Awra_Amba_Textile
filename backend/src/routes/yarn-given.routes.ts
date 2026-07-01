import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { adjustYarnGivenStock } from "../services/stock-adjustment.service.js";
import { resolveTransactionLine } from "../services/transaction-line-resolver.service.js";

export const yarnGivenRouter = Router();

yarnGivenRouter.use(authenticate, requireAdmin);

const yarnLineSchema = z.object({
  yarnVariantId: z.number().int().positive().optional(),
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
  yarnType: true,
  color: true,
  supplier: true,
};

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

yarnGivenRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const rows = [];
      const variantResolved = [];

      for (const line of body.lines) {
        const resolved = await resolveTransactionLine("yarn", line, tx);

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

        rows.push(row);
        variantResolved.push({
          created: resolved.variantCreated,
          sku: resolved.sku ?? "",
        });
      }

      return { rows, variantResolved };
    });

    res.status(201).json({
      rows: result.rows,
      variantResolved: result.variantResolved,
    });
  } catch (error) {
    next(error);
  }
});

yarnGivenRouter.patch("/:yarnGivenId", async (req, res, next) => {
  try {
    const yarnGivenId = Number(req.params.yarnGivenId);
    if (!Number.isInteger(yarnGivenId) || yarnGivenId <= 0) {
      res.status(400).json({ error: "Invalid yarn delivery id." });
      return;
    }

    const body = yarnLineSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.yarnGiven.findUnique({ where: { yarnGivenId } });
      if (!existing) {
        throw new Error("NOT_FOUND:Yarn delivery not found.");
      }
      if (existing.paymentId != null) {
        throw new Error("FORBIDDEN:This yarn delivery is already settled and cannot be edited.");
      }

      const resolved = await resolveTransactionLine("yarn", body, tx);

      await adjustYarnGivenStock(
        tx,
        existing.yarnVariantId,
        existing.quantity,
        resolved.yarnVariantId!,
        body.quantity,
      );

      const row = await tx.yarnGiven.update({
        where: { yarnGivenId },
        data: {
          yarnVariantId: resolved.yarnVariantId!,
          quantity: body.quantity,
          unitPrice: body.unitPrice,
        },
        include: {
          yarnVariant: { include: yarnInclude },
          workOrder: { include: { weaver: true } },
        },
      });

      return {
        row,
        variantResolved: { created: resolved.variantCreated, sku: resolved.sku ?? "" },
      };
    });

    res.json({
      ...result.row,
      variantResolved: result.variantResolved,
    });
  } catch (error) {
    next(error);
  }
});