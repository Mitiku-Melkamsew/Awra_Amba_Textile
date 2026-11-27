import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../application/services/user.service.js";
import { WorkOrderService } from "../../application/services/work-order.service.js";
import { DirectTransactionService } from "../../application/services/direct-transaction.service.js";
import { ReportService } from "../../application/services/report.service.js";
import { prisma } from "../../lib/prisma.js";
import { AbacService } from "../../application/security/abac.service.js";
import { NotFoundError } from "../../domain/errors/domain-errors.js";

export class WeaverPortalController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const [user, balance, activeOrdersCount] = await Promise.all([
        UserService.getUserById(userId),
        UserService.getUserBalance(userId),
        prisma.workOrder.count({
          where: { weaverUserId: userId, status: { in: ["assigned", "in_progress"] } },
        }),
      ]);

      res.json({
        ...user,
        activeOrdersCount,
        balance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyWorkOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const status = req.query.status as any;
      const orders = await WorkOrderService.listWorkOrders({
        weaverUserId: userId,
        status,
      });
      res.json(orders);
    } catch (error) {
      next(error);
    }
  }

  static async getMyWorkOrderDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const zigId = String(req.params.zigId);
      const order = await WorkOrderService.getWorkOrder(zigId);

      AbacService.enforceWeaverOwnership(
        { userId: req.user!.userId, username: req.user!.username, roles: req.user!.roles },
        { entityType: "work_order", weaverUserId: order.weaverUserId },
      );

      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  static async getMySettlements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const settlements = await prisma.settlement.findMany({
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
      res.json(settlements);
    } catch (error) {
      next(error);
    }
  }

  static async getMySettlementStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const settlement = await prisma.settlement.findUnique({
        where: { settlementId: id },
      });

      if (!settlement) {
        throw new NotFoundError(`Settlement ${id} not found`);
      }

      AbacService.enforceWeaverOwnership(
        { userId: req.user!.userId, username: req.user!.username, roles: req.user!.roles },
        { entityType: "settlement", weaverUserId: settlement.weaverUserId },
      );

      if (req.query.format === "csv") {
        const csv = await ReportService.exportSettlementHisabCsv(id);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-SETTLEMENT-${id}.csv"`);
        res.send(csv);
        return;
      }

      const report = await ReportService.getSettlementHisab(id);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  static async getMyPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
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

      res.json(
        payments.map((p) => ({
          paymentId: p.settlementPaymentId,
          settlementId: p.settlementId,
          batchId: p.settlement.batchId,
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod ?? "Cash",
          notes: p.notes ?? null,
          settlementStatus: p.settlement.status,
        })),
      );
    } catch (error) {
      next(error);
    }
  }

  static async getMyPaymentStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = Number(req.params.id);
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

      AbacService.enforceWeaverOwnership(
        { userId: req.user!.userId, username: req.user!.username, roles: req.user!.roles },
        { entityType: "settlement", weaverUserId: payment.settlement.weaverUserId },
      );

      if (req.query.format === "csv") {
        const csv = await ReportService.exportPaymentHisabCsv(paymentId);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-PAYMENT-${paymentId}.csv"`);
        res.send(csv);
        return;
      }

      const report = await ReportService.getPaymentHisab(paymentId);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  static async getMyDirectTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const txns = await DirectTransactionService.listTransactions({
        weaverUserId: userId,
      });
      res.json(txns);
    } catch (error) {
      next(error);
    }
  }
}
