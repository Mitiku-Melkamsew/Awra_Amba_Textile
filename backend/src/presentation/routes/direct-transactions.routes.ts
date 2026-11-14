import { Router } from "express";
import { DirectTransactionController } from "../controllers/direct-transaction.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import {
  CreateDirectTransactionSchema,
  AddDirectTxnPaymentSchema,
  ListDirectTransactionsQuerySchema,
} from "../dtos/direct-transaction.dto.js";

export const directTransactionsRouter = Router();

directTransactionsRouter.use(authenticate);

directTransactionsRouter.get(
  "/",
  requireCapability(Capability.DIRECT_TRANSACTIONS_READ_ALL),
  validateQuery(ListDirectTransactionsQuerySchema),
  DirectTransactionController.list,
);

directTransactionsRouter.get(
  "/:id",
  requireCapability(Capability.DIRECT_TRANSACTIONS_READ_ALL),
  DirectTransactionController.getById,
);

directTransactionsRouter.post(
  "/",
  requireCapability(Capability.DIRECT_TRANSACTIONS_MANAGE),
  validateBody(CreateDirectTransactionSchema),
  DirectTransactionController.create,
);

directTransactionsRouter.post(
  "/:id/payments",
  requireCapability(Capability.DIRECT_TRANSACTIONS_MANAGE),
  validateBody(AddDirectTxnPaymentSchema),
  DirectTransactionController.recordPayment,
);

directTransactionsRouter.post(
  "/:id/cancel",
  requireCapability(Capability.DIRECT_TRANSACTIONS_MANAGE),
  DirectTransactionController.cancel,
);
