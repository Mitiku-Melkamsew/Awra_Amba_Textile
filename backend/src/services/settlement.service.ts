import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AuditService } from "../application/services/audit.service.js";
import {
  buildSettlementPreview,
  type LineOverride,
  type SettlementPreview,
} from "./calculation.service.js";

export type SettlementOverride = LineOverride;

export interface CommitSettlementInput {
  batchId?: number;
  weaverUserId: number;
  returnIds: number[];
  yarnGivenIds: number[];
  paymentMethod?: string;
  notes?: string;
  recordedByUserId: number;
  overrides?: SettlementOverride[];
  expectedNetSettlement?: number;
  markAsPaid?: boolean;
}

export async function commitSettlement(
  input: CommitSettlementInput,
  transaction?: Prisma.TransactionClient,
) {
  const execute = async (tx: Prisma.TransactionClient) => {
    // 1. Fetch eligible returns belonging to the weaver and not yet settled
    const returns = await tx.fabricReturn.findMany({
      where: {
        returnId: { in: input.returnIds },
        workOrder: { weaverUserId: input.weaverUserId },
        settlementLineReturns: { none: {} },
      },
      include: {
        fabricVariant: {
          include: {
            fabric: true,
          },
        },
        workOrder: {
          include: { weaver: { select: { fullName: true } } },
        },
      },
    });

    if (returns.length !== input.returnIds.length) {
      throw new Error(
        "CONFLICT: One or more fabric returns are invalid, belong to another weaver, or are already settled.",
      );
    }

    // 2. Fetch yarn given records
    const yarnGiven = await tx.yarnGiven.findMany({
      where: {
        yarnGivenId: { in: input.yarnGivenIds },
        workOrder: { weaverUserId: input.weaverUserId },
      },
      include: {
        workOrder: true,
      },
    });

    if (yarnGiven.length !== input.yarnGivenIds.length) {
      throw new Error(
        "CONFLICT: One or more yarn records are invalid or belong to another weaver.",
      );
    }

    const zigIds = [...new Set(returns.map((r) => r.zigId))];

    // 3. Fetch yarn returns for these zigs
    const yarnReturns = await tx.yarnReturn.findMany({
      where: { zigId: { in: zigIds } },
    });
    const fabricReturnsToWeaver = await tx.fabricReturnToWeaver.findMany({
      where: { zigId: { in: zigIds } },
    });

    // 4. Fetch global quality rules (for weight deduction rate)
    const weightRule = await tx.qualityRule.findFirst({
      where: { factor: "weight", isActive: true },
    });

    // 5. Build settlement calculation preview
    const preview: SettlementPreview = buildSettlementPreview({
      returns: returns.map((r) => ({
        returnId: r.returnId,
        zigId: r.zigId,
        fabricId: r.fabricVariant.fabricId,
        fabricName: r.fabricVariant.fabric.name,
        fabricVariantId: r.fabricVariantId,
        quantityReturned: r.quantityReturned,
        totalWeight: Number(r.totalWeight),
        excludedQuantity: fabricReturnsToWeaver
          .filter((excluded) =>
            excluded.zigId === r.zigId && excluded.fabricVariantId === r.fabricVariantId)
          .reduce((sum, excluded) => sum + excluded.quantity, 0),
        unitPrice: Number(r.unitPrice),
        standardWeightG: Number(r.fabricVariant.fabric.standardWeightG),
        qualityRule: weightRule
          ? {
              minWeightThreshold: Number(r.fabricVariant.fabric.standardWeightG),
              deductionRatePerUnit: Number(weightRule.deductionPerUnit),
            }
          : undefined,
      })),
      yarnGiven: yarnGiven.map((y) => ({
        yarnGivenId: y.yarnGivenId,
        zigId: y.zigId,
        yarnVariantId: y.yarnVariantId,
        quantity: Number(y.quantity),
        unitPrice: Number(y.unitPrice),
      })),
      yarnReturns: yarnReturns.map((yr) => ({
        yarnVariantId: yr.yarnVariantId,
        zigId: yr.zigId,
        quantity: Number(yr.quantity),
      })),
      overrides: input.overrides,
    });

    if (preview.isBlocked) {
      throw new Error(`BLOCKED: ${preview.blockReasons.join(" | ")}`);
    }

    if (
      input.expectedNetSettlement !== undefined &&
      Math.abs(preview.netSettlement - input.expectedNetSettlement) > 0.01
    ) {
      throw new Error(
        "CONFLICT: Settlement totals changed after preview. Generate a new preview before committing.",
      );
    }

    const batch = input.batchId
      ? await tx.settlementBatch.findUniqueOrThrow({ where: { batchId: input.batchId } })
      : await tx.settlementBatch.create({
          data: {
            status: "draft",
            snapshot: preview as object,
            totalAmount: preview.netSettlement,
            createdByUserId: input.recordedByUserId,
          },
        });

    const shouldPay = input.markAsPaid === true;

    // 6. Create settlement header
    const settlement = await tx.settlement.create({
      data: {
        batchId: batch.batchId,
        weaverUserId: input.weaverUserId,
        status: shouldPay ? "paid" : "draft",
        grossFabricValue: preview.grossFabricValue,
        totalDeductions: preview.totalDeductions,
        totalYarnCost: preview.totalYarnCost,
        netAmount: preview.netSettlement,
        createdByUserId: input.recordedByUserId,
        paidAt: shouldPay ? new Date() : null,
        notes: input.notes,
      },
    });

    // 7. Create settlement lines and settlement_line_returns
    for (const group of preview.groupedLines) {
      const line = await tx.settlementLine.create({
        data: {
          settlementId: settlement.settlementId,
          zigId: group.zigId,
          fabricId: group.fabricId,
          totalQuantity: group.totalQuantity,
          totalWeight: group.totalWeight,
          averageWeight: group.averageWeight,
          standardWeightG: group.standardWeightG,
          unitPrice: group.unitPrice,
          deductionFactor: group.deductionFactor,
          deductionUnit: group.deductionUnit,
          deductionPerPiece: group.deductionPerPiece,
          deductionAmount: group.deductionAmount,
          grossFabricValue: group.grossFabricValue,
          netFabricValue: group.netFabricValue,
        },
      });

      for (const returnId of group.returnIds) {
        await tx.settlementLineReturn.create({
          data: {
            settlementLineId: line.settlementLineId,
            returnId,
          },
        });
      }
    }

    // 8. Create settlement yarn lines
    for (const yl of preview.yarnLines) {
      await tx.settlementYarnLine.create({
        data: {
          settlementId: settlement.settlementId,
          zigId: yl.zigId,
          yarnGivenId: yl.yarnGivenId,
          yarnVariantId: yl.yarnVariantId,
          issuedQuantity: yl.issuedQuantity,
          returnedQuantity: yl.returnedQuantity,
          netQuantity: yl.netQuantity,
          unitPrice: yl.unitPrice,
          totalCost: yl.totalCost,
        },
      });
    }

    // 9. Record payment only if explicitly requested
    let payment: any = null;
    if (shouldPay) {
      payment = await tx.settlementPayment.create({
        data: {
          settlementId: settlement.settlementId,
          amount: preview.netSettlement,
          paymentMethod: input.paymentMethod,
          paymentDate: new Date(),
          recordedByUserId: input.recordedByUserId,
          notes: input.notes,
        },
      });

      // 10. Reconcile all included work orders
      await tx.workOrder.updateMany({
        where: { zigId: { in: zigIds } },
        data: { status: "reconciled" },
      });
    }

    await tx.settlementBatch.update({
      where: { batchId: batch.batchId },
      data: {
        status: input.batchId ? undefined : "committed",
        committedAt: input.batchId ? undefined : new Date(),
        amountPaid: shouldPay ? { increment: preview.netSettlement } : undefined,
      },
    });

    await AuditService.record(
      {
        actorUserId: input.recordedByUserId,
        action: shouldPay ? "settlement.paid" : "settlement.created",
        entityType: "settlement",
        entityId: settlement.settlementId,
        details: { weaverUserId: input.weaverUserId, amount: Number(preview.netSettlement) },
      },
      tx,
    );

    return {
      settlementId: settlement.settlementId,
      batchId: batch.batchId,
      weaverUserId: input.weaverUserId,
      weaverName: returns[0]?.workOrder.weaver.fullName ?? "",
      paymentId: payment?.settlementPaymentId ?? null,
      amount: Number(preview.netSettlement),
      status: settlement.status,
      reconciledZigIds: shouldPay ? zigIds : [],
      preview,
    };
  };

  return transaction ? execute(transaction) : prisma.$transaction(execute);
}
