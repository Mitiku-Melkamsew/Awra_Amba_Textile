import { CommercialTxnType, PaymentTerms } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { resolveTransactionLine } from "../services/transaction-line-resolver.service.js";
import {
  computeTotalAmount,
  deriveTransactionStatus,
  expectedVariantField,
  generateNextTransactionId,
  refreshTransactionStatus,
  validateCounterparty,
} from "../services/transaction.service.js";

export const transactionsRouter = Router();

transactionsRouter.use(authenticate, requireAdmin);

const lineSchema = z.object({
  yarnVariantId: z.number().int().positive().optional(),
  fabricVariantId: z.number().int().positive().optional(),
  yarnTypeId: z.number().int().positive().optional(),
  colorId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  warpColorId: z.number().int().positive().optional(),
  weftColorId: z.number().int().positive().optional(),
  designId: z.number().int().positive().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  description: z.string().max(200).optional(),
});

const createSchema = z.object({
  transactionId: z.string().regex(/^txn-[\w-]+$/).optional(),
  type: z.nativeEnum(CommercialTxnType).refine((t) => t !== "weaver_payout", {
    message: "Weaver payouts are created automatically from settlement",
  }),
  paymentTerms: z.nativeEnum(PaymentTerms),
  supplierId: z.number().int().positive().optional(),
  weaverId: z.number().int().positive().optional(),
  merchantId: z.number().int().positive().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
});

const yarnInclude = { yarnType: true, color: true, supplier: true };
const fabricInclude = {
  product: true,
  warpColor: true,
  weftColor: true,
  design: true,
};

const detailInclude = {
  supplier: true,
  weaver: true,
  merchant: true,
  lines: {
    include: {
      yarnVariant: { include: yarnInclude },
      fabricVariant: { include: fabricInclude },
    },
  },
  payments: { orderBy: { paymentDate: "asc" as const } },
  createdBy: { select: { username: true } },
};

function validateLinesForType(
  type: CommercialTxnType,
  lines: z.infer<typeof lineSchema>[],
): void {
  const field = expectedVariantField(type);
  for (const line of lines) {
    if (field === "yarn") {
      const hasVariant = !!line.yarnVariantId;
      const hasCatalog = !!(line.yarnTypeId && line.colorId && line.supplierId);
      if (!hasVariant && !hasCatalog) {
        throw new Error("VALIDATION:Each yarn line needs a variant or type, color, and supplier.");
      }
    }
    if (field === "fabric") {
      const hasVariant = !!line.fabricVariantId;
      const hasCatalog = !!(line.productId && line.warpColorId && line.weftColorId);
      if (!hasVariant && !hasCatalog) {
        throw new Error("VALIDATION:Each fabric line needs a variant or product and colors.");
      }
    }
  }
}

transactionsRouter.get("/next-id", async (_req, res, next) => {
  try {
    const transactionId = await generateNextTransactionId();
    res.json({ transactionId });
  } catch (error) {
    next(error);
  }
});

transactionsRouter.get("/", async (req, res, next) => {
  try {
    const type = req.query.type as CommercialTxnType | undefined;
    const status = req.query.status as string | undefined;
    const rows = await prisma.commercialTransaction.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        supplier: true,
        weaver: true,
        merchant: true,
        lines: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

transactionsRouter.get("/:transactionId", async (req, res, next) => {
  try {
    const transactionId = String(req.params.transactionId);
    const row = await prisma.commercialTransaction.findUnique({
      where: { transactionId },
      include: detailInclude,
    });
    if (!row) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(row);
  } catch (error) {
    next(error);
  }
});

transactionsRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    validateCounterparty(body.type, body);
    validateLinesForType(body.type, body.lines);

    const transactionId = body.transactionId ?? (await generateNextTransactionId());
    const totalAmount = computeTotalAmount(body.lines);
    const status = deriveTransactionStatus({
      type: body.type,
      totalAmount,
      amountPaid: 0,
      deliveredAt: null,
      lines: body.lines.map((l) => ({ quantity: l.quantity, deliveredQuantity: 0 })),
    });

    const kind = expectedVariantField(body.type) as "yarn" | "fabric";
    const row = await prisma.$transaction(async (tx) => {
      const resolvedLines = [];
      for (const line of body.lines) {
        resolvedLines.push(await resolveTransactionLine(kind, line, tx));
      }

      return tx.commercialTransaction.create({
        data: {
          transactionId,
          type: body.type,
          status,
          paymentTerms: body.paymentTerms,
          supplierId: body.supplierId ?? null,
          weaverId: body.weaverId ?? null,
          merchantId: body.merchantId ?? null,
          totalAmount,
          amountPaid: 0,
          notes: body.notes,
          createdByUserId: req.user!.userId,
          lines: {
            create: resolvedLines.map((line) => ({
              yarnVariantId: line.yarnVariantId,
              fabricVariantId: line.fabricVariantId,
              yarnTypeId: line.yarnTypeId,
              colorId: line.colorId,
              supplierId: line.supplierId,
              productId: line.productId,
              warpColorId: line.warpColorId,
              weftColorId: line.weftColorId,
              designId: line.designId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              description: line.description,
            })),
          },
        },
        include: detailInclude,
      });
    });

    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
});

transactionsRouter.post("/:transactionId/deliver", async (req, res, next) => {
  try {
    const transactionId = String(req.params.transactionId);
    const txn = await prisma.commercialTransaction.findUnique({
      where: { transactionId },
      include: { lines: true },
    });
    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    if (txn.status === "cancelled" || txn.status === "completed") {
      res.status(400).json({ error: "Transaction cannot be delivered in current status" });
      return;
    }
    if (txn.type === "weaver_payout") {
      res.status(400).json({ error: "Payout transactions have no delivery step" });
      return;
    }

    await prisma.$transaction(
      txn.lines.map((line) =>
        prisma.commercialTransactionLine.update({
          where: { lineId: line.lineId },
          data: { deliveredQuantity: line.quantity },
        }),
      ),
    );

    const updated = await refreshTransactionStatus(transactionId);
    const full = await prisma.commercialTransaction.findUnique({
      where: { transactionId: updated.transactionId },
      include: detailInclude,
    });
    res.json(full);
  } catch (error) {
    next(error);
  }
});

transactionsRouter.post("/:transactionId/payments", async (req, res, next) => {
  try {
    const transactionId = String(req.params.transactionId);
    const body = paymentSchema.parse(req.body);

    const txn = await prisma.commercialTransaction.findUnique({
      where: { transactionId },
    });
    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    if (txn.status === "cancelled") {
      res.status(400).json({ error: "Cannot add payment to cancelled transaction" });
      return;
    }

    await prisma.commercialTransactionPayment.create({
      data: {
        transactionId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        recordedByUserId: req.user!.userId,
      },
    });

    await refreshTransactionStatus(transactionId);
    const full = await prisma.commercialTransaction.findUnique({
      where: { transactionId },
      include: detailInclude,
    });
    res.status(201).json(full);
  } catch (error) {
    next(error);
  }
});

transactionsRouter.patch("/:transactionId/cancel", async (req, res, next) => {
  try {
    const transactionId = String(req.params.transactionId);
    const txn = await prisma.commercialTransaction.findUnique({
      where: { transactionId },
      include: { lines: true },
    });
    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    if (txn.status === "completed") {
      res.status(400).json({ error: "Completed transactions cannot be cancelled" });
      return;
    }
    const hasDelivery = txn.lines.some((l) => Number(l.deliveredQuantity) > 0);
    if (hasDelivery) {
      res.status(400).json({ error: "Cannot cancel after delivery has been recorded" });
      return;
    }

    const updated = await prisma.commercialTransaction.update({
      where: { transactionId },
      data: { status: "cancelled" },
      include: detailInclude,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});