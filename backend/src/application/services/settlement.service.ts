import { prisma } from "../../lib/prisma.js";
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
  computeNetPayable,
  roundCurrency,
  type LineOverride,
} from "./calculation.service.js";

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
    const orders = await this.getEligibleWorkOrders(cutoffDate, includeZigIds);
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
    },
    actorUserId: number,
  ) {
    const cutoff = input.cutoffDate ? new Date(input.cutoffDate) : null;
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

    return prisma.$transaction(async (tx) => {
      const shouldPay = input.autoPay !== false; // Default to pay at commit time
      const committedAt = new Date();
      const paidAt = shouldPay ? committedAt : null;

      const batch = await tx.settlementBatch.create({
        data: {
          status: shouldPay ? "paid" : "committed",
          cutoffDate: cutoff,
          exceptionZigIds: includeZigIds,
          totalAmount: preview.grandTotal,
          amountPaid: shouldPay ? preview.grandTotal : 0,
          paymentMethod: input.paymentMethod ?? "cash",
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
            status: shouldPay ? "paid" : "draft",
            grossFabricValue: bundle.grossFabricValue,
            totalDeductions: bundle.totalDeductions,
            totalYarnCost: bundle.totalYarnCost,
            netAmount: bundle.netSettlement,
            notes: input.notes,
            createdByUserId: actorUserId,
            paidAt,
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

        // Link work orders directly to settlement
        await tx.workOrder.updateMany({
          where: { zigId: { in: bundle.zigIds } },
          data: {
            status: shouldPay ? "reconciled" : "returned",
            settlementId: settlement.settlementId,
            settlementBatchId: batch.batchId,
          },
        });

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
      include: { workOrders: true, batch: true },
    });
    if (!settlement) throw new NotFoundError(`Settlement ${settlementId} not found`);
    if (settlement.status === "cancelled") {
      throw new ConflictError("Settlement is already cancelled");
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

      // Adjust parent batch total
      await tx.settlementBatch.update({
        where: { batchId: settlement.batchId },
        data: {
          totalAmount: { decrement: settlement.netAmount },
          amountPaid: settlement.status === "paid" ? { decrement: settlement.netAmount } : undefined,
        },
      });

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
          totalCost: totalYarnCost,
        },
        fabric: {
          receivedQuantity: fabricPiecesReturned,
          totalWeight: totalFabricWeight,
          averageWeight: avgWeight,
          grossFabricValue: totalGrossFabric,
          deductionAmount: totalDeductions,
        },
        settlement: order.settlement
          ? {
              settlementId: order.settlement.settlementId,
              batchId: order.settlement.batchId,
              status: order.settlement.status,
              amount: Number(order.settlement.netAmount),
            }
          : null,
        isSettled: order.status === "reconciled",
      };
    });
  }

  /**
   * Pay an individual settlement
   */
  static async paySettlement(
    settlementId: number,
    data: { amount?: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.findUnique({
        where: { settlementId },
        include: { payments: true, workOrders: true },
      });
      if (!settlement) throw new NotFoundError(`Settlement ${settlementId} not found`);

      const alreadyPaid = settlement.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const balance = Math.max(0, Number(settlement.netAmount) - alreadyPaid);
      if (balance <= 0.005) {
        throw new ConflictError(`Settlement ${settlementId} has no payable balance`);
      }

      const amount = data.amount ?? balance;
      const payment = await tx.settlementPayment.create({
        data: {
          settlementId,
          amount,
          paymentMethod: data.paymentMethod ?? "cash",
          notes: data.notes,
          recordedByUserId: actorUserId,
        },
      });

      const paidTotal = alreadyPaid + amount;
      const isFullyPaid = paidTotal >= Number(settlement.netAmount) - 0.005;

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
          details: { amount, balanceAfter: Math.max(0, balance - amount) },
        },
        tx,
      );

      return payment;
    });
  }

  /**
   * Pay entire batch
   */
  static async payBatch(
    batchId: number,
    data: { amount?: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    const batch = await prisma.settlementBatch.findUnique({
      where: { batchId },
      include: { settlements: { select: { settlementId: true } } },
    });
    if (!batch) throw new NotFoundError(`Settlement batch ${batchId} not found`);

    const payments = [];
    for (const s of batch.settlements) {
      try {
        const p = await this.paySettlement(s.settlementId, data, actorUserId);
        payments.push(p);
      } catch {
        // ignore already paid settlements
      }
    }

    return {
      batchId,
      payments,
    };
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
  }) {
    // Find returned work orders for this weaver
    const orders = await prisma.workOrder.findMany({
      where: {
        weaverUserId: input.weaverUserId,
        status: "returned",
        settlementId: null,
      },
    });

    if (orders.length === 0) {
      throw new ConflictError("No returned work orders found for weaver");
    }

    return this.commitBatch(
      {
        includeZigIds: orders.map((o) => o.zigId),
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        autoPay: Boolean(input.paymentMethod),
      },
      input.recordedByUserId,
    );
  }

  /**
   * Override line stub for backwards compatibility
   */
  static async overrideLine(
    returnId: number,
    data: { deductionAmount: number; reason: string },
    actorUserId: number,
  ) {
    // Quality overrides now update the FabricReturn directly!
    const returnRecord = await prisma.fabricReturn.findUnique({
      where: { returnId },
    });
    if (!returnRecord) throw new NotFoundError(`Return ${returnId} not found`);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.fabricReturn.update({
        where: { returnId },
        data: {
          deductionAmount: data.deductionAmount,
          remark: data.reason,
        },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return.override",
          entityType: "fabric_return",
          entityId: returnId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }
}
