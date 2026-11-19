import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { AuditService } from "./audit.service.js";
import { formatAmharicAmount } from "../../utils/amharic-words.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../domain/errors/domain-errors.js";
import {
  computeGrossFabricValue,
  computeNetFabricValue,
  roundCurrency,
  type LineOverride,
} from "./calculation.service.js";
import { allocateBatchPayment } from "./settlement-payment.rules.js";
import { WorkOrderService } from "./work-order.service.js";

/** Cutoffs are calendar dates; include the whole day. */
function normalizeCutoff(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
}

const fabricVariantInclude = {
  fabric: true,
  warpColor: true,
  weftColor: true,
  design: true,
};

const yarnVariantInclude = {
  yarn: true,
  color: true,
  supplier: true,
};

export interface WeaverSettlementBundlePreview {
  weaverUserId: number;
  weaverName: string;
  weaverPhone?: string | null;
  zigIds: string[];
  returnIds: number[];
  yarnGivenIds: number[];
  fabricLines: Array<{
    returnId: number;
    zigId: string;
    fabricVariantId: number;
    fabricName: string;
    quantityReturned: number;
    totalWeight: number;
    avgWeight: number;
    unitPrice: number;
    grossFabricValue: number;
    deductions: any[];
    deductionAmount: number;
    netFabricValue: number;
    remark?: string | null;
  }>;
  yarnLines: Array<{
    yarnGivenId: number;
    zigId: string;
    yarnVariantId: number;
    yarnSku: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    remark?: string | null;
  }>;
  grossFabricValue: number;
  totalDeductions: number;
  totalYarnCost: number;
  netSettlement: number;
  isBlocked: boolean;
  blockReasons: string[];
}

export class SettlementService {
  /**
   * Pending liability summary: total payable for returned zigs not yet in a settlement
   */
  static async getPendingSettlementsSummary() {
    const result = await prisma.workOrder.aggregate({
      where: {
        status: "returned",
        settlementId: null,
      },
      _sum: { netPayable: true },
      _count: { _all: true },
    });

    const pendingLiability = Number(result._sum.netPayable ?? 0);
    const unsettledZigCount = result._count._all;

    return {
      pendingLiability: roundCurrency(pendingLiability),
      unsettledZigCount,
    };
  }

  /**
   * Helper to discover eligible returned work orders by cutoff and optional exception zig IDs
   */
  private static async getEligibleWorkOrders(
    cutoffDate?: Date | null,
    includeZigIds: string[] = [],
  ) {
    const whereClause: any = {
      status: "returned",
      settlementId: null,
    };

    if (cutoffDate && includeZigIds.length > 0) {
      whereClause.OR = [
        { dateReturned: { lte: cutoffDate } },
        { zigId: { in: includeZigIds } },
      ];
    } else if (cutoffDate) {
      whereClause.dateReturned = { lte: cutoffDate };
    } else if (includeZigIds.length > 0) {
      whereClause.zigId = { in: includeZigIds };
    }

    return prisma.workOrder.findMany({
      where: whereClause,
      include: {
        weaver: { select: { userId: true, fullName: true, phone: true } },
        fabricVariant: { include: fabricVariantInclude },
        fabricReturns: {
          include: { fabricVariant: { include: fabricVariantInclude } },
          orderBy: { dateReturned: "asc" },
        },
        yarnGiven: {
          include: { yarnVariant: { include: yarnVariantInclude } },
          orderBy: { dateGiven: "asc" },
        },
      },
      orderBy: [{ dateReturned: "asc" }, { zigId: "asc" }],
    });
  }

  /**
   * Generates ephemeral in-memory preview of settlement bundles per weaver. Zero DB writes.
   */
  static async generatePreview(
    cutoffDate?: Date | null,
    _actorUserId?: number,
    overrides: LineOverride[] = [],
    includeZigIds: string[] = [],
  ) {
    const cutoff = normalizeCutoff(cutoffDate);
    const orders = await this.getEligibleWorkOrders(cutoff, includeZigIds);
    const overrideMap = new Map((overrides ?? []).map((o) => [o.returnId, o]));

    // Group work orders by weaverUserId
    const weaverMap = new Map<number, typeof orders>();
    for (const order of orders) {
      const list = weaverMap.get(order.weaverUserId) ?? [];
      list.push(order);
      weaverMap.set(order.weaverUserId, list);
    }

    const bundles: WeaverSettlementBundlePreview[] = [];
    let grandGross = 0;
    let grandDeductions = 0;
    let grandYarn = 0;
    let grandNet = 0;
    const allBlockReasons: string[] = [];

    for (const [weaverUserId, weaverOrders] of weaverMap) {
      const weaver = weaverOrders[0].weaver;
      const zigIds = weaverOrders.map((o) => o.zigId);
      const fabricLines: WeaverSettlementBundlePreview["fabricLines"] = [];
      const yarnLines: WeaverSettlementBundlePreview["yarnLines"] = [];
      const blockReasons: string[] = [];

      let weaverGross = 0;
      let weaverDeductions = 0;
      let weaverYarnCost = 0;

      for (const order of weaverOrders) {
        // Fabric lines
        for (const fr of order.fabricReturns) {
          const override = overrideMap.get(fr.returnId);
          const qty = fr.quantityReturned;
          const unitPrice = Number(fr.unitPrice);
          const gross = computeGrossFabricValue(qty, unitPrice);
          const deductionAmount = override?.calculatedDeduction !== undefined
            ? roundCurrency(override.calculatedDeduction * qty)
            : Number(fr.deductionAmount);
          const netFabric = computeNetFabricValue(gross, deductionAmount);

          if (qty > 0 && deductionAmount / qty > unitPrice) {
            blockReasons.push(
              `Deduction exceeds unit price on return #${fr.returnId} for zig ${order.zigId}`,
            );
          }

          fabricLines.push({
            returnId: fr.returnId,
            zigId: order.zigId,
            fabricVariantId: fr.fabricVariantId,
            fabricName: fr.fabricVariant.fabric.name,
            quantityReturned: qty,
            totalWeight: Number(fr.totalWeight),
            avgWeight: qty > 0 ? Math.round(Number(fr.totalWeight) / qty) : 0,
            unitPrice,
            grossFabricValue: gross,
            deductions: (fr.deductions as any[]) ?? [],
            deductionAmount,
            netFabricValue: netFabric,
            remark: override?.remark ?? fr.remark,
          });

          weaverGross += gross;
          weaverDeductions += deductionAmount;
        }

        // Yarn lines
        for (const yg of order.yarnGiven) {
          const qty = Number(yg.quantity);
          const unitPrice = Number(yg.unitPrice);
          const cost = roundCurrency(qty * unitPrice);

          yarnLines.push({
            yarnGivenId: yg.yarnGivenId,
            zigId: order.zigId,
            yarnVariantId: yg.yarnVariantId,
            yarnSku: yg.yarnVariant.sku,
            quantity: qty,
            unitPrice,
            totalCost: cost,
            remark: yg.remark,
          });

          weaverYarnCost += cost;
        }
      }

      weaverGross = roundCurrency(weaverGross);
      weaverDeductions = roundCurrency(weaverDeductions);
      weaverYarnCost = roundCurrency(weaverYarnCost);
      const netSettlement = roundCurrency(weaverGross - weaverDeductions - weaverYarnCost);

      if (weaverYarnCost > weaverGross - weaverDeductions) {
        blockReasons.push(
          `Total yarn cost (${weaverYarnCost} ETB) exceeds net fabric value (${weaverGross - weaverDeductions} ETB) for ${weaver.fullName}`,
        );
      }

      allBlockReasons.push(...blockReasons);

      bundles.push({
        weaverUserId,
        weaverName: weaver.fullName,
        weaverPhone: weaver.phone,
        zigIds,
        returnIds: fabricLines.map((line) => line.returnId),
        yarnGivenIds: yarnLines.map((line) => line.yarnGivenId),
        fabricLines,
        yarnLines,
        grossFabricValue: weaverGross,
        totalDeductions: weaverDeductions,
        totalYarnCost: weaverYarnCost,
        netSettlement,
        isBlocked: blockReasons.length > 0,
        blockReasons,
      });

      grandGross += weaverGross;
      grandDeductions += weaverDeductions;
      grandYarn += weaverYarnCost;
      grandNet += netSettlement;
    }

    grandGross = roundCurrency(grandGross);
    grandDeductions = roundCurrency(grandDeductions);
    grandYarn = roundCurrency(grandYarn);
    grandNet = roundCurrency(grandNet);

    // Returned, unsettled zigs that the cutoff excluded so the admin can add
    // them explicitly as exceptions.
    const includedZigIds = new Set(orders.map((order) => order.zigId));
    const outOfCutoffZigs = cutoff
      ? (
          await prisma.workOrder.findMany({
            where: {
              status: "returned",
              settlementId: null,
              dateReturned: { gt: cutoff },
              ...(includedZigIds.size > 0
                ? { zigId: { notIn: [...includedZigIds] } }
                : {}),
            },
            include: { weaver: { select: { userId: true, fullName: true } } },
            orderBy: [{ dateReturned: "asc" }, { zigId: "asc" }],
          })
        ).map((order) => ({
          zigId: order.zigId,
          weaverUserId: order.weaver.userId,
          weaverName: order.weaver.fullName,
          firstReturnDate: (order.dateReturned ?? new Date()).toISOString(),
        }))
      : [];

    return {
      bundles,
      weavers: bundles, // alias for backwards compatibility
      grandTotal: grandNet,
      totalAmount: grandNet,
      grossFabricValue: grandGross,
      totalDeductions: grandDeductions,
      totalYarnCost: grandYarn,
      weaverCount: bundles.length,
      zigCount: orders.length,
      outOfCutoffZigs,
      amharicAmountInWords: formatAmharicAmount(grandNet),
      isBlocked: allBlockReasons.length > 0,
      blockReasons: allBlockReasons,
    };
  }

  /**
   * For backwards compatibility with /unsettled endpoint
   */
  static async getUnsettled(cutoffDate?: Date | null, includeZigIds: string[] = []) {
    const preview = await this.generatePreview(cutoffDate, undefined, [], includeZigIds);
    return preview.bundles;
  }

  /**
   * Commit a settlement batch atomically (creates SettlementBatch, Settlements, payments, reconciles work orders)
   */
  static async commitBatch(
    input: {
      cutoffDate?: string | Date | null;
      includeZigIds?: string[];
      overrides?: LineOverride[];
      paymentMethod?: string;
      notes?: string | null;
      autoPay?: boolean;
      expectedNetSettlement?: number;
    },
    actorUserId: number,
  ) {
    const cutoff = normalizeCutoff(input.cutoffDate);
    const includeZigIds = input.includeZigIds ?? [];
    const preview = await this.generatePreview(cutoff, actorUserId, input.overrides ?? [], includeZigIds);

    if (preview.bundles.length === 0) {
      throw new ConflictError("No unsettled work orders available to settle");
    }

    if (preview.isBlocked) {
      throw new ConflictError(
        `Resolve blocked settlement calculations before committing: ${preview.blockReasons.join(" | ")}`,
      );
    }

    if (
      input.expectedNetSettlement !== undefined &&
      Math.abs(preview.grandTotal - input.expectedNetSettlement) > 0.01
    ) {
      throw new ConflictError(
        `Settlement total changed (expected ${input.expectedNetSettlement} ETB, calculated ${preview.grandTotal} ETB). Regenerate the preview and try again.`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const shouldPay = input.autoPay === true;
      const committedAt = new Date();
      const paidAt = shouldPay ? committedAt : null;
      const settlementStatus = shouldPay ? "paid" : "committed";

      const batch = await tx.settlementBatch.create({
        data: {
          status: shouldPay ? "paid" : "committed",
          cutoffDate: cutoff,
          exceptionZigIds: includeZigIds,
          totalAmount: preview.grandTotal,
          amountPaid: shouldPay ? preview.grandTotal : 0,
          paymentMethod: shouldPay ? (input.paymentMethod ?? "cash") : null,
          notes: input.notes,
          createdByUserId: actorUserId,
          committedAt,
          paidAt,
        },
      });

      const settlements = [];

      for (const bundle of preview.bundles) {
        const settlement = await tx.settlement.create({
          data: {
            batchId: batch.batchId,
            weaverUserId: bundle.weaverUserId,
            status: settlementStatus,
            grossFabricValue: bundle.grossFabricValue,
            totalDeductions: bundle.totalDeductions,
            totalYarnCost: bundle.totalYarnCost,
            netAmount: bundle.netSettlement,
            notes: input.notes,
            createdByUserId: actorUserId,
            paidAt,
          },
          include: {
            weaver: { select: { userId: true, fullName: true, phone: true } },
          },
        });

        if (shouldPay) {
          await tx.settlementPayment.create({
            data: {
              settlementId: settlement.settlementId,
              amount: bundle.netSettlement,
              paymentMethod: input.paymentMethod ?? "cash",
              recordedByUserId: actorUserId,
              notes: input.notes,
            },
          });
        }

        // Link work orders only if nobody else settled them in the meantime.
        const linked = await tx.workOrder.updateMany({
          where: {
            zigId: { in: bundle.zigIds },
            settlementId: null,
            status: "returned",
          },
          data: {
            status: shouldPay ? "reconciled" : "returned",
            settlementId: settlement.settlementId,
            settlementBatchId: batch.batchId,
          },
        });

        if (linked.count !== bundle.zigIds.length) {
          throw new ConflictError(
            `Work orders changed while committing ${bundle.weaverName}. Regenerate the preview and try again.`,
          );
        }

        settlements.push(settlement);
      }

      await AuditService.record(
        {
          actorUserId,
          action: "settlement.batch_commit",
          entityType: "settlement_batch",
          entityId: batch.batchId,
          details: {
            weaverCount: preview.bundles.length,
            grandTotal: preview.grandTotal,
            autoPaid: shouldPay,
            cutoffDate: cutoff,
            exceptionZigIds: includeZigIds,
          },
        },
        tx,
      );

      return {
        batchId: batch.batchId,
        settlementBatchId: batch.batchId,
        status: shouldPay ? "paid" : "committed",
        grandTotal: preview.grandTotal,
        totalAmount: preview.grandTotal,
        amountPaid: shouldPay ? preview.grandTotal : 0,
        weaverCount: preview.bundles.length,
        amharicAmountInWords: preview.amharicAmountInWords,
        settlements,
      };
    });
  }

  /**
   * Cancel an individual weaver's settlement with reason and revert their zigs back to returned
   */
  static async cancelSettlement(
    settlementId: number,
    data: { reason: string },
    actorUserId: number,
  ) {
    const settlement = await prisma.settlement.findUnique({
      where: { settlementId },
      include: { workOrders: true, batch: true, payments: true },
    });
    if (!settlement) throw new NotFoundError(`Settlement ${settlementId} not found`);
    if (settlement.status === "cancelled") {
      throw new ConflictError("Settlement is already cancelled");
    }
    if (settlement.status === "paid" || settlement.payments.length > 0) {
      throw new ConflictError(
        "Cannot cancel a settlement that has recorded payments. Reverse the payment first.",
      );
    }

    return prisma.$transaction(async (tx) => {
      const updatedSettlement = await tx.settlement.update({
        where: { settlementId },
        data: {
          status: "cancelled",
          cancelReason: data.reason,
        },
      });

      // Revert associated work orders
      const zigIds = settlement.workOrders.map((wo) => wo.zigId);
      await tx.workOrder.updateMany({
        where: { settlementId },
        data: {
          status: "returned",
          settlementId: null,
          settlementBatchId: null,
        },
      });

      // Recompute parent batch totals from the remaining active settlements.
      await this.syncBatchTotals(tx, settlement.batchId);

      await AuditService.record(
        {
          actorUserId,
          action: "settlement.cancel",
          entityType: "settlement",
          entityId: settlementId,
          details: { reason: data.reason, revertedZigIds: zigIds },
        },
        tx,
      );

      return updatedSettlement;
    });
  }

  /**
   * List batches with pagination
   */
  static async listBatches() {
    return prisma.settlementBatch.findMany({
      include: {
        createdBy: { select: { userId: true, fullName: true, username: true } },
        settlements: {
          include: {
            weaver: { select: { userId: true, fullName: true, phone: true } },
            payments: true,
            workOrders: { select: { zigId: true } },
          },
          orderBy: { settlementId: "asc" },
        },
        _count: {
          select: { settlements: true, workOrders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single batch details
   */
  static async getBatch(batchId: number) {
    const batch = await prisma.settlementBatch.findUnique({
      where: { batchId },
      include: {
        createdBy: { select: { userId: true, fullName: true, username: true } },
        settlements: {
          include: {
            weaver: { select: { userId: true, fullName: true, phone: true } },
            payments: true,
            workOrders: {
              include: {
                fabricVariant: { include: fabricVariantInclude },
                fabricReturns: true,
                yarnGiven: { include: { yarnVariant: { include: yarnVariantInclude } } },
              },
            },
          },
          orderBy: { settlementId: "asc" },
        },
        workOrders: {
          include: {
            weaver: { select: { userId: true, fullName: true, phone: true } },
            fabricVariant: { include: fabricVariantInclude },
            fabricReturns: true,
            yarnGiven: { include: { yarnVariant: { include: yarnVariantInclude } } },
          },
        },
      },
    });

    if (!batch) throw new NotFoundError(`Settlement batch ${batchId} not found`);

    return {
      ...batch,
      amharicAmountInWords: formatAmharicAmount(Number(batch.totalAmount)),
    };
  }

  /**
   * Get a single settlement with its lines (work orders), payments and batch.
   */
  static async getSettlement(settlementId: number) {
    const settlement = await prisma.settlement.findUnique({
      where: { settlementId },
      include: {
        weaver: { select: { userId: true, fullName: true, username: true, phone: true } },
        batch: true,
        payments: { orderBy: { paymentDate: "desc" } },
        workOrders: {
          include: {
            fabricVariant: { include: fabricVariantInclude },
            fabricReturns: { orderBy: { dateReturned: "asc" } },
            yarnGiven: { include: { yarnVariant: { include: yarnVariantInclude } } },
          },
          orderBy: { zigId: "asc" },
        },
      },
    });

    if (!settlement) throw new NotFoundError(`Settlement ${settlementId} not found`);
    return settlement;
  }

  /**
   * Recompute a batch's money totals and status from its non-cancelled
   * settlements. Must run inside a transaction.
   */
  private static async syncBatchTotals(tx: Prisma.TransactionClient, batchId: number) {
    const settlements = await tx.settlement.findMany({
      where: { batchId, status: { not: "cancelled" } },
      include: { payments: true },
    });

    const totalAmount = roundCurrency(
      settlements.reduce((sum: number, settlement: any) => sum + Number(settlement.netAmount), 0),
    );
    const amountPaid = roundCurrency(
      settlements.reduce(
        (sum: number, settlement: any) =>
          sum +
          settlement.payments.reduce(
            (paid: number, payment: any) => paid + Number(payment.amount),
            0,
          ),
        0,
      ),
    );

    const status =
      settlements.length === 0
        ? "cancelled"
        : amountPaid >= totalAmount - 0.005
          ? "paid"
          : "committed";

    await tx.settlementBatch.update({
      where: { batchId },
      data: {
        totalAmount,
        amountPaid,
        status,
        paidAt: status === "paid" ? new Date() : null,
      },
    });

    return { totalAmount, amountPaid, status };
  }

  /**
   * Master Zigs ledger: shows ongoing, returned, and reconciled zigs with fabric, yarn, and settlement info
   */
  static async getZigsLedger(statusFilter?: string) {
    const where: any = {};
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "ongoing") {
        where.status = { in: ["assigned", "in_progress"] };
      } else if (statusFilter === "returned") {
        where.status = "returned";
      } else if (statusFilter === "reconciled") {
        where.status = "reconciled";
      }
    }

    const orders = await prisma.workOrder.findMany({
      where,
      include: {
        weaver: { select: { userId: true, fullName: true, phone: true } },
        fabricVariant: { include: fabricVariantInclude },
        yarnGiven: true,
        fabricReturns: true,
        settlement: {
          include: { batch: true },
        },
      },
      orderBy: [{ dateIssued: "desc" }, { zigId: "desc" }],
    });

    return orders.map((order) => {
      const issuedYarnQty = order.yarnGiven.reduce((sum, y) => sum + Number(y.quantity), 0);
      const totalYarnCost = roundCurrency(
        order.yarnGiven.reduce((sum, y) => sum + Number(y.quantity) * Number(y.unitPrice), 0),
      );

      const fabricPiecesReturned = order.fabricReturns.reduce((sum, fr) => sum + fr.quantityReturned, 0);
      const totalFabricWeight = order.fabricReturns.reduce((sum, fr) => sum + Number(fr.totalWeight), 0);
      const avgWeight = fabricPiecesReturned > 0 ? Math.round(totalFabricWeight / fabricPiecesReturned) : 0;
      const totalGrossFabric = roundCurrency(
        order.fabricReturns.reduce((sum, fr) => sum + Number(fr.grossFabricValue), 0),
      );
      const totalDeductions = roundCurrency(
        order.fabricReturns.reduce((sum, fr) => sum + Number(fr.deductionAmount), 0),
      );

      return {
        zigId: order.zigId,
        weaverUserId: order.weaverUserId,
        weaverName: order.weaver.fullName,
        weaverPhone: order.weaver.phone,
        status: order.status,
        dateIssued: order.dateIssued,
        dateReturned: order.dateReturned,
        fabricName: order.fabricVariant.fabric.name,
        standardWeightG: Number(order.fabricVariant.fabric.standardWeightG),
        warpColor: order.fabricVariant.warpColor?.name,
        weftColor: order.fabricVariant.weftColor?.name,
        design: order.fabricVariant.design?.name,
        netPayable: Number(order.netPayable),
        yarn: {
          issuedQuantity: issuedYarnQty,
          returnedQuantity: 0,
          netQuantity: issuedYarnQty,
          totalCost: totalYarnCost,
        },
        fabric: {
          receivedQuantity: fabricPiecesReturned,
          defectiveQuantity: 0,
          billableQuantity: fabricPiecesReturned,
          totalWeight: totalFabricWeight,
          averageWeight: avgWeight,
          grossFabricValue: totalGrossFabric,
          deductionAmount: totalDeductions,
          netFabricValue: roundCurrency(totalGrossFabric - totalDeductions),
        },
        settlement: order.settlement
          ? {
              settlementId: order.settlement.settlementId,
              batchId: order.settlement.batchId,
              status: order.settlement.status,
              amount: Number(order.settlement.netAmount),
            }
          : null,
        isSettled: order.settlementId !== null,
      };
    });
  }

  /**
   * Pay an individual settlement.
   */
  static async paySettlement(
    settlementId: number,
    data: { amount?: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    return prisma.$transaction((tx) =>
      this.paySettlementInTransaction(tx, settlementId, data, actorUserId),
    );
  }

  /**
   * Shared payout core so batch payouts can run in one transaction.
   */
  private static async paySettlementInTransaction(
    tx: Prisma.TransactionClient,
    settlementId: number,
    data: { amount?: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    const settlement = await tx.settlement.findUnique({
      where: { settlementId },
      include: { payments: true, workOrders: true },
    });
    if (!settlement) throw new NotFoundError(`Settlement ${settlementId} not found`);
    if (settlement.status === "cancelled") {
      throw new ConflictError(`Settlement ${settlementId} is cancelled`);
    }

    const alreadyPaid = settlement.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const balance = Math.max(0, Number(settlement.netAmount) - alreadyPaid);
    if (balance <= 0.005) {
      throw new ConflictError(`Settlement ${settlementId} has no payable balance`);
    }

    if (data.amount !== undefined && data.amount > balance + 0.005) {
      throw new ValidationError(
        `Payment amount ${data.amount} ETB exceeds the outstanding balance ${balance} ETB`,
      );
    }

    const amount = roundCurrency(Math.min(data.amount ?? balance, balance));
    const payment = await tx.settlementPayment.create({
      data: {
        settlementId,
        amount,
        paymentMethod: data.paymentMethod ?? "cash",
        notes: data.notes,
        recordedByUserId: actorUserId,
      },
    });

    const paidTotal = roundCurrency(alreadyPaid + amount);
    const isFullyPaid = paidTotal >= Number(settlement.netAmount) - 0.005;

    await tx.settlement.update({
      where: { settlementId },
      data: {
        status: isFullyPaid ? "paid" : "committed",
        paidAt: isFullyPaid ? new Date() : null,
      },
    });

    const batch = await this.syncBatchTotals(tx, settlement.batchId);

    if (isFullyPaid) {
      await tx.workOrder.updateMany({
        where: { settlementId },
        data: { status: "reconciled" },
      });
    }

    await AuditService.record(
      {
        actorUserId,
        action: "settlement.pay",
        entityType: "settlement",
        entityId: settlementId,
        details: { amount, balanceAfter: roundCurrency(balance - amount) },
      },
      tx,
    );

    return { ...payment, batch };
  }

  /**
   * Pay a whole batch. Allocations are computed from the current balances and
   * every settlement payment is written in one transaction.
   */
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
            where: { status: { not: "cancelled" } },
            include: { payments: true },
            orderBy: { settlementId: "asc" },
          },
        },
      });
      if (!batch) throw new NotFoundError(`Settlement batch ${batchId} not found`);
      if (batch.status === "cancelled") {
        throw new ConflictError(`Settlement batch ${batchId} is cancelled`);
      }

      const balances = batch.settlements
        .map((settlement) => {
          const paid = settlement.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0,
          );
          return {
            settlementId: settlement.settlementId,
            balance: roundCurrency(Math.max(0, Number(settlement.netAmount) - paid)),
          };
        })
        .filter((row) => row.balance > 0.005);

      if (balances.length === 0) {
        throw new ConflictError(`Settlement batch ${batchId} has no payable balance`);
      }

      const totalBalance = roundCurrency(
        balances.reduce((sum, row) => sum + row.balance, 0),
      );
      if (data.amount !== undefined && data.amount > totalBalance + 0.005) {
        throw new ValidationError(
          `Payment amount ${data.amount} ETB exceeds the outstanding batch balance ${totalBalance} ETB`,
        );
      }

      const allocations = data.amount !== undefined
        ? allocateBatchPayment(balances, data.amount)
        : balances.map((row) => ({ settlementId: row.settlementId, amount: row.balance }));

      if (allocations.length === 0) {
        throw new ConflictError(`Settlement batch ${batchId} has no payable balance`);
      }

      const payments = [];
      for (const allocation of allocations) {
        const payment = await this.paySettlementInTransaction(
          tx,
          allocation.settlementId,
          { ...data, amount: allocation.amount },
          actorUserId,
        );
        payments.push(payment);
      }

      const updated = await tx.settlementBatch.findUniqueOrThrow({
        where: { batchId },
        include: { settlements: { select: { settlementId: true, status: true } } },
      });

      return {
        batchId,
        payments,
        amountPaid: Number(updated.amountPaid),
        totalAmount: Number(updated.totalAmount),
        status: updated.status,
        settlements: updated.settlements,
      };
    });
  }

  /**
   * Export batch Hisab CSV covering all settlements in the batch
   */
  static async exportBatchCsv(batchId: number): Promise<string | null> {
    const batch = await prisma.settlementBatch.findUnique({
      where: { batchId },
      include: {
        settlements: {
          select: { settlementId: true },
          orderBy: { settlementId: "asc" },
        },
      },
    });
    if (!batch) return null;

    const header = [
      "weaver_id",
      "weaver_name",
      "zig_id",
      "fabric_type",
      "fabric_qty",
      "avg_weight",
      "base_price",
      "deduction",
      "adjusted_price",
      "line_subtotal",
      "fabric_total_value",
      "yarn_qty",
      "yarn_avg_price",
      "yarn_total",
      "net_profit",
      "total_net_profit",
    ];

    const lines: string[] = [
      `ባች ቁጥር: ${batch.batchId} - ቀን: ${batch.committedAt ? batch.committedAt.toISOString().slice(0, 10) : ""}`,
      "",
      header.join(","),
    ];

    for (const s of batch.settlements) {
      try {
        const { buildHisabReport } = await import("./hisab-report.service.js");
        const report = await buildHisabReport(s.settlementId);
        for (const row of report.rows) {
          lines.push(
            [
              row.weaverId,
              row.weaverName,
              row.zigId,
              row.fabricType,
              row.fabricQty,
              row.avgWeight,
              row.basePrice,
              row.deduction,
              row.adjustedPrice,
              row.lineSubtotal,
              row.fabricTotalValue,
              row.yarnQty,
              row.yarnAvgPrice,
              row.yarnTotal,
              row.netProfit,
              row.totalNetProfit,
            ]
              .map((v) => {
                const text = String(v ?? "");
                return text.includes(",") ? `"${text}"` : text;
              })
              .join(","),
          );
        }
        lines.push("");
      } catch {
        // skip if error on single settlement
      }
    }

    return `\uFEFF${lines.join("\n")}`;
  }

  /**
   * For backwards compatibility with older single settlement commit
   */
  static async commitSingleSettlement(input: {
    weaverUserId: number;
    returnIds?: number[];
    yarnGivenIds?: number[];
    paymentMethod?: string;
    notes?: string;
    recordedByUserId: number;
    overrides?: LineOverride[];
    autoPay?: boolean;
    expectedNetSettlement?: number;
  }) {
    const returnIds = input.returnIds ?? [];
    if (returnIds.length === 0) {
      throw new ValidationError("At least one returnId is required");
    }

    const returns = await prisma.fabricReturn.findMany({
      where: { returnId: { in: returnIds } },
      include: {
        workOrder: {
          select: { zigId: true, weaverUserId: true, settlementId: true, status: true },
        },
      },
    });
    if (returns.length !== returnIds.length) {
      throw new NotFoundError("One or more fabric returns were not found");
    }

    const zigIds = new Set<string>();
    for (const row of returns) {
      const order = row.workOrder;
      if (order.weaverUserId !== input.weaverUserId) {
        throw new ValidationError(
          `Return ${row.returnId} does not belong to weaver ${input.weaverUserId}`,
        );
      }
      if (order.settlementId !== null || order.status === "reconciled") {
        throw new ConflictError(
          `Return ${row.returnId} belongs to a work order that is already settled`,
        );
      }
      if (order.status !== "returned") {
        throw new ConflictError(`Work order ${order.zigId} is not returned yet`);
      }
      zigIds.add(order.zigId);
    }

    const yarnGivenIds = input.yarnGivenIds ?? [];
    if (yarnGivenIds.length > 0) {
      const yarnRows = await prisma.yarnGiven.findMany({
        where: { yarnGivenId: { in: yarnGivenIds } },
        include: {
          workOrder: {
            select: { zigId: true, weaverUserId: true, settlementId: true, status: true },
          },
        },
      });
      if (yarnRows.length !== yarnGivenIds.length) {
        throw new NotFoundError("One or more yarn given records were not found");
      }
      for (const row of yarnRows) {
        const order = row.workOrder;
        if (order.weaverUserId !== input.weaverUserId) {
          throw new ValidationError(
            `Yarn given ${row.yarnGivenId} does not belong to weaver ${input.weaverUserId}`,
          );
        }
        if (order.settlementId !== null || order.status === "reconciled") {
          throw new ConflictError(
            `Yarn given ${row.yarnGivenId} belongs to a work order that is already settled`,
          );
        }
        if (order.status !== "returned") {
          throw new ConflictError(`Work order ${order.zigId} is not returned yet`);
        }
        zigIds.add(order.zigId);
      }
    }

    return this.commitBatch(
      {
        includeZigIds: [...zigIds],
        overrides: input.overrides,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        autoPay: input.autoPay === true,
        expectedNetSettlement: input.expectedNetSettlement,
      },
      input.recordedByUserId,
    );
  }

  /**
   * Override the quality deduction of one fabric return.
   *
   * `deductionPerPiece` is the canonical field. `deductionAmount` is kept as a
   * legacy alias and is also interpreted as a per-piece value (the same unit
   * used by settlement previews).
   */
  static async overrideLine(
    returnId: number,
    data: { deductionPerPiece?: number; deductionAmount?: number; reason: string },
    actorUserId: number,
  ) {
    const perPiece = data.deductionPerPiece ?? data.deductionAmount;
    if (perPiece === undefined || !Number.isFinite(perPiece) || perPiece < 0) {
      throw new ValidationError("A non-negative deduction per piece is required");
    }

    const returnRecord = await prisma.fabricReturn.findUnique({
      where: { returnId },
      include: { workOrder: true },
    });
    if (!returnRecord) throw new NotFoundError(`Return ${returnId} not found`);
    if (
      returnRecord.workOrder.settlementId !== null ||
      returnRecord.workOrder.status === "reconciled"
    ) {
      throw new ConflictError("Cannot override a deduction on a settled fabric return");
    }
    if (perPiece > Number(returnRecord.unitPrice)) {
      throw new ValidationError(
        `Deduction per piece (${perPiece}) cannot exceed the fabric unit price (${returnRecord.unitPrice})`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const deductionAmount = roundCurrency(perPiece * returnRecord.quantityReturned);
      const deductions = [
        { factor: "manual_override", perPiece, remark: data.reason },
      ];

      const updated = await tx.fabricReturn.update({
        where: { returnId },
        data: {
          deductionAmount,
          deductions: deductions as any,
          remark: data.reason,
        },
      });

      // The work-order balance must stay in sync with the override.
      await WorkOrderService.recalculateAndSaveNetPayable(returnRecord.zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return.override",
          entityType: "fabric_return",
          entityId: returnId,
          details: { deductionPerPiece: perPiece, deductionAmount, ...data },
        },
        tx,
      );

      return updated;
    });
  }
}
