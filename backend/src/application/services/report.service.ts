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

    // 4. Weaver settlement payouts (Paid settlements)
    const settlements = await prisma.settlement.aggregate({
      where: {
        status: "paid",
        paidAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      _sum: { netAmount: true, grossFabricValue: true, totalDeductions: true, totalYarnCost: true },
    });

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
      Number(settlements._sum.netAmount ?? 0) +
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
        weaverSettlementPayouts: Number((settlements._sum.netAmount ?? 0).toFixed(2)),
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
      weaverSettlementsExpense: Number((settlements._sum.netAmount ?? 0).toFixed(2)),
      netCashFlow: Number(netOperatingProfit.toFixed(2)),
    };
  }

  /**
   * Accounts payable summary for all active weavers
   */
  static async getWeaversBalanceReport() {
    const weavers = await prisma.user.findMany({
      where: {
        roles: { some: { role: UserRole.weaver } },
        isActive: true,
      },
      select: { userId: true, firstName: true, lastName: true, username: true, phone: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const report = [];
    for (const w of weavers) {
      // Direct purchase payables
      const purchases = await prisma.directTransaction.findMany({
        where: {
          weaverUserId: w.userId,
          type: DirectTxnType.fabric_purchase_from_weaver,
          status: { not: "cancelled" },
        },
        select: { totalAmount: true, amountPaid: true },
      });

      let directPayable = 0;
      for (const p of purchases) {
        const remaining = Number(p.totalAmount) - Number(p.amountPaid);
        if (remaining > 0) directPayable += remaining;
      }

      // Returned unsettled work orders
      const returnedZigs = await prisma.workOrder.count({
        where: { weaverUserId: w.userId, status: "returned" },
      });

      report.push({
        weaverUserId: w.userId,
        firstName: w.firstName,
        lastName: w.lastName,
        fullName: formatUserFullName(w),
        username: w.username,
        phone: w.phone,
        directPurchasePayable: Number(directPayable.toFixed(2)),
        unsettledReturnedZigsCount: returnedZigs,
      });
    }

    return report;
  }

  /**
   * Accounts receivable summary for all merchants
   */
  static async getMerchantsBalanceReport() {
    const merchants = await prisma.user.findMany({
      where: {
        roles: { some: { role: UserRole.merchant } },
        isActive: true,
      },
      select: { userId: true, firstName: true, lastName: true, username: true, phone: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const report = [];
    for (const m of merchants) {
      const sales = await prisma.directTransaction.findMany({
        where: {
          merchantUserId: m.userId,
          type: DirectTxnType.fabric_sale_to_merchant,
          status: { not: "cancelled" },
        },
        select: { totalAmount: true, amountPaid: true },
      });

      let outstandingReceivable = 0;
      for (const s of sales) {
        const remaining = Number(s.totalAmount) - Number(s.amountPaid);
        if (remaining > 0) outstandingReceivable += remaining;
      }

      report.push({
        merchantUserId: m.userId,
        firstName: m.firstName,
        lastName: m.lastName,
        fullName: formatUserFullName(m),
        username: m.username,
        phone: m.phone,
        outstandingReceivable: Number(outstandingReceivable.toFixed(2)),
      });
    }

    return report;
  }
}
