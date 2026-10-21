import { prisma } from "../lib/prisma.js";
import {
  buildSettlementPreview,
  calculateDeduction,
  calculateNetCredit,
} from "./calculation.service.js";

export interface SettlementOverride {
  returnId: number;
  calculatedDeduction?: number;
  bonusAmount?: number;
  remark?: string;
}

export interface CommitSettlementInput {
  weaverId: number;
  returnIds: number[];
  yarnGivenIds: number[];
  saleIds: number[];
  paymentMethod?: string;
  notes?: string;
  recordedByUserId: number;
  overrides?: SettlementOverride[];
}

export async function commitSettlement(input: CommitSettlementInput) {
  return prisma.$transaction(async (tx) => {
    const returns = await tx.fabricReturn.findMany({
      where: {
        returnId: { in: input.returnIds },
        paymentId: null,
        workOrder: { weaverId: input.weaverId },
      },
      include: {
        fabricVariant: { include: { qualityRule: true } },
      },
    });

    const yarnGiven = await tx.yarnGiven.findMany({
      where: {
        yarnGivenId: { in: input.yarnGivenIds },
        paymentId: null,
        workOrder: { weaverId: input.weaverId },
      },
    });

    const sales = await tx.sale.findMany({
      where: {
        saleId: { in: input.saleIds },
        paymentId: null,
        weaverId: input.weaverId,
      },
    });

    if (returns.length !== input.returnIds.length) {
      throw new Error("CONFLICT:One or more fabric returns are invalid or already settled.");
    }
    if (yarnGiven.length !== input.yarnGivenIds.length) {
      throw new Error("CONFLICT:One or more yarn deliveries are invalid or already settled.");
    }
    if (sales.length !== input.saleIds.length) {
      throw new Error("CONFLICT:One or more sale adjustments are invalid or already settled.");
    }

    const overrideMap = new Map(
      (input.overrides ?? []).map((item) => [item.returnId, item]),
    );

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
        bonusRule: null,
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

    const payment = await tx.payment.create({
      data: {
        weaverId: input.weaverId,
        amount: preview.netSettlement,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        recordedByUserId: input.recordedByUserId,
      },
    });

    for (const line of preview.lineItems) {
      const row = returns.find((item) => item.returnId === line.returnId)!;
      const override = overrideMap.get(line.returnId);
      const avgWeight =
        row.quantityReturned > 0 ? Number(row.totalWeight) / row.quantityReturned : 0;

      const deductionResult = calculateDeduction({
        avgWeight,
        unitPrice: Number(row.unitPrice),
        quantity: row.quantityReturned,
        minWeightThreshold: Number(row.fabricVariant.qualityRule?.minWeightThreshold ?? 0),
        deductionRatePerUnit: 10,
      });

      const calculatedDeduction = override?.calculatedDeduction ?? deductionResult.deductionPerPiece;
      const bonusAmount = 0; // Bonus is disabled
      const netCreditValue = calculateNetCredit(
        Number(row.unitPrice),
        calculatedDeduction,
        row.quantityReturned,
      );

      await tx.fabricReturn.update({
        where: { returnId: line.returnId },
        data: {
          calculatedDeduction,
          bonusAmount,
          netCreditValue,
          remark: override?.remark ?? line.remark,
          paymentId: payment.paymentId,
        },
      });
    }

    for (const yarnRow of yarnGiven) {
      await tx.yarnGiven.update({
        where: { yarnGivenId: yarnRow.yarnGivenId },
        data: { paymentId: payment.paymentId },
      });
    }

    for (const saleRow of sales) {
      await tx.sale.update({
        where: { saleId: saleRow.saleId },
        data: { paymentId: payment.paymentId },
      });
    }

    const reconciledZigIds = [...new Set(returns.map((row) => row.zigId))];

    return {
      paymentId: payment.paymentId,
      amount: Number(payment.amount),
      reconciledZigIds,
      preview,
    };
  });
}