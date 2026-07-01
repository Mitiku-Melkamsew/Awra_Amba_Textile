import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
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