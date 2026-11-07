import type { Request, Response, NextFunction } from "express";
import { UserService } from "../../application/services/user.service.js";
import { StockService } from "../../application/services/stock.service.js";
import { DirectTransactionService } from "../../application/services/direct-transaction.service.js";
import { AbacService } from "../../application/security/abac.service.js";

export class MerchantPortalController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const [user, balance] = await Promise.all([
        UserService.getUserById(userId),
        UserService.getUserBalance(userId),
      ]);

      res.json({
        ...user,
        balance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCatalog(req: Request, res: Response, next: NextFunction) {
    try {
      // maskInternalPrices = true strips weaverRate and supplier costs
      const catalog = await StockService.getAvailableFabrics(true);
      res.json(catalog);
    } catch (error) {
      next(error);
    }
  }

  static async getMyTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await DirectTransactionService.listTransactions({
        merchantUserId: userId,
      });

      // Mask internal rates on lines
      const sanitized = result.transactions.map((t: any) => ({
        ...t,
        lines: t.lines?.map((l: any) => AbacService.maskForRole(req.user?.roles ?? [], l)),
      }));

      res.json({ transactions: sanitized, total: result.total });
    } catch (error) {
      next(error);
    }
  }

  static async getMyTransactionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const txn = await DirectTransactionService.getTransaction(id);

      AbacService.enforceMerchantOwnership(
        { userId: req.user!.userId, username: req.user!.username, roles: req.user!.roles },
        { entityType: "direct_transaction", merchantUserId: txn.merchantUserId },
      );

      const sanitized = {
        ...txn,
        lines: txn.lines.map((l: any) => AbacService.maskForRole(req.user?.roles ?? [], l)),
      };

      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  }
}
