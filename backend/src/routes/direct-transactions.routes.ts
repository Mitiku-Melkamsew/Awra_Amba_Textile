import { DirectTxnStatus, DirectTxnType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  createDirectTransaction,
  recordDirectTransactionPayment,
} from "../services/direct-transaction.service.js";

export const directTransactionsRouter = Router();

directTransactionsRouter.use(authenticate, requireAdmin);

const lineSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  yarnVariantId: z.number().int().positive().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  description: z.string().max(200).optional(),
});

const createDirectTxnSchema = z.object({
  type: z.nativeEnum(DirectTxnType),
  weaverUserId: z.number().int().positive().optional(),
  merchantUserId: z.number().int().positive().optional(),
  transactionDate: z.string().datetime().optional().or(z.string()),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
  initialPaymentAmount: z.number().min(0).optional(),
  paymentMethod: z.string().max(30).optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
});

// GET /api/v1/direct-transactions
directTransactionsRouter.get("/", async (req, res, next) => {
  try {
    const type = req.query.type as DirectTxnType | undefined;
    const status = req.query.status as DirectTxnStatus | undefined;
    const weaverUserId = req.query.weaverUserId ? Number(req.query.weaverUserId) : undefined;
    const merchantUserId = req.query.merchantUserId ? Number(req.query.merchantUserId) : undefined;

    const rows = await prisma.directTransaction.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        ...(weaverUserId ? { weaverUserId } : {}),
        ...(merchantUserId ? { merchantUserId } : {}),
      },
      include: {
        weaver: { select: { userId: true, fullName: true, username: true } },
        merchant: { select: { userId: true, fullName: true, username: true } },
        lines: {
          include: {
            fabricVariant: { include: { fabric: true, warpColor: true, weftColor: true, design: true } },
            yarnVariant: { include: { yarn: true, color: true, supplier: true } },
          },
        },
        payments: { orderBy: { paymentDate: "asc" } },
        createdBy: { select: { username: true } },
      },
      orderBy: { transactionDate: "desc" },
    });

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/direct-transactions/:id
directTransactionsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const txn = await prisma.directTransaction.findUnique({
      where: { transactionId: id },
      include: {
        weaver: { select: { userId: true, fullName: true, username: true, phone: true } },
        merchant: { select: { userId: true, fullName: true, username: true, phone: true } },
        lines: {
          include: {
            fabricVariant: { include: { fabric: true, warpColor: true, weftColor: true, design: true } },
            yarnVariant: { include: { yarn: true, color: true, supplier: true } },
          },
        },
        payments: { orderBy: { paymentDate: "asc" } },
        createdBy: { select: { username: true } },
      },
    });

    if (!txn) {
      res.status(404).json({ error: "Direct transaction not found" });
      return;
    }

    res.json(txn);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/direct-transactions
directTransactionsRouter.post("/", async (req, res, next) => {
  try {
    const body = createDirectTxnSchema.parse(req.body);
    const txn = await createDirectTransaction({
      type: body.type,
      weaverUserId: body.weaverUserId,
      merchantUserId: body.merchantUserId,
      transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
      notes: body.notes,
      createdByUserId: req.user!.userId,
      lines: body.lines,
      initialPaymentAmount: body.initialPaymentAmount,
      paymentMethod: body.paymentMethod,
    });

    res.status(201).json(txn);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/direct-transactions/:id/payments
directTransactionsRouter.post("/:id/payments", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = paymentSchema.parse(req.body);
    const result = await recordDirectTransactionPayment({
      transactionId: id,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      recordedByUserId: req.user!.userId,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/direct-transactions/:id/payments
directTransactionsRouter.get("/:id/payments", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payments = await prisma.directTransactionPayment.findMany({
      where: { transactionId: id },
      orderBy: { paymentDate: "asc" },
      include: {
        recordedBy: { select: { username: true } },
      },
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
});
