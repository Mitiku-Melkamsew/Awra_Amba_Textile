import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import {
  discoverReturnedSettlementBundles,
  type WeaverSettlementBundle,
} from "./batch-settlement.service.js";
import {
  commitSettlement as legacyCommitSettlement,
  type CommitSettlementInput,
  type SettlementOverride,
} from "./settlement-core.service.js";
import type { LineOverride } from "./calculation.service.js";
import { createSettlementPreview } from "./settlement-preview.service.js";
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
  static async getUnsettled(
    cutoffDate?: Date | null,
    includeZigIds: string[] = [],
  ): Promise<WeaverSettlementBundle[]> {
    return discoverReturnedSettlementBundles(cutoffDate, [], includeZigIds);
  }

  /**
   * Generates a preview calculation for all unsettled work orders up to an optional cutoff date
   */
  static async generatePreview(
    cutoffDate: Date | null | undefined,
    actorUserId: number,
    overrides: LineOverride[] = [],
    includeZigIds: string[] = [],
  ) {
    return createSettlementPreview(actorUserId, cutoffDate, overrides, includeZigIds);
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
   * Commits a batch of settlements either directly from preview parameters (new stateless model)
   * or from a pre-persisted draft preview (legacy model).
   */
  static async commitBatch(
    input: {
      batchId?: number;
      cutoffDate?: string | Date | null;
      includeZigIds?: string[];
      overrides?: LineOverride[];
      paymentMethod?: string;
      notes?: string | null;
      autoPay?: boolean;
    },
    actorUserId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. If legacy batchId is provided, check if it exists in draft status
      if (input.batchId) {
        const existing = await tx.settlementBatch.findUnique({
          where: { batchId: input.batchId },
        });
        if (existing && existing.status === "draft") {
          return this.commitLegacyDraftBatch(existing, input, actorUserId, tx);
        }
      }

      // 2. Direct Commit (stateless preview):
      const cutoff = input.cutoffDate ? new Date(input.cutoffDate) : null;
      const bundles = await discoverReturnedSettlementBundles(
        cutoff,
        input.overrides ?? [],
        input.includeZigIds ?? [],
      );

      if (bundles.length === 0) {
        throw new ConflictError("No unsettled work orders available to settle");
      }

      const blockedBundles = bundles.filter((b) => b.preview.isBlocked);
      if (blockedBundles.length > 0) {
        const reasons = blockedBundles.flatMap((b) => b.preview.blockReasons ?? []);
        throw new ConflictError(
          `Resolve blocked settlement calculations before committing: ${reasons.join(" | ")}`,
        );
      }

      const estimatedTotal = Number(
        bundles.reduce((sum, b) => sum + b.preview.netSettlement, 0).toFixed(2),
      );

      const committedAt = new Date();
      const batch = await tx.settlementBatch.create({
        data: {
          status: "committed",
          snapshot: {
            weavers: bundles.map((b) => ({
              weaverUserId: b.weaverUserId,
              weaverName: b.weaverName,
              netSettlement: b.preview.netSettlement,
              zigIds: b.zigIds,
              returnIds: b.returnIds,
              yarnGivenIds: b.yarnGivenIds,
            })),
            grandTotal: estimatedTotal,
            weaverCount: bundles.length,
            amharicAmountInWords: formatAmharicAmount(estimatedTotal),
            committedAt,
          },
          totalAmount: estimatedTotal,
          amountPaid: 0,
          createdByUserId: actorUserId,
          committedAt,
        },
      });

      const shouldPay = input.autoPay === true || Boolean(input.paymentMethod);
      const results = [];
      for (const bundle of bundles) {
        results.push(
          await legacyCommitSettlement(
            {
              batchId: batch.batchId,
              weaverUserId: bundle.weaverUserId,
              returnIds: bundle.returnIds,
              yarnGivenIds: bundle.yarnGivenIds,
              paymentMethod: input.paymentMethod,
              notes: input.notes ?? undefined,
              recordedByUserId: actorUserId,
              overrides: bundle.overrides ?? [],
              expectedNetSettlement: Number(bundle.preview.netSettlement),
              markAsPaid: shouldPay,
            },
            tx,
          ),
        );
      }

      const grandTotal = Number(results.reduce((sum, result) => sum + result.amount, 0).toFixed(2));
      const amountPaid = shouldPay ? grandTotal : 0;

      await tx.settlementBatch.update({
        where: { batchId: batch.batchId },
        data: { totalAmount: grandTotal, amountPaid },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "settlement.batch_commit",
          entityType: "settlement_batch",
          entityId: batch.batchId,
          details: { weaverCount: results.length, grandTotal, autoPaid: shouldPay },
        },
        tx,
      );

      return {
        batchId: batch.batchId,
        settlementBatchId: batch.batchId,
        grandTotal,
        totalAmount: grandTotal,
        amountPaid,
        weaverCount: results.length,
        amharicAmountInWords: formatAmharicAmount(grandTotal),
        settlements: results,
      };
    });
  }

  private static async commitLegacyDraftBatch(
    batch: { batchId: number; status: string; snapshot: any; totalAmount: any },
    input: { paymentMethod?: string; notes?: string | null },
    actorUserId: number,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  ) {
    const snapshot = batch.snapshot as {
      weavers?: Array<{
        weaverUserId?: number;
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
      results.push(
        await legacyCommitSettlement(
          {
            batchId: batch.batchId,
            weaverUserId: weaver.weaverUserId!,
            returnIds: weaver.returnIds,
            yarnGivenIds: weaver.yarnGivenIds,
            paymentMethod: input.paymentMethod,
            notes: input.notes ?? undefined,
            recordedByUserId: actorUserId,
            overrides: weaver.overrides ?? [],
            expectedNetSettlement: Number(weaver.netSettlement),
            markAsPaid: false,
          },
          tx,
        ),
      );
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
    const settlements = batch.settlements.map((s) => ({
      ...s,
      fabricLines: s.lines.map((l) => ({
        ...l,
        fabricName: l.fabric?.name,
      })),
      yarnLines: s.yarnLines,
    }));

    return {
      ...snapshot,
      ...batch,
      settlements,
      batchId: batch.batchId,
      previewId: String(batch.batchId),
      status: batch.status,
      totalAmount: Number(batch.totalAmount),
      amountPaid: Number(batch.amountPaid),
      amharicAmountInWords: formatAmharicAmount(Number(batch.totalAmount)),
    };
  }

  /**
   * Cancel an individual weaver's settlement prior to payment (e.g. Due to a dispute).
   * Unlinks the returns so they become unsettled again, and adjusts the batch total.
   */
  static async cancelSettlement(
    settlementId: number,
    data: { reason: string },
    actorUserId: number,
  ) {
    if (!data.reason || data.reason.trim().length === 0) {
      throw new ValidationError("Cancellation reason is required");
    }

    return prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.findUnique({
        where: { settlementId },
        include: { lines: true, payments: true },
      });

      if (!settlement) {
        throw new NotFoundError(`Settlement ${settlementId} not found`);
      }

      if (settlement.status === "paid") {
        throw new ConflictError(
          `Cannot cancel settlement ${settlementId} because it is already paid. Reverse payment first.`,
        );
      }

      if (settlement.status === "cancelled") {
        throw new ConflictError(`Settlement ${settlementId} is already cancelled.`);
      }

      // 1. Delete settlementLineReturns so fabric returns are released
      const lineIds = settlement.lines.map((l) => l.settlementLineId);
      if (lineIds.length > 0) {
        await tx.settlementLineReturn.deleteMany({
          where: { settlementLineId: { in: lineIds } },
        });
      }

      // 2. Mark settlement cancelled with reason in notes
      const cancelNote = `CANCELLED: ${data.reason}`;
      const notes = settlement.notes ? `${settlement.notes}\n${cancelNote}` : cancelNote;

      const updated = await tx.settlement.update({
        where: { settlementId },
        data: {
          status: "cancelled",
          notes,
        },
      });

      // 3. Update parent batch total
      if (settlement.batchId) {
        const remainingSettlements = await tx.settlement.findMany({
          where: {
            batchId: settlement.batchId,
            status: { not: "cancelled" },
          },
        });
        const newTotal = remainingSettlements.reduce((sum, s) => sum + Number(s.netAmount), 0);
        await tx.settlementBatch.update({
          where: { batchId: settlement.batchId },
          data: { totalAmount: Math.round(newTotal * 100) / 100 },
        });
      }

      // 4. Ensure work orders remain returned (not reconciled)
      const zigIds = [...new Set(settlement.lines.map((l) => l.zigId))];
      await tx.workOrder.updateMany({
        where: { zigId: { in: zigIds } },
        data: { status: "returned" },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "settlement.cancel",
          entityType: "settlement",
          entityId: settlementId,
          details: {
            reason: data.reason,
            weaverUserId: settlement.weaverUserId,
            netAmount: Number(settlement.netAmount),
            releasedZigIds: zigIds,
          },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Real-time calculation of pending weaver liability across all returned, unsettled zigs
   */
  static async getPendingSettlementsSummary() {
    const bundles = await discoverReturnedSettlementBundles(null);
    let totalPendingAmount = 0;
    let totalFabricValue = 0;
    let totalDeductions = 0;
    let totalYarnCost = 0;
    let totalPieceCount = 0;
    const zigs: Array<{
      zigId: string;
      weaverUserId: number;
      weaverName: string;
      estimatedPayout: number;
      pieceCount: number;
      isBlocked: boolean;
      blockReasons: string[];
    }> = [];

    for (const b of bundles) {
      totalPendingAmount += b.preview.netSettlement;
      totalFabricValue += b.preview.grossFabricValue;
      totalDeductions += b.preview.totalDeductions;
      totalYarnCost += b.preview.totalYarnCost;

      for (const zigId of b.zigIds) {
        const zigLines = b.preview.lineItems.filter((li) => li.zigId === zigId);
        const zigYarn = b.preview.yarnLines.filter((yl) => yl.zigId === zigId);
        const pieces = zigLines.reduce((sum, li) => sum + li.quantity, 0);
        totalPieceCount += pieces;
        const fabricCredit = zigLines.reduce((sum, li) => sum + li.netCredit, 0);
        const yarnDebit = zigYarn.reduce((sum, yl) => sum + yl.totalCost, 0);
        zigs.push({
          zigId,
          weaverUserId: b.weaverUserId,
          weaverName: b.weaverName,
          estimatedPayout: Math.round((fabricCredit - yarnDebit) * 100) / 100,
          pieceCount: pieces,
          isBlocked: b.preview.isBlocked,
          blockReasons: b.preview.blockReasons,
        });
      }
    }

    return {
      totalPendingAmount: Math.round(totalPendingAmount * 100) / 100,
      totalFabricValue: Math.round(totalFabricValue * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalYarnCost: Math.round(totalYarnCost * 100) / 100,
      weaverCount: bundles.length,
      zigCount: zigs.length,
      totalPieceCount,
      zigs,
    };
  }

  /**
   * Document view ledger for all zigs with status filtering (all | ongoing | returned | reconciled)
   */
  static async getZigsLedger(statusFilter?: string) {
    const where: any = {};
    if (statusFilter === "ongoing") {
      where.status = { in: ["assigned", "yarn_issued", "in_progress"] };
    } else if (statusFilter === "returned") {
      where.status = "returned";
    } else if (statusFilter === "reconciled") {
      where.status = "reconciled";
    }

    const orders = await prisma.workOrder.findMany({
      where,
      include: {
        weaver: { select: { userId: true, fullName: true, phone: true } },
        fabricVariant: {
          include: {
            fabric: true,
            warpColor: true,
            weftColor: true,
            design: true,
          },
        },
        yarnGiven: true,
        yarnReturns: true,
        fabricReturns: true,
        fabricReturnsToWeaver: true,
        settlementLines: {
          include: { settlement: true },
        },
      },
      orderBy: [{ dateIssued: "desc" }, { zigId: "desc" }],
    });

    return orders.map((order) => {
      const issuedYarnQty = order.yarnGiven.reduce((sum, y) => sum + Number(y.quantity), 0);
      const returnedYarnQty = order.yarnReturns.reduce((sum, yr) => sum + Number(yr.quantity), 0);
      const netYarnQty = Math.max(0, issuedYarnQty - returnedYarnQty);
      const totalYarnCost = Number(
        order.yarnGiven.reduce((sum, y) => sum + Number(y.quantity) * Number(y.unitPrice), 0).toFixed(2),
      );

      const fabricPiecesReturned = order.fabricReturns.reduce((sum, fr) => sum + fr.quantityReturned, 0);
      const defectiveFabricQty = order.fabricReturnsToWeaver.reduce((sum, df) => sum + df.quantity, 0);
      const billableFabricPieces = Math.max(0, fabricPiecesReturned - defectiveFabricQty);
      const totalFabricWeight = order.fabricReturns.reduce((sum, fr) => sum + Number(fr.totalWeight), 0);
      const avgWeight = fabricPiecesReturned > 0 ? Math.round(totalFabricWeight / fabricPiecesReturned) : 0;

      const activeSettlementLine = order.settlementLines.find((sl) => sl.settlement.status !== "cancelled");
      const settledAmount = activeSettlementLine ? Number(activeSettlementLine.netFabricValue) : null;
      const isSettled = order.status === "reconciled";

      return {
        zigId: order.zigId,
        weaverUserId: order.weaverUserId,
        weaverName: order.weaver.fullName,
        weaverPhone: order.weaver.phone,
        status: order.status,
        dateIssued: order.dateIssued,
        fabricName: order.fabricVariant.fabric.name,
        standardWeightG: Number(order.fabricVariant.fabric.standardWeightG),
        warpColor: order.fabricVariant.warpColor?.name,
        weftColor: order.fabricVariant.weftColor?.name,
        design: order.fabricVariant.design?.name,
        yarn: {
          issuedQuantity: issuedYarnQty,
          returnedQuantity: returnedYarnQty,
          netQuantity: netYarnQty,
          totalCost: totalYarnCost,
        },
        fabric: {
          receivedQuantity: fabricPiecesReturned,
          defectiveQuantity: defectiveFabricQty,
          billableQuantity: billableFabricPieces,
          totalWeight: totalFabricWeight,
          averageWeight: avgWeight,
        },
        settlement: activeSettlementLine
          ? {
              settlementId: activeSettlementLine.settlementId,
              batchId: activeSettlementLine.settlement.batchId,
              status: activeSettlementLine.settlement.status,
              amount: settledAmount,
            }
          : null,
        isSettled,
      };
    });
  }
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
