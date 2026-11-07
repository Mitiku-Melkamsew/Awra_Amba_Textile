import { DirectTxnType, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import {
  buildHisabReport,
  buildHisabReportByPaymentId,
  hisabToCsv,
} from "../../services/hisab-report.service.js";
import { NotFoundError } from "../../domain/errors/domain-errors.js";

export class ReportService {
  static async listSettlementPayments() {
    const payments = await prisma.settlementPayment.findMany({
      orderBy: [{ paymentDate: "desc" }, { settlementPaymentId: "desc" }],
      take: 500,
      include: {
        settlement: {
          include: { weaver: { select: { userId: true, fullName: true } } },
        },
      },
    });

    return payments.map((payment) => {
      const [firstName = "", ...lastName] = payment.settlement.weaver.fullName.split(" ");
      return {
        paymentId: payment.settlementPaymentId,
        settlementId: payment.settlementId,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate,
        weaver: {
          weaverId: payment.settlement.weaver.userId,
          firstName,
          lastName: lastName.join(" "),
        },
      };
    });
  }

  /**
   * Generates a HISAB-5 structured statement for a given settlement ID
   */
  static async getHisabStatement(settlementId: number) {
    const report = await buildHisabReport(settlementId);
    if (!report) {
      throw new NotFoundError(`Settlement report for ID ${settlementId} not found`);
    }
    return report;
  }

  /**
   * Generates a CSV export of the HISAB statement
   */
  static async exportHisabCsv(settlementId: number): Promise<string> {
    const report = await this.getHisabStatement(settlementId);
    return hisabToCsv(report);
  }

  static async getPaymentHisabStatement(paymentId: number) {
    const report = await buildHisabReportByPaymentId(paymentId);
    if (!report) throw new NotFoundError(`Payment report for ID ${paymentId} not found`);
    return report;
  }

  static async exportPaymentHisabCsv(paymentId: number): Promise<string> {
    const report = await this.getPaymentHisabStatement(paymentId);
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
      select: { userId: true, fullName: true, username: true, phone: true },
      orderBy: { fullName: "asc" },
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
        fullName: w.fullName,
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
      select: { userId: true, fullName: true, username: true, phone: true },
      orderBy: { fullName: "asc" },
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
        fullName: m.fullName,
        username: m.username,
        phone: m.phone,
        outstandingReceivable: Number(outstandingReceivable.toFixed(2)),
      });
    }

    return report;
  }
}
