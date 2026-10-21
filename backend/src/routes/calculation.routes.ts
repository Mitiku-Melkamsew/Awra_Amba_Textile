import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  buildSettlementPreview,
  calculateBonus,
  calculateDeduction,
} from "../services/calculation.service.js";
import {
  commitSettlementPreview,
  createSettlementPreview,
  snapshotToCsv,
} from "../services/settlement-preview.service.js";
import { commitSettlement } from "../services/settlement.service.js";
import { numberToAmharicWords } from "../utils/amharic-words.js";

export const calculationRouter = Router();

const deductionSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  avgWeight: z.number(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  minWeightThreshold: z.number().optional(),
  deductionRatePerUnit: z.number().optional(),
});

const bonusSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  avgWeight: z.number(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  minWeightThreshold: z.number().optional(),
  bonusRatePerUnit: z.number().optional(),
  maxBonusPerPiece: z.number().nullable().optional(),
});

const previewSchema = z.object({
  weaverId: z.number().int().positive(),
  returnIds: z.array(z.number().int().positive()).default([]),
  yarnGivenIds: z.array(z.number().int().positive()).default([]),
  saleIds: z.array(z.number().int().positive()).default([]),
});

const commitSchema = previewSchema.extend({
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
  overrides: z
    .array(
      z.object({
        returnId: z.number().int().positive(),
        calculatedDeduction: z.number().optional(),
        bonusAmount: z.number().optional(),
        remark: z.string().optional(),
      }),
    )
    .optional(),
});

calculationRouter.post("/deduction", async (req, res, next) => {
  try {
    const body = deductionSchema.parse(req.body);

    let threshold = body.minWeightThreshold;
    let rate = body.deductionRatePerUnit;

    if (body.fabricVariantId) {
      const rule = await prisma.qualityRule.findUnique({
        where: { fabricVariantId: body.fabricVariantId },
      });
      if (rule) {
        threshold = Number(rule.minWeightThreshold);
        rate = Number(rule.deductionRatePerUnit);
      }
    }

    const result = calculateDeduction({
      avgWeight: body.avgWeight,
      unitPrice: body.unitPrice,
      quantity: body.quantity,
      minWeightThreshold: threshold ?? 0,
      deductionRatePerUnit: rate,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

calculationRouter.post("/bonus", async (req, res, next) => {
  try {
    const body = bonusSchema.parse(req.body);

    let threshold = body.minWeightThreshold;
    let rate = body.bonusRatePerUnit;
    let maxBonus = body.maxBonusPerPiece;

    if (body.fabricVariantId) {
      const rule = await prisma.bonusRule.findUnique({
        where: { fabricVariantId: body.fabricVariantId },
      });
      if (rule) {
        threshold = Number(rule.minWeightThreshold);
        rate = Number(rule.bonusRatePerUnit);
        maxBonus = rule.maxBonusPerPiece ? Number(rule.maxBonusPerPiece) : null;
      }
    }

    const result = calculateBonus({
      avgWeight: body.avgWeight,
      unitPrice: body.unitPrice,
      quantity: body.quantity,
      minWeightThreshold: threshold ?? 0,
      bonusRatePerUnit: rate,
      maxBonusPerPiece: maxBonus,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

const batchPreviewSchema = z.object({
  cutoffDate: z.string().optional(),
});

function parseCutoff(str?: string): Date | null {
  if (!str || !str.trim()) return null;
  // Handle DD/MM/YYYY or YYYY-MM-DD
  const parts = str.trim().split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return isNaN(d.getTime()) ? null : d;
    } else {
      // DD/MM/YYYY
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      return isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(str.trim());
  return isNaN(d.getTime()) ? null : d;
}

calculationRouter.post(
  "/settlements/batch-preview",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const body = batchPreviewSchema.parse(req.body ?? {});
      const cutoffDate = parseCutoff(body.cutoffDate);
      const result = await createSettlementPreview(req.user!.userId, cutoffDate);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

calculationRouter.get(
  "/settlements/preview/:previewId",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const previewId = String(req.params.previewId);
      const row = await prisma.settlementPreview.findUnique({ where: { previewId } });
      if (!row) {
        res.status(404).json({ error: "Preview not found" });
        return;
      }
      res.json({
        previewId: row.previewId,
        status: row.status,
        committedAt: row.committedAt,
        ...(row.snapshot as object),
      });
    } catch (error) {
      next(error);
    }
  },
);

calculationRouter.get(
  "/settlements/preview/:previewId/export",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const previewId = String(req.params.previewId);
      const format = (req.query.format as string | undefined) ?? "csv";
      const row = await prisma.settlementPreview.findUnique({ where: { previewId } });
      if (!row) {
        res.status(404).json({ error: "Preview not found" });
        return;
      }
      const snapshot = row.snapshot as unknown as Parameters<typeof snapshotToCsv>[0];
      if (format === "csv") {
        const csv = snapshotToCsv(snapshot);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="settlement-preview-${previewId}.csv"`,
        );
        res.send(csv);
        return;
      }
      res.status(400).json({ error: "Unsupported format. Use csv or open print view." });
    } catch (error) {
      next(error);
    }
  },
);

const batchCommitSchema = z.object({
  previewId: z.string().regex(/^prev-[\w-]+$/),
  paymentMethod: z.string().max(30).optional(),
  cutoffDate: z.string().optional(),
});

calculationRouter.post(
  "/settlements/batch-commit",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const body = batchCommitSchema.parse(req.body);
      const cutoffDate = parseCutoff(body.cutoffDate);
      const result = await commitSettlementPreview(
        body.previewId,
        req.user!.userId,
        body.paymentMethod ?? "Recorded",
        cutoffDate,
      );
      res.status(201).json({
        ...result,
        amharicAmountInWords: numberToAmharicWords(Math.round(result.grandTotal)),
      });
    } catch (error) {
      next(error);
    }
  },
);

calculationRouter.post("/settlements/preview", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = previewSchema.parse(req.body);

    const returns = await prisma.fabricReturn.findMany({
      where: {
        returnId: { in: body.returnIds },
        paymentId: null,
        workOrder: { weaverId: body.weaverId },
      },
      include: {
        fabricVariant: {
          include: { qualityRule: true, bonusRule: true },
        },
      },
    });

    const yarnGiven = await prisma.yarnGiven.findMany({
      where: {
        yarnGivenId: { in: body.yarnGivenIds },
        paymentId: null,
        workOrder: { weaverId: body.weaverId },
      },
    });

    const sales = await prisma.sale.findMany({
      where: {
        saleId: { in: body.saleIds },
        paymentId: null,
        weaverId: body.weaverId,
      },
    });

    const preview = buildSettlementPreview({
      returns: returns.map((row) => ({
        returnId: row.returnId,
        zigId: row.zigId,
        fabricVariantId: row.fabricVariantId,
        quantityReturned: row.quantityReturned,
        totalWeight: Number(row.totalWeight),
        unitPrice: Number(row.unitPrice),
        qualityRule: row.fabricVariant.qualityRule
          ? {
              minWeightThreshold: Number(row.fabricVariant.qualityRule.minWeightThreshold),
              deductionRatePerUnit: Number(row.fabricVariant.qualityRule.deductionRatePerUnit),
            }
          : null,
        bonusRule: row.fabricVariant.bonusRule
          ? {
              minWeightThreshold: Number(row.fabricVariant.bonusRule.minWeightThreshold),
              bonusRatePerUnit: Number(row.fabricVariant.bonusRule.bonusRatePerUnit),
              maxBonusPerPiece: row.fabricVariant.bonusRule.maxBonusPerPiece
                ? Number(row.fabricVariant.bonusRule.maxBonusPerPiece)
                : null,
            }
          : null,
      })),
      yarnGiven: yarnGiven.map((row) => ({
        yarnGivenId: row.yarnGivenId,
        zigId: row.zigId,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      })),
      sales: sales.map((row) => ({
        saleId: row.saleId,
        movementType: row.movementType,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      })),
    });

    res.json({
      ...preview,
      amharicAmountInWords: numberToAmharicWords(Math.round(preview.netSettlement)),
    });
  } catch (error) {
    next(error);
  }
});

calculationRouter.post("/settlements/commit", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = commitSchema.parse(req.body);
    const result = await commitSettlement({
      weaverId: body.weaverId,
      returnIds: body.returnIds,
      yarnGivenIds: body.yarnGivenIds,
      saleIds: body.saleIds,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      recordedByUserId: req.user!.userId,
      overrides: body.overrides,
    });

    res.status(201).json({
      paymentId: result.paymentId,
      amount: result.amount,
      reconciledZigIds: result.reconciledZigIds,
      amharicAmountInWords: numberToAmharicWords(Math.round(result.amount)),
    });
  } catch (error) {
    next(error);
  }
});