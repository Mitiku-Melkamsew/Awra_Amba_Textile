import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../application/services/user.service.js";
import { WorkOrderService } from "../../application/services/work-order.service.js";
import { DirectTransactionService } from "../../application/services/direct-transaction.service.js";
import { ReportService } from "../../application/services/report.service.js";
import { prisma } from "../../lib/prisma.js";
import { AbacService } from "../../application/security/abac.service.js";

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
          lines: true,
          yarnLines: true,
          payments: true,
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
        res.status(404).json({ error: "Settlement not found" });
        return;
      }

      AbacService.enforceWeaverOwnership(
        { userId: req.user!.userId, username: req.user!.username, roles: req.user!.roles },
        { entityType: "settlement", weaverUserId: settlement.weaverUserId },
      );

      const report = await ReportService.getHisabStatement(id);
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
