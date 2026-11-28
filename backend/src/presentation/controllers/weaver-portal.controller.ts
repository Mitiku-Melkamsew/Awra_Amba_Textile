import type { Request, Response, NextFunction } from "express";
import { WorkOrderService } from "../../application/services/work-order.service.js";
import { DirectTransactionService } from "../../application/services/direct-transaction.service.js";
import { WeaverPortalService } from "../../application/services/weaver-portal.service.js";
import { AbacService } from "../../application/security/abac.service.js";
import { numericParam } from "../http/params.js";
import { serializeWeaverProfile } from "../serializers/user.serializer.js";
import { serializeWorkOrder, serializeWorkOrderList } from "../serializers/work-order.serializer.js";
import { serializeSettlement } from "../serializers/settlement.serializer.js";
import { serializeDirectTransactionList } from "../serializers/direct-transaction.serializer.js";
import { serializeHisabReport, serializeWeaverPaymentItem } from "../serializers/report.serializer.js";

export class WeaverPortalController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await WeaverPortalService.getProfile(req.user!.userId);
      res.json(serializeWeaverProfile(profile));
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
      res.json(serializeWorkOrderList(orders));
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

      res.json(serializeWorkOrder(order));
    } catch (error) {
      next(error);
    }
  }

  static async getMySettlements(req: Request, res: Response, next: NextFunction) {
    try {
      const settlements = await WeaverPortalService.getMySettlements(req.user!.userId);
      res.json(settlements.map(serializeSettlement));
    } catch (error) {
      next(error);
    }
  }

  static async getMySettlementStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const id = numericParam(req);
      const subject = {
        userId: req.user!.userId,
        username: req.user!.username,
        roles: req.user!.roles,
      };
      const result = await WeaverPortalService.getMySettlementStatement(
        id,
        subject,
        req.query.format as string | undefined,
      );

      if (result.format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-SETTLEMENT-${id}.csv"`);
        res.send(result.csv);
        return;
      }

      res.json(serializeHisabReport(result.report));
    } catch (error) {
      next(error);
    }
  }

  static async getMyPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await WeaverPortalService.getMyPayments(req.user!.userId);
      res.json(payments.map(serializeWeaverPaymentItem));
    } catch (error) {
      next(error);
    }
  }

  static async getMyPaymentStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = numericParam(req);
      const subject = {
        userId: req.user!.userId,
        username: req.user!.username,
        roles: req.user!.roles,
      };
      const result = await WeaverPortalService.getMyPaymentStatement(
        paymentId,
        subject,
        req.query.format as string | undefined,
      );

      if (result.format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="HISAB-PAYMENT-${paymentId}.csv"`);
        res.send(result.csv);
        return;
      }

      res.json(serializeHisabReport(result.report));
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
      res.json(serializeDirectTransactionList(txns));
    } catch (error) {
      next(error);
    }
  }
}
