import { DirectTxnStatus, DirectTxnType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  cancelDirectTransaction,
  createDirectTransaction,
  recordDirectTransactionPayment,
} from "../services/direct-transaction.service.js";
import { resolveTransactionLine } from "../services/transaction-line-resolver.service.js";

export const directTransactionsRouter = Router();

directTransactionsRouter.use(authenticate, requireAdmin);

const lineInputSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  yarnVariantId: z.number().int().positive().optional(),
  fabricId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  warpColorId: z.number().int().positive().optional(),
  weftColorId: z.number().int().positive().optional(),
  designId: z.number().int().positive().optional().nullable(),
  yarnId: z.number().int().positive().optional(),
  yarnTypeId: z.number().int().positive().optional(),
  colorId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  description: z.string().max(200).optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
});

function formatDirectTxn(txn: any) {
  const weaverParts = txn.weaver?.fullName ? txn.weaver.fullName.split(" ") : [];
  const weaverFirst = weaverParts[0] || "";
  const weaverLast = weaverParts.slice(1).join(" ") || "";

  return {
    ...txn,
    transactionId: String(txn.transactionId),
    supplierId: txn.supplierId ?? null,
    weaverId: txn.weaverUserId ?? null,
    merchantId: txn.merchantUserId ?? null,
    totalAmount: String(txn.totalAmount),
    amountPaid: String(txn.amountPaid ?? "0"),
    deliveredAt: txn.transactionDate ?? txn.purchaseDate,
    createdAt: txn.transactionDate ?? txn.purchaseDate,
    weaver: txn.weaver
      ? {
          weaverId: txn.weaver.userId,
          firstName: weaverFirst,
          lastName: weaverLast,
          phone: txn.weaver.phone,
        }
      : null,
    merchant: txn.merchant
      ? {
          merchantId: txn.merchant.userId,
          companyName: txn.merchant.fullName,
          contactPhone: txn.merchant.phone ?? "",
        }
      : null,
    supplier: txn.supplier
      ? {
          supplierId: txn.supplier.supplierId,
          name: txn.supplier.name,
        }
      : null,
    lines: (txn.lines || []).map((l: any) => ({
      ...l,
      quantity: String(l.quantity),
      unitPrice: String(l.unitPrice),
      deliveredQuantity: String(l.quantity),
      yarnVariant: l.yarnVariant
        ? {
            ...l.yarnVariant,
            yarnType: { materialName: l.yarnVariant.yarn?.name ?? l.yarnVariant.sku },
          }
        : null,
      fabricVariant: l.fabricVariant
        ? {
            ...l.fabricVariant,
            product: l.fabricVariant.fabric
              ? {
                  productId: l.fabricVariant.fabric.fabricId,
                  name: l.fabricVariant.fabric.name,
                  category: "fabric",
                  standardLengthCm: l.fabricVariant.fabric.standardLengthCm,
                  standardWidthCm: l.fabricVariant.fabric.standardWidthCm,
                  standardWeightG: l.fabricVariant.fabric.standardWeightG,
                }
              : undefined,
          }
        : null,
    })),
    payments: (txn.payments || []).map((p: any) => ({
      ...p,
      installmentId: p.paymentId,
      amount: String(p.amount),
    })),
  };
}

// GET /api/v1/direct-transactions/next-id and /api/v1/transactions/next-id
directTransactionsRouter.get("/next-id", async (_req, res, next) => {
  try {
    const [dtCount, ypCount] = await Promise.all([
      prisma.directTransaction.count(),
      prisma.yarnPurchase.count(),
    ]);
    const nextNum = dtCount + ypCount + 1;
    res.json({ transactionId: `TXN-${String(nextNum).padStart(4, "0")}` });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/direct-transactions
directTransactionsRouter.get("/", async (req, res, next) => {
  try {
    const type = req.query.type as string | undefined;
    const status = req.query.status as DirectTxnStatus | undefined;
    const weaverUserId = req.query.weaverUserId ? Number(req.query.weaverUserId) : undefined;
    const merchantUserId = req.query.merchantUserId ? Number(req.query.merchantUserId) : undefined;

    const [rows, yarnPurchases] = await Promise.all([
      prisma.directTransaction.findMany({
        where: {
          ...(type && Object.values(DirectTxnType).includes(type as any) ? { type: type as DirectTxnType } : {}),
          ...(status ? { status } : {}),
          ...(weaverUserId ? { weaverUserId } : {}),
          ...(merchantUserId ? { merchantUserId } : {}),
        },
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
        orderBy: { transactionDate: "desc" },
      }),
      (!type || type === "yarn_purchase")
        ? prisma.yarnPurchase.findMany({
            include: {
              supplier: true,
              createdBy: { select: { username: true } },
              lines: {
                include: {
                  yarnVariant: { include: { yarn: true, color: true, supplier: true } },
                },
              },
            },
            orderBy: { purchaseDate: "desc" },
          })
        : [],
    ]);

    const formattedDt = rows.map(formatDirectTxn);
    const formattedYp = yarnPurchases.map((yp) => {
      const total = yp.lines.reduce(
        (sum, l) => sum + Number(l.quantity) * Number(l.unitPrice),
        0,
      );
      return formatDirectTxn({
        transactionId: `YP-${yp.purchaseId}`,
        type: "yarn_purchase",
        status: "completed",
        totalAmount: total,
        amountPaid: total,
        purchaseDate: yp.purchaseDate,
        supplier: yp.supplier,
        supplierId: yp.supplierId,
        createdBy: yp.createdBy,
        notes: yp.notes,
        lines: yp.lines.map((l) => ({
          lineId: l.lineId,
          yarnVariantId: l.yarnVariantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          yarnVariant: l.yarnVariant,
        })),
        payments: [],
      });
    });

    const all = [...formattedDt, ...formattedYp].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.json(all);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/direct-transactions/:id
directTransactionsRouter.get("/:id", async (req, res, next) => {
  try {
    const rawId = req.params.id;

    if (rawId.startsWith("YP-")) {
      const purchaseId = Number(rawId.replace("YP-", ""));
      const yp = await prisma.yarnPurchase.findUnique({
        where: { purchaseId },
        include: {
          supplier: true,
          createdBy: { select: { username: true } },
          lines: {
            include: {
              yarnVariant: { include: { yarn: true, color: true, supplier: true } },
            },
          },
        },
      });
      if (!yp) {
        res.status(404).json({ error: "Yarn purchase not found" });
        return;
      }
      const total = yp.lines.reduce(
        (sum, l) => sum + Number(l.quantity) * Number(l.unitPrice),
        0,
      );
      res.json(
        formatDirectTxn({
          transactionId: rawId,
          type: "yarn_purchase",
          status: "completed",
          totalAmount: total,
          amountPaid: total,
          purchaseDate: yp.purchaseDate,
          supplier: yp.supplier,
          supplierId: yp.supplierId,
          createdBy: yp.createdBy,
          notes: yp.notes,
          lines: yp.lines.map((l) => ({
            lineId: l.lineId,
            yarnVariantId: l.yarnVariantId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            yarnVariant: l.yarnVariant,
          })),
          payments: [],
        }),
      );
      return;
    }

    const numericId = Number(rawId.replace("TXN-", ""));
    if (isNaN(numericId)) {
      res.status(400).json({ error: "Invalid transaction ID format" });
      return;
    }

    const txn = await prisma.directTransaction.findUnique({
      where: { transactionId: numericId },
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

    res.json(formatDirectTxn(txn));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/direct-transactions
directTransactionsRouter.post("/", async (req, res, next) => {
  try {
    const rawType = req.body.type as string;
    const notes = req.body.notes as string | undefined;

    // Handle yarn procurement from supplier
    if (rawType === "yarn_purchase") {
      const supplierId = Number(req.body.supplierId ?? req.body.lines?.[0]?.supplierId);
      if (!supplierId) {
        throw new Error("VALIDATION: Supplier is required for yarn purchase.");
      }

      const rawLines = z.array(lineInputSchema).min(1).parse(req.body.lines);

      const result = await prisma.$transaction(async (tx) => {
        const resolvedLines = [];
        for (const line of rawLines) {
          const resolved = await resolveTransactionLine("yarn", { ...line, supplierId }, tx);
          resolvedLines.push({
            yarnVariantId: resolved.yarnVariantId!,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          });
          // Increment yarn stock snapshot
          await tx.yarnVariant.update({
            where: { yarnVariantId: resolved.yarnVariantId! },
            data: { stockSnapshot: { increment: line.quantity } },
          });
        }

        const purchase = await tx.yarnPurchase.create({
          data: {
            supplierId,
            notes,
            createdByUserId: req.user!.userId,
            lines: {
              create: resolvedLines.map((l) => ({
                yarnVariantId: l.yarnVariantId,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
              })),
            },
          },
          include: {
            supplier: true,
            lines: {
              include: {
                yarnVariant: { include: { yarn: true, color: true, supplier: true } },
              },
            },
          },
        });

        return purchase;
      });

      const total = result.lines.reduce(
        (sum, l) => sum + Number(l.quantity) * Number(l.unitPrice),
        0,
      );

      res.status(201).json(
        formatDirectTxn({
          transactionId: `YP-${result.purchaseId}`,
          type: "yarn_purchase",
          status: "completed",
          totalAmount: total,
          amountPaid: total,
          purchaseDate: result.purchaseDate,
          supplier: result.supplier,
          supplierId: result.supplierId,
          notes: result.notes,
          lines: result.lines.map((l) => ({
            lineId: l.lineId,
            yarnVariantId: l.yarnVariantId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            yarnVariant: l.yarnVariant,
          })),
          payments: [],
        }),
      );
      return;
    }

    // Direct Transactions
    let directType: DirectTxnType;
    if (rawType === "fabric_purchase" || rawType === "fabric_purchase_from_weaver") {
      directType = DirectTxnType.fabric_purchase_from_weaver;
    } else if (rawType === "fabric_sale" || rawType === "fabric_sale_to_merchant") {
      directType = DirectTxnType.fabric_sale_to_merchant;
    } else if (rawType === "yarn_sale" || rawType === "yarn_sale_to_weaver") {
      directType = DirectTxnType.yarn_sale_to_weaver;
    } else {
      throw new Error(`VALIDATION: Unsupported transaction type: ${rawType}`);
    }

    const weaverUserId = req.body.weaverUserId ?? req.body.weaverId ? Number(req.body.weaverUserId ?? req.body.weaverId) : undefined;
    const merchantUserId = req.body.merchantUserId ?? req.body.merchantId ? Number(req.body.merchantUserId ?? req.body.merchantId) : undefined;
    const rawLines = z.array(lineInputSchema).min(1).parse(req.body.lines);

    const isFabric =
      directType === DirectTxnType.fabric_purchase_from_weaver ||
      directType === DirectTxnType.fabric_sale_to_merchant;

    const resolvedLines = await prisma.$transaction(async (tx) => {
      const list = [];
      for (const line of rawLines) {
        const resolved = await resolveTransactionLine(isFabric ? "fabric" : "yarn", line, tx);
        list.push({
          fabricVariantId: resolved.fabricVariantId,
          yarnVariantId: resolved.yarnVariantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          description: line.description,
        });
      }
      return list;
    });

    const txn = await createDirectTransaction({
      type: directType,
      weaverUserId,
      merchantUserId,
      transactionDate: req.body.transactionDate ? new Date(req.body.transactionDate) : undefined,
      notes,
      createdByUserId: req.user!.userId,
      lines: resolvedLines,
      initialPaymentAmount: req.body.initialPaymentAmount ? Number(req.body.initialPaymentAmount) : undefined,
      paymentMethod: req.body.paymentMethod,
    });

    const fullTxn = await prisma.directTransaction.findUniqueOrThrow({
      where: { transactionId: txn.transactionId },
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

    res.status(201).json(formatDirectTxn(fullTxn));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/direct-transactions/:id/deliver and /transactions/:id/deliver
directTransactionsRouter.post("/:id/deliver", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const numericId = Number(rawId.replace("TXN-", ""));
    if (isNaN(numericId)) {
      res.json({ message: "Delivery confirmed." });
      return;
    }

    const txn = await prisma.directTransaction.findUnique({
      where: { transactionId: numericId },
      include: {
        weaver: { select: { userId: true, fullName: true, username: true, phone: true } },
        merchant: { select: { userId: true, fullName: true, username: true, phone: true } },
        lines: {
          include: {
            fabricVariant: { include: { fabric: true, warpColor: true, weftColor: true, design: true } },
            yarnVariant: { include: { yarn: true, color: true, supplier: true } },
          },
        },
        payments: true,
      },
    });

    if (!txn) {
      res.status(404).json({ error: "Direct transaction not found" });
      return;
    }

    res.json(formatDirectTxn(txn));
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/direct-transactions/:id/cancel and /transactions/:id/cancel
directTransactionsRouter.patch("/:id/cancel", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const numericId = Number(rawId.replace("TXN-", ""));
    if (isNaN(numericId)) {
      res.status(400).json({ error: "Invalid transaction ID format" });
      return;
    }

    const updated = await cancelDirectTransaction(numericId, req.user!.userId);
    res.json(formatDirectTxn(updated));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/direct-transactions/:id/cancel (support POST as well)
directTransactionsRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const numericId = Number(rawId.replace("TXN-", ""));
    if (isNaN(numericId)) {
      res.status(400).json({ error: "Invalid transaction ID format" });
      return;
    }

    const updated = await cancelDirectTransaction(numericId, req.user!.userId);
    res.json(formatDirectTxn(updated));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/direct-transactions/:id/payments
directTransactionsRouter.post("/:id/payments", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const numericId = Number(rawId.replace("TXN-", ""));
    if (isNaN(numericId)) {
      res.status(400).json({ error: "Invalid transaction ID format" });
      return;
    }

    const body = paymentSchema.parse(req.body);
    const result = await recordDirectTransactionPayment({
      transactionId: numericId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      recordedByUserId: req.user!.userId,
    });

    const fullTxn = await prisma.directTransaction.findUniqueOrThrow({
      where: { transactionId: numericId },
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

    res.status(201).json(formatDirectTxn(fullTxn));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/direct-transactions/:id/payments
directTransactionsRouter.get("/:id/payments", async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const numericId = Number(rawId.replace("TXN-", ""));
    if (isNaN(numericId)) {
      res.status(400).json({ error: "Invalid transaction ID format" });
      return;
    }

    const payments = await prisma.directTransactionPayment.findMany({
      where: { transactionId: numericId },
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
