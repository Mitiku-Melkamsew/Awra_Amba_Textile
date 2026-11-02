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
  commitBatchSettlementPreview,
  createSettlementPreview,
  listCommittedSettlements,
  snapshotToCsv,
  withGroupedReturns,
} from "../services/settlement-preview.service.js";
import { commitSettlement } from "../services/settlement.service.js";
import { numberToAmharicWords } from "../utils/amharic-words.js";

export const calculationRouter = Router();

const deductionSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  fabricId: z.number().int().positive().optional(),
  avgWeight: z.number(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  minWeightThreshold: z.number().optional(),
});

const previewSchema = z.object({
  weaverUserId: z.number().int().positive().optional(),
  weaverId: z.number().int().positive().optional(), // alias
  returnIds: z.array(z.number().int().positive()).default([]),
  yarnGivenIds: z.array(z.number().int().positive()).default([]),
});

const commitSchema = previewSchema.extend({
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
  overrides: z
    .array(
      z.object({
        returnId: z.number().int().positive(),
        calculatedDeduction: z.number().optional(),
        remark: z.string().optional(),
      }),
    )
    .optional(),
});

calculationRouter.post("/deduction", async (req, res, next) => {
  try {
    const body = deductionSchema.parse(req.body);

    let threshold = body.minWeightThreshold;
    if (!threshold) {
      if (body.fabricId) {
        const fabric = await prisma.fabric.findUnique({ where: { fabricId: body.fabricId } });
        if (fabric) threshold = Number(fabric.standardWeightG);
      } else if (body.fabricVariantId) {
        const variant = await prisma.fabricVariant.findUnique({
          where: { fabricVariantId: body.fabricVariantId },
          include: { fabric: true },
        });
        if (variant) threshold = Number(variant.fabric.standardWeightG);
      }
    }

    const weightRule = await prisma.qualityRule.findFirst({
      where: { factor: "weight", isActive: true },
    });
    const rate = weightRule ? Number(weightRule.deductionPerUnit) : 10;

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

// Legacy bonus endpoint - always returns disabled
calculationRouter.post("/bonus", async (_req, res, next) => {
  try {
    res.json(calculateBonus());
  } catch (error) {
    next(error);
  }
});

const batchPreviewSchema = z.object({
  cutoffDate: z.string().optional(),
});

function parseCutoff(str?: string): Date | null {
  if (!str || !str.trim()) return null;
  const parts = str.trim().split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return isNaN(d.getTime()) ? null : d;
    } else {
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
  "/settlements/history",
  authenticate,
  requireAdmin,
  async (_req, res, next) => {
    try {
      res.json(await listCommittedSettlements());
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
      const body = z
        .object({
          paymentMethod: z.string().max(30).optional(),
          cutoffDate: z.string().optional(),
        })
        .parse(req.body ?? {});

      const cutoffDate = parseCutoff(body.cutoffDate);
      const results = await commitBatchSettlementPreview({
        recordedByUserId: req.user!.userId,
        paymentMethod: body.paymentMethod ?? "Recorded",
        cutoffDate,
      });

      const grandTotal = results.reduce((sum, r) => sum + r.amount, 0);

      res.status(201).json({
        settlementCount: results.length,
        results,
        grandTotal,
        amharicAmountInWords: numberToAmharicWords(Math.round(grandTotal)),
      });
    } catch (error) {
      next(error);
    }
  },
);

calculationRouter.post("/settlements/preview", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = previewSchema.parse(req.body);
    const weaverUserId = body.weaverUserId ?? body.weaverId;
    if (!weaverUserId) {
      throw new Error("VALIDATION: weaverUserId (or weaverId) is required.");
    }

    const returns = await prisma.fabricReturn.findMany({
      where: {
        returnId: { in: body.returnIds },
        settlementLineReturns: { none: {} },
        workOrder: { weaverUserId },
      },
      include: {
        fabricVariant: {
          include: { fabric: true },
        },
      },
    });

    const yarnGiven = await prisma.yarnGiven.findMany({
      where: {
        yarnGivenId: { in: body.yarnGivenIds },
        workOrder: { weaverUserId },
      },
    });

    const zigIds = [...new Set(returns.map((r) => r.zigId))];
    const yarnReturns = await prisma.yarnReturn.findMany({
      where: { zigId: { in: zigIds } },
    });

    const weightRule = await prisma.qualityRule.findFirst({
      where: { factor: "weight", isActive: true },
    });
    const rate = weightRule ? Number(weightRule.deductionPerUnit) : 10;

    const preview = buildSettlementPreview({
      returns: returns.map((row) => ({
        returnId: row.returnId,
        zigId: row.zigId,
        fabricId: row.fabricVariant.fabricId,
        fabricName: row.fabricVariant.fabric.name,
        fabricVariantId: row.fabricVariantId,
        quantityReturned: row.quantityReturned,
        totalWeight: Number(row.totalWeight),
        unitPrice: Number(row.unitPrice),
        standardWeightG: Number(row.fabricVariant.fabric.standardWeightG),
        qualityRule: {
          minWeightThreshold: Number(row.fabricVariant.fabric.standardWeightG),
          deductionRatePerUnit: rate,
        },
      })),
      yarnGiven: yarnGiven.map((row) => ({
        yarnGivenId: row.yarnGivenId,
        zigId: row.zigId,
        yarnVariantId: row.yarnVariantId,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      })),
      yarnReturns: yarnReturns.map((yr) => ({
        yarnVariantId: yr.yarnVariantId,
        zigId: yr.zigId,
        quantity: Number(yr.quantity),
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
    const weaverUserId = body.weaverUserId ?? body.weaverId;
    if (!weaverUserId) {
      throw new Error("VALIDATION: weaverUserId (or weaverId) is required.");
    }

    const result = await commitSettlement({
      weaverUserId,
      returnIds: body.returnIds,
      yarnGivenIds: body.yarnGivenIds,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      recordedByUserId: req.user!.userId,
      overrides: body.overrides,
    });

    res.status(201).json({
      settlementId: result.settlementId,
      paymentId: result.paymentId,
      amount: result.amount,
      reconciledZigIds: result.reconciledZigIds,
      amharicAmountInWords: numberToAmharicWords(Math.round(result.amount)),
    });
  } catch (error) {
    next(error);
  }
});
