import { prisma } from "../../lib/prisma.js";
import type { AbacSubject } from "../../domain/security/abac-policy.types.js";
import { NotFoundError } from "../../domain/errors/domain-errors.js";
import { AbacService } from "../security/abac.service.js";
import { UserService } from "./user.service.js";
import { ReportService } from "./report.service.js";

export class WeaverPortalService {
  static async getProfile(userId: number) {
    const [user, balance, activeOrdersCount] = await Promise.all([
      UserService.getUserById(userId),
      UserService.getUserBalance(userId),
      prisma.workOrder.count({
        where: { weaverUserId: userId, status: { in: ["assigned", "in_progress"] } },
      }),
    ]);

    return {
      ...user,
      activeOrdersCount,
      balance,
    };
  }

  static async getMySettlements(userId: number) {
    return prisma.settlement.findMany({
      where: { weaverUserId: userId },
      include: {
        payments: true,
        workOrders: {
          include: {
            fabricVariant: { include: { fabric: true } },
            fabricReturns: true,
            yarnGiven: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getMySettlementStatement(
    settlementId: number,
    subject: AbacSubject,
    format?: string,
  ): Promise<{ format: "csv"; csv: string } | { format: "json"; report: Awaited<ReturnType<typeof ReportService.getSettlementHisab>> }> {
    const settlement = await prisma.settlement.findUnique({
      where: { settlementId },
    });

    if (!settlement) {
      throw new NotFoundError(`Settlement ${settlementId} not found`);
    }

    AbacService.enforceWeaverOwnership(subject, {
      entityType: "settlement",
      weaverUserId: settlement.weaverUserId,
    });

    if (format === "csv") {
      const csv = await ReportService.exportSettlementHisabCsv(settlementId);
      return { format: "csv", csv };
    }

    const report = await ReportService.getSettlementHisab(settlementId);
    return { format: "json", report };
  }

  static async getMyPayments(userId: number) {
    const payments = await prisma.settlementPayment.findMany({
      where: {
        settlement: {
          weaverUserId: userId,
          status: { not: "cancelled" },
        },
      },
      include: {
        settlement: {
          select: {
            settlementId: true,
            batchId: true,
            status: true,
            netAmount: true,
          },
        },
      },
      orderBy: [{ paymentDate: "desc" }, { settlementPaymentId: "desc" }],
    });

    return payments.map((p) => ({
      paymentId: p.settlementPaymentId,
      settlementId: p.settlementId,
      batchId: p.settlement.batchId,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod ?? "Cash",
      notes: p.notes ?? null,
      settlementStatus: p.settlement.status,
    }));
  }

  static async getMyPaymentStatement(
    paymentId: number,
    subject: AbacSubject,
    format?: string,
  ): Promise<{ format: "csv"; csv: string } | { format: "json"; report: Awaited<ReturnType<typeof ReportService.getPaymentHisab>> }> {
    const payment = await prisma.settlementPayment.findUnique({
      where: { settlementPaymentId: paymentId },
      include: {
        settlement: {
          select: { weaverUserId: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }

    AbacService.enforceWeaverOwnership(subject, {
      entityType: "settlement",
      weaverUserId: payment.settlement.weaverUserId,
    });

    if (format === "csv") {
      const csv = await ReportService.exportPaymentHisabCsv(paymentId);
      return { format: "csv", csv };
    }

    const report = await ReportService.getPaymentHisab(paymentId);
    return { format: "json", report };
  }
}
