import { DirectTxnType, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { formatUserFullName } from "../../utils/user-name.js";
import {
  buildHisabReportByPaymentId,
  buildHisabReportBySettlementId,
  hisabToCsv,
} from "./hisab-report.service.js";

export class ReportService {
  static async listSettlementPayments() {
    const payments = await prisma.settlementPayment.findMany({
      orderBy: [{ paymentDate: "desc" }, { settlementPaymentId: "desc" }],
      take: 500,
      include: {
        settlement: {
          include: { weaver: { select: { userId: true, firstName: true, lastName: true } } },
        },
      },
    });

    return payments.map((payment) => ({
      paymentId: payment.settlementPaymentId,
      settlementId: payment.settlementId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      weaver: {
        weaverUserId: payment.settlement.weaver.userId,
        userId: payment.settlement.weaver.userId,
        firstName: payment.settlement.weaver.firstName,
        lastName: payment.settlement.weaver.lastName,
        fullName: formatUserFullName(payment.settlement.weaver),
      },
    }));
  }

  /**
   * HISAB statement addressed by settlement ID.
   */
  static async getSettlementHisab(settlementId: number) {
    return buildHisabReportBySettlementId(settlementId);
  }

  static async exportSettlementHisabCsv(settlementId: number): Promise<string> {
    const report = await this.getSettlementHisab(settlementId);
    return hisabToCsv(report);
  }

  /**
   * HISAB receipt addressed by payment ID.
   */
  static async getPaymentHisab(paymentId: number) {
    return buildHisabReportByPaymentId(paymentId);
  }

  static async exportPaymentHisabCsv(paymentId: number): Promise<string> {
    const report = await this.getPaymentHisab(paymentId);
    return hisabToCsv(report);
  }

  /**
   * Generates the enterprise financial summary (Revenue, Yarn Procurement Expenses, Weaver Payouts, Net Margin)
   */
  static async getFinancialSummary(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
    }

    // 1. Direct commercial sales to merchants (Gross Revenue)
    const merchantSales = await prisma.directTransaction.aggregate({
      where: {
        type: DirectTxnType.fabric_sale_to_merchant,
        status: { not: "cancelled" },
        transactionDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      _sum: { totalAmount: true, amountPaid: true },
    });

    // 2. Direct yarn sales to weavers
    const yarnSales = await prisma.directTransaction.aggregate({
      where: {
        type: DirectTxnType.yarn_sale_to_weaver,
        status: { not: "cancelled" },
        transactionDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      _sum: { totalAmount: true, amountPaid: true },
    });

    // 3. Yarn procurement expenses (Paid supplier yarn purchases)
    const yarnPurchases = await prisma.yarnPurchase.findMany({
      where: {
        purchaseDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      include: { lines: true },
    });
    const totalYarnProcurementExpense = yarnPurchases.reduce((sum, p) => {
      return (
        sum +
        p.lines.reduce((lineSum, l) => lineSum + Number(l.quantity) * Number(l.unitPrice), 0)
      );
    }, 0);

    // 4. Weaver settlement payouts (actual disbursed SettlementPayment rows, including partial payouts)
    const settlementPayments = await prisma.settlementPayment.aggregate({
      where: {
        settlement: { status: { not: "cancelled" } },
        paymentDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      _sum: { amount: true },
    });
    const totalSettlementPayouts = Number(settlementPayments._sum.amount ?? 0);

    // 5. Direct fabric purchases from weavers
    const weaverDirectPurchases = await prisma.directTransaction.aggregate({
      where: {
        type: DirectTxnType.fabric_purchase_from_weaver,
        status: { not: "cancelled" },
        transactionDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      _sum: { totalAmount: true, amountPaid: true },
    });

    const grossCommercialRevenue =
      Number(merchantSales._sum.totalAmount ?? 0) + Number(yarnSales._sum.totalAmount ?? 0);
    const totalExpenses =
      totalYarnProcurementExpense +
      totalSettlementPayouts +
      Number(weaverDirectPurchases._sum.totalAmount ?? 0);

    const netOperatingProfit = grossCommercialRevenue - totalExpenses;

    return {
      revenue: {
        merchantFabricSalesTotal: Number(merchantSales._sum.totalAmount ?? 0),
        merchantFabricSalesCollected: Number(merchantSales._sum.amountPaid ?? 0),
        weaverYarnSalesTotal: Number(yarnSales._sum.totalAmount ?? 0),
        weaverYarnSalesCollected: Number(yarnSales._sum.amountPaid ?? 0),
        grossCommercialRevenue: Number(grossCommercialRevenue.toFixed(2)),
      },
      expenses: {
        supplierYarnProcurementExpense: Number(totalYarnProcurementExpense.toFixed(2)),
        weaverSettlementPayouts: Number(totalSettlementPayouts.toFixed(2)),
        weaverDirectFabricPurchases: Number((weaverDirectPurchases._sum.totalAmount ?? 0).toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
      },
      profitability: {
        netOperatingProfit: Number(netOperatingProfit.toFixed(2)),
      },
      fabricSalesRevenue: Number(merchantSales._sum.totalAmount ?? 0),
      yarnSalesRevenue: Number(yarnSales._sum.totalAmount ?? 0),
      fabricPurchasesExpense: Number((weaverDirectPurchases._sum.totalAmount ?? 0).toFixed(2)),
      yarnProcurementExpense: Number(totalYarnProcurementExpense.toFixed(2)),
      weaverSettlementsExpense: Number(totalSettlementPayouts.toFixed(2)),
      netCashFlow: Number(netOperatingProfit.toFixed(2)),
    };
  }

  /**
   * Generates production volume & quality summary for a date range
   */
  static async getProductionSummary(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;
    }
    const hasRange = Object.keys(dateFilter).length > 0;

    const [workOrdersAssigned, workOrdersReturned, fabricReturnsAgg, yarnGivenAgg] =
      await Promise.all([
        prisma.workOrder.count({
          where: {
            status: { not: "cancelled" },
            dateIssued: hasRange ? dateFilter : undefined,
          },
        }),
        prisma.workOrder.count({
          where: {
            status: { in: ["returned", "reconciled"] },
            dateReturned: hasRange ? dateFilter : undefined,
          },
        }),
        prisma.fabricReturn.aggregate({
          where: {
            workOrder: { status: { not: "cancelled" } },
            dateReturned: hasRange ? dateFilter : undefined,
          },
          _sum: {
            quantityReturned: true,
            deductionAmount: true,
            grossFabricValue: true,
          },
        }),
        prisma.yarnGiven.aggregate({
          where: {
            workOrder: { status: { not: "cancelled" } },
            dateGiven: hasRange ? dateFilter : undefined,
          },
          _sum: { quantity: true },
        }),
      ]);

    return {
      periodStart: startDate ? startDate.toISOString() : null,
      periodEnd: endDate ? endDate.toISOString() : null,
      workOrdersAssigned,
      workOrdersReturned,
      fabricPiecesProduced: Number(fabricReturnsAgg._sum.quantityReturned ?? 0),
      yarnIssuedPieces: Math.round(Number(yarnGivenAgg._sum.quantity ?? 0)),
      grossFabricValueBirr: Number(Number(fabricReturnsAgg._sum.grossFabricValue ?? 0).toFixed(2)),
      totalQualityDeductionsBirr: Number(Number(fabricReturnsAgg._sum.deductionAmount ?? 0).toFixed(2)),
    };
  }

  /**
   * Accounts payable summary for all active weavers (batched, no N+1 queries)
   */
  static async getWeaversBalanceReport() {
    const [weavers, directPurchases, unsettledWorkOrders, activeWorkOrders, committedSettlements] =
      await Promise.all([
        prisma.user.findMany({
          where: {
            roles: { some: { role: UserRole.weaver } },
            isActive: true,
          },
          select: { userId: true, firstName: true, lastName: true, username: true, phone: true },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        }),
        prisma.directTransaction.findMany({
          where: {
            type: DirectTxnType.fabric_purchase_from_weaver,
            status: { not: "cancelled" },
            weaverUserId: { not: null },
          },
          select: { weaverUserId: true, totalAmount: true, amountPaid: true },
        }),
        prisma.workOrder.findMany({
          where: {
            status: "returned",
            settlementId: null,
          },
          select: { weaverUserId: true, netPayable: true },
        }),
        prisma.workOrder.findMany({
          where: {
            status: { in: ["assigned", "in_progress"] },
          },
          select: { weaverUserId: true, netPayable: true },
        }),
        prisma.settlement.findMany({
          where: {
            status: "committed",
          },
          select: {
            weaverUserId: true,
            netAmount: true,
            payments: { select: { amount: true } },
          },
        }),
      ]);

    const directPayableMap = new Map<number, number>();
    for (const p of directPurchases) {
      if (p.weaverUserId == null) continue;
      const remaining = Math.max(0, Number(p.totalAmount) - Number(p.amountPaid));
      if (remaining > 0) {
        directPayableMap.set(p.weaverUserId, (directPayableMap.get(p.weaverUserId) ?? 0) + remaining);
      }
    }

    const unsettledCountMap = new Map<number, number>();
    const unsettledPayableMap = new Map<number, number>();
    for (const wo of unsettledWorkOrders) {
      unsettledCountMap.set(wo.weaverUserId, (unsettledCountMap.get(wo.weaverUserId) ?? 0) + 1);
      const payable = Math.max(0, Number(wo.netPayable ?? 0));
      unsettledPayableMap.set(wo.weaverUserId, (unsettledPayableMap.get(wo.weaverUserId) ?? 0) + payable);
    }

    const activeCountMap = new Map<number, number>();
    const activeWipPayableMap = new Map<number, number>();
    for (const wo of activeWorkOrders) {
      activeCountMap.set(wo.weaverUserId, (activeCountMap.get(wo.weaverUserId) ?? 0) + 1);
      const payable = Math.max(0, Number(wo.netPayable ?? 0));
      activeWipPayableMap.set(wo.weaverUserId, (activeWipPayableMap.get(wo.weaverUserId) ?? 0) + payable);
    }

    const committedPayableMap = new Map<number, number>();
    for (const s of committedSettlements) {
      const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Math.max(0, Number(s.netAmount) - paid);
      if (remaining > 0) {
        committedPayableMap.set(s.weaverUserId, (committedPayableMap.get(s.weaverUserId) ?? 0) + remaining);
      }
    }

    return weavers.map((w) => {
      const directPurchasePayable = Number((directPayableMap.get(w.userId) ?? 0).toFixed(2));
      const unsettledReturnedZigsCount = unsettledCountMap.get(w.userId) ?? 0;
      const unsettledWorkOrderPayable = Number((unsettledPayableMap.get(w.userId) ?? 0).toFixed(2));
      const committedSettlementPayable = Number((committedPayableMap.get(w.userId) ?? 0).toFixed(2));
      const activeWorkOrdersCount = activeCountMap.get(w.userId) ?? 0;
      const estimatedPendingPayout = Number(
        (unsettledWorkOrderPayable + (activeWipPayableMap.get(w.userId) ?? 0)).toFixed(2),
      );
      const netPayableBalance = Number(
        (directPurchasePayable + unsettledWorkOrderPayable + committedSettlementPayable).toFixed(2),
      );

      return {
        weaverId: w.userId,
        weaverUserId: w.userId,
        firstName: w.firstName,
        lastName: w.lastName,
        fullName: formatUserFullName(w),
        username: w.username,
        phone: w.phone,
        directPurchasePayable,
        directSalesPayableBalance: directPurchasePayable,
        unsettledReturnedZigsCount,
        unsettledPiecesCount: unsettledReturnedZigsCount,
        activeWorkOrdersCount,
        estimatedPendingPayout,
        committedSettlementPayable,
        netPayableBalance,
      };
    });
  }

  /**
   * Accounts receivable summary for all merchants (batched, no N+1 queries)
   */
  static async getMerchantsBalanceReport() {
    const [merchants, sales] = await Promise.all([
      prisma.user.findMany({
        where: {
          roles: { some: { role: UserRole.merchant } },
          isActive: true,
        },
        select: { userId: true, firstName: true, lastName: true, username: true, phone: true },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.directTransaction.findMany({
        where: {
          type: DirectTxnType.fabric_sale_to_merchant,
          status: { not: "cancelled" },
          merchantUserId: { not: null },
        },
        select: { merchantUserId: true, totalAmount: true, amountPaid: true },
      }),
    ]);

    const receivableMap = new Map<number, number>();
    const unpaidCountMap = new Map<number, number>();

    for (const s of sales) {
      if (s.merchantUserId == null) continue;
      const remaining = Number(s.totalAmount) - Number(s.amountPaid);
      if (remaining > 0.005) {
        receivableMap.set(s.merchantUserId, (receivableMap.get(s.merchantUserId) ?? 0) + remaining);
        unpaidCountMap.set(s.merchantUserId, (unpaidCountMap.get(s.merchantUserId) ?? 0) + 1);
      }
    }

    return merchants.map((m) => {
      const outstandingReceivable = Number((receivableMap.get(m.userId) ?? 0).toFixed(2));
      return {
        merchantId: m.userId,
        merchantUserId: m.userId,
        firstName: m.firstName,
        lastName: m.lastName,
        fullName: formatUserFullName(m),
        username: m.username,
        phone: m.phone,
        outstandingReceivable,
        totalReceivableBalance: outstandingReceivable,
        unpaidSalesCount: unpaidCountMap.get(m.userId) ?? 0,
      };
    });
  }
}
