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
  batchCommitSettlements,
  discoverReturnedSettlementBundles,
} from "../services/batch-settlement.service.js";
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

calculationRouter.get(
  "/settlements/batch-preview",
  authenticate,
  requireAdmin,
  async (_req, res, next) => {
    try {
      const bundles = await discoverReturnedSettlementBundles();
      const grandTotal = bundles.reduce((sum, b) => sum + b.preview.netSettlement, 0);
      res.json({
        weavers: bundles.map((b) => ({
          weaverId: b.weaverId,
          weaverName: b.weaverName,
          zigIds: b.zigIds,
          returnCount: b.returnIds.length,
          yarnCount: b.yarnGivenIds.length,
          netSettlement: b.preview.netSettlement,
          lineItems: b.preview.lineItems,
          yarnDebits: b.preview.yarnDebits,
        })),
        weaverCount: bundles.length,
        grandTotal,
        amharicAmountInWords: numberToAmharicWords(Math.round(grandTotal)),
      });
    } catch (error) {
      next(error);
    }
  },
);

calculationRouter.post(
  "/settlements/batch-commit",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const paymentMethod = (req.body?.paymentMethod as string | undefined) ?? "Recorded";
      const result = await batchCommitSettlements(req.user!.userId, paymentMethod);
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