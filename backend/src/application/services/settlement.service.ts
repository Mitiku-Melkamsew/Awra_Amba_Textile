import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import {
  discoverReturnedSettlementBundles,
  type WeaverSettlementBundle,
} from "../../services/batch-settlement.service.js";
import {
  commitSettlement as legacyCommitSettlement,
  type CommitSettlementInput,
  type SettlementOverride,
} from "../../services/settlement.service.js";
import type { LineOverride } from "../../services/calculation.service.js";
import { createSettlementPreview } from "../../services/settlement-preview.service.js";
import { allocateBatchPayment } from "./settlement-payment.rules.js";
import { formatAmharicAmount } from "../../utils/amharic-words.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../domain/errors/domain-errors.js";

export class SettlementService {
  /**
   * Discovers all unsettled returned work orders grouped by weaver
   */
  static async getUnsettled(cutoffDate?: Date | null): Promise<WeaverSettlementBundle[]> {
    return discoverReturnedSettlementBundles(cutoffDate);
  }

  /**
   * Generates a preview calculation for all unsettled work orders up to an optional cutoff date
   */
  static async generatePreview(
    cutoffDate: Date | null | undefined,
    actorUserId: number,
    overrides: LineOverride[] = [],
  ) {
    return createSettlementPreview(actorUserId, cutoffDate, overrides);
  }

  /**
   * Commits a settlement for a specific weaver
   */
  static async commitSingleSettlement(input: CommitSettlementInput) {
    return legacyCommitSettlement({
      ...input,
      markAsPaid: input.markAsPaid ?? Boolean(input.paymentMethod),
    });
  }

  /**
   * Atomically commits the exact persisted draft preview reviewed by the user.
   */
  static async commitBatch(
    input: {
      batchId: number;
      paymentMethod?: string;
      notes?: string;
    },
    actorUserId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.settlementBatch.findUnique({
        where: { batchId: input.batchId },
      });
      if (!batch) throw new NotFoundError(`Settlement preview ${input.batchId} not found`);
      if (batch.status !== "draft") {
        throw new ConflictError(`Settlement batch ${input.batchId} has already been committed`);
      }

      const snapshot = batch.snapshot as {
        weavers?: Array<{
          weaverId: number;
          weaverName: string;
          returnIds: number[];
          yarnGivenIds: number[];
          netSettlement: number;
          isBlocked: boolean;
          blockReasons: string[];
          overrides: SettlementOverride[];
        }>;
        grandTotal?: number;
        weaverCount?: number;
        amharicAmountInWords?: string;
      };
      const weavers = snapshot.weavers ?? [];
      if (weavers.length === 0) {
        throw new ConflictError("No unsettled work orders available to settle");
      }
      const blockedWeavers = weavers.filter((weaver) => weaver.isBlocked);
      if (blockedWeavers.length > 0) {
        const reasons = blockedWeavers.flatMap((weaver) => weaver.blockReasons ?? []);
        throw new ConflictError(
          `Resolve blocked settlement calculations before committing: ${reasons.join(" | ")}`,
        );
      }

      const results = [];
      for (const weaver of weavers) {
        results.push(await legacyCommitSettlement(
          {
            batchId: batch.batchId,
            weaverUserId: weaver.weaverId,
            returnIds: weaver.returnIds,
            yarnGivenIds: weaver.yarnGivenIds,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
            recordedByUserId: actorUserId,
            overrides: weaver.overrides ?? [],
            expectedNetSettlement: Number(weaver.netSettlement),
            markAsPaid: false,
          },
          tx,
        ));
      }

      const grandTotal = Number(results.reduce((sum, result) => sum + result.amount, 0).toFixed(2));
      if (Math.abs(grandTotal - Number(batch.totalAmount)) > 0.01) {
        throw new ConflictError("Settlement total changed after preview. Generate a new preview.");
      }

      const committedAt = new Date();
      await tx.settlementBatch.update({
        where: { batchId: batch.batchId },
        data: { status: "committed", committedAt, totalAmount: grandTotal, amountPaid: 0 },
      });
      await AuditService.record(
        {
          actorUserId,
          action: "settlement.batch_commit",
          entityType: "settlement_batch",
          entityId: batch.batchId,
          details: { weaverCount: results.length, grandTotal },
        },
        tx,
      );

      return {
        batchId: batch.batchId,
        settlementBatchId: batch.batchId,
        grandTotal,
        totalAmount: grandTotal,
        weaverCount: results.length,
        amharicAmountInWords: snapshot.amharicAmountInWords ?? formatAmharicAmount(grandTotal),
        settlements: results,
      };
    });
  }

  /**
   * Lists historical settlement batches
   */
  static async listBatches() {
    return prisma.settlementBatch.findMany({
      where: { status: "committed" },
      include: {
        createdBy: {
          select: { userId: true, username: true, fullName: true },
        },
        settlements: {
          include: {
            weaver: { select: { userId: true, username: true, fullName: true } },
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Gets detail for a single settlement batch
   */
  static async getBatch(batchId: number) {
    const batch = await prisma.settlementBatch.findUnique({
      where: { batchId },
      include: {
        createdBy: { select: { userId: true, username: true, fullName: true } },
        settlements: {
          include: {
            weaver: { select: { userId: true, username: true, fullName: true } },
            lines: { include: { fabric: true, returns: true } },
            yarnLines: true,
            payments: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundError(`Settlement batch ${batchId} not found`);
    }

    const snapshot = batch.snapshot as Record<string, unknown>;
    return {
      ...snapshot,
      ...batch,
      batchId: batch.batchId,
      previewId: String(batch.batchId),
      status: batch.status,
      totalAmount: Number(batch.totalAmount),
      amountPaid: Number(batch.amountPaid),
      amharicAmountInWords: formatAmharicAmount(Number(batch.totalAmount)),
    };
  }

  /**
   * Record payment against a settlement and reconcile work orders
   */
  static async paySettlement(
    settlementId: number,
    data: { amount?: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    return prisma.$transaction((tx) =>
      this.recordSettlementPayment(tx, settlementId, data, actorUserId),
    );
  }

  static async payBatch(
    batchId: number,
    data: { amount?: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.settlementBatch.findUnique({
        where: { batchId },
        include: {
          settlements: {
            select: {
              settlementId: true,
              netAmount: true,
              payments: { select: { amount: true } },
            },
            orderBy: { settlementId: "asc" },
          },
        },
      });
      if (!batch) throw new NotFoundError(`Settlement batch ${batchId} not found`);

      const outstanding = batch.settlements.reduce(
        (sum, settlement) =>
          sum + Math.max(
            0,
            Number(settlement.netAmount) -
              settlement.payments.reduce((paid, payment) => paid + Number(payment.amount), 0),
          ),
        0,
      );
      const requestedAmount = data.amount ?? outstanding;
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        throw new ValidationError("Payment amount must be greater than zero");
      }
      if (requestedAmount > outstanding + 0.005) {
        throw new ValidationError(`Payment exceeds the batch balance of ${outstanding.toFixed(2)}`);
      }

      const allocations = allocateBatchPayment(
        batch.settlements.map((settlement) => {
          const alreadyPaid = settlement.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0,
          );
          return {
            settlementId: settlement.settlementId,
            balance: Number(settlement.netAmount) - alreadyPaid,
          };
        }),
        Math.min(requestedAmount, outstanding),
      );
      const payments = [];
      for (const allocation of allocations) {
        const payment = await this.recordSettlementPayment(
          tx,
          allocation.settlementId,
          { ...data, amount: allocation.amount },
          actorUserId,
        );
        payments.push(payment);
      }
      const amountApplied = Number(
        payments.reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2),
      );

      return {
        batchId,
        payments,
        amountPaid: amountApplied,
        remainingBalance: Number((outstanding - amountApplied).toFixed(2)),
      };
    });
  }

  private static async recordSettlementPayment(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    settlementId: number,
    data: { amount?: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    const settlement = await tx.settlement.findUnique({
      where: { settlementId },
      include: { lines: true, payments: true },
    });
    if (!settlement) throw new NotFoundError(`Settlement ${settlementId} not found`);

    const alreadyPaid = settlement.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const balance = Math.max(0, Number(settlement.netAmount) - alreadyPaid);
    if (balance <= 0.005) {
      if (settlement.payments.length > 0) {
        return settlement.payments[settlement.payments.length - 1];
      }
      throw new ConflictError(`Settlement ${settlementId} has no payable balance`);
    }

    const requestedAmount = data.amount ?? balance;
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      throw new ValidationError("Payment amount must be greater than zero");
    }
    if (requestedAmount > balance + 0.005) {
      throw new ValidationError(`Payment exceeds the settlement balance of ${balance.toFixed(2)}`);
    }
    const amount = Math.min(requestedAmount, balance);
    const paidTotal = alreadyPaid + amount;
    const isFullyPaid = paidTotal >= Number(settlement.netAmount) - 0.005;
    const payment = await tx.settlementPayment.create({
      data: {
        settlementId,
        amount,
        paymentMethod: data.paymentMethod ?? "cash",
        notes: data.notes,
        recordedByUserId: actorUserId,
      },
    });

    await tx.settlement.update({
      where: { settlementId },
      data: {
        status: isFullyPaid ? "paid" : "draft",
        paidAt: isFullyPaid ? new Date() : null,
      },
    });
    await tx.settlementBatch.update({
      where: { batchId: settlement.batchId },
      data: { amountPaid: { increment: amount } },
    });

    const zigIds = [...new Set(settlement.lines.map((line) => line.zigId))];
    if (isFullyPaid) {
      await tx.workOrder.updateMany({
        where: { zigId: { in: zigIds } },
        data: { status: "reconciled" },
      });
    }

    await AuditService.record(
      {
        actorUserId,
        action: "settlement.pay",
        entityType: "settlement",
        entityId: settlementId,
        details: { amount, balanceAfter: Math.max(0, Number(settlement.netAmount) - paidTotal), zigIds },
      },
      tx,
    );
    return payment;
  }

  /**
   * Record quality deduction override on a settlement line
   */
  static async overrideLine(
    lineId: number,
    data: { deductionAmount: number; reason: string },
    actorUserId: number,
  ) {
    const line = await prisma.settlementLine.findUnique({
      where: { settlementLineId: lineId },
      include: { settlement: true },
    });

    if (!line) throw new NotFoundError(`Settlement line ${lineId} not found`);

    return prisma.$transaction(async (tx) => {
      const netFabricValue = Math.round((Number(line.grossFabricValue) - data.deductionAmount) * 100) / 100;

      const updated = await tx.settlementLine.update({
        where: { settlementLineId: lineId },
        data: {
          deductionAmount: data.deductionAmount,
          netFabricValue,
        },
      });

      // Recalculate and persist parent settlement totals
      const settlementLines = await tx.settlementLine.findMany({
        where: { settlementId: line.settlementId },
      });
      const totalDeductions = settlementLines.reduce(
        (sum, l) => sum + Number(l.deductionAmount),
        0,
      );
      const grossFabricValue = settlementLines.reduce(
        (sum, l) => sum + Number(l.grossFabricValue),
        0,
      );
      const netAmount = Math.max(
        0,
        Math.round((grossFabricValue - totalDeductions - Number(line.settlement.totalYarnCost)) * 100) / 100,
      );

      await tx.settlement.update({
        where: { settlementId: line.settlementId },
        data: {
          totalDeductions,
          netAmount,
        },
      });

      // Update settlement batch total amount if part of a batch
      if (line.settlement.batchId) {
        const batchSettlements = await tx.settlement.findMany({
          where: { batchId: line.settlement.batchId },
        });
        const batchTotal = batchSettlements.reduce(
          (sum, s) => sum + Number(s.netAmount),
          0,
        );
        await tx.settlementBatch.update({
          where: { batchId: line.settlement.batchId },
          data: {
            totalAmount: Math.round(batchTotal * 100) / 100,
          },
        });
      }

      await AuditService.record(
        {
          actorUserId,
          action: "settlement.line_override",
          entityType: "settlement_line",
          entityId: lineId,
          details: {
            previousDeduction: Number(line.deductionAmount),
            newDeduction: data.deductionAmount,
            reason: data.reason,
          },
        },
        tx,
      );

      return updated;
    });
  }
}
