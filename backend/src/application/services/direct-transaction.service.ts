import { DirectTxnStatus, DirectTxnType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import { NotFoundError, ValidationError } from "../../domain/errors/domain-errors.js";

export interface CreateDirectTxnLineInput {
  fabricVariantId?: number | null;
  yarnVariantId?: number | null;
  quantity: number;
  unitPrice: number;
  description?: string | null;
}

export interface CreateDirectTransactionInput {
  type: DirectTxnType;
  weaverUserId?: number | null;
  merchantUserId?: number | null;
  transactionDate?: Date;
  notes?: string;
  createdByUserId: number;
  lines: CreateDirectTxnLineInput[];
  initialPaymentAmount?: number;
  paymentMethod?: string;
}

export function computeLineTotal(qty: number, price: number): number {
  return Math.round(qty * price * 100) / 100;
}

export function deriveDirectTxnStatus(totalAmount: number, amountPaid: number): DirectTxnStatus {
  if (amountPaid >= totalAmount - 0.001) return DirectTxnStatus.paid;
  if (amountPaid > 0.001) return DirectTxnStatus.partially_paid;
  return DirectTxnStatus.unpaid;
}

export async function createDirectTransaction(input: CreateDirectTransactionInput) {
  const resolvedType = input.type;

  if (resolvedType === DirectTxnType.fabric_purchase_from_weaver) {
    if (!input.weaverUserId) {
      throw new Error("VALIDATION: weaverUserId is required for weaver direct transactions.");
    }
    const weaver = await prisma.user.findUnique({ where: { userId: input.weaverUserId } });
    if (!weaver) throw new Error(`VALIDATION: Weaver user ${input.weaverUserId} not found.`);
    if (!weaver.isActive) throw new Error(`VALIDATION: Weaver user ${input.weaverUserId} is deactivated.`);
  } else if (resolvedType === DirectTxnType.yarn_sale_to_weaver) {
    if (!input.weaverUserId) {
      throw new Error("VALIDATION: weaverUserId is required for yarn_sale_to_weaver.");
    }
    const weaver = await prisma.user.findUnique({ where: { userId: input.weaverUserId } });
    if (!weaver) throw new Error(`VALIDATION: Weaver user ${input.weaverUserId} not found.`);
    if (!weaver.isActive) throw new Error(`VALIDATION: Weaver user ${input.weaverUserId} is deactivated.`);
  } else if (resolvedType === DirectTxnType.fabric_sale_to_merchant) {
    if (!input.merchantUserId) {
      throw new Error("VALIDATION: merchantUserId is required for fabric_sale_to_merchant.");
    }
    const merchant = await prisma.user.findUnique({ where: { userId: input.merchantUserId } });
    if (!merchant) throw new Error(`VALIDATION: Merchant user ${input.merchantUserId} not found.`);
    if (!merchant.isActive) throw new Error(`VALIDATION: Merchant user ${input.merchantUserId} is deactivated.`);
  }

  if (!input.lines || input.lines.length === 0) {
    throw new Error("VALIDATION: At least one transaction line is required.");
  }

  let calculatedTotal = 0;
  const eventDate = input.transactionDate ?? new Date();
  for (const line of input.lines) {
    if (line.quantity <= 0) {
      throw new Error("VALIDATION: Line quantity must be positive.");
    }
    if (line.unitPrice <= 0) {
      throw new Error("VALIDATION: Line unit price must be positive.");
    }
    const hasFabric = !!line.fabricVariantId;
    const hasYarn = !!line.yarnVariantId;
    if ((hasFabric && hasYarn) || (!hasFabric && !hasYarn)) {
      throw new Error("VALIDATION: Exactly one of fabricVariantId or yarnVariantId must be set.");
    }

    if (
      (resolvedType === DirectTxnType.fabric_purchase_from_weaver || resolvedType === DirectTxnType.fabric_sale_to_merchant) &&
      !hasFabric
    ) {
      throw new Error("VALIDATION: Fabric variant is required for fabric transactions.");
    }

    if (resolvedType === DirectTxnType.yarn_sale_to_weaver && !hasYarn) {
      throw new Error("VALIDATION: Yarn variant is required for yarn transactions.");
    }

    if (hasFabric) {
      const variant = await prisma.fabricVariant.findUnique({
        where: { fabricVariantId: line.fabricVariantId! },
        include: { fabric: true },
      });
      if (!variant?.isActive || !variant.fabric.isActive) {
        throw new Error("VALIDATION: Inactive fabric catalog items cannot be used.");
      }
      if (resolvedType === DirectTxnType.fabric_sale_to_merchant) {
        const currentStock = Number(variant.stockSnapshot ?? 0);
        if (currentStock < line.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Cannot sell ${line.quantity} pieces of fabric "${variant.sku}". Available on-hand stock is ${currentStock} pieces.`,
          );
        }
      }
      const activePrice = await prisma.fabricPrice.findFirst({
        where: {
          fabricId: variant.fabricId,
          isActive: true,
          effectiveFrom: { lte: eventDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: eventDate } }],
        },
      });
      if (!activePrice && (!line.unitPrice || line.unitPrice <= 0)) {
        throw new Error("VALIDATION: No active fabric price exists and valid unitPrice was not specified.");
      }
    } else {
      const variant = await prisma.yarnVariant.findUnique({
        where: { yarnVariantId: line.yarnVariantId! },
        include: { yarn: true },
      });
      if (!variant?.isActive || !variant.yarn.isActive) {
        throw new Error("VALIDATION: Inactive yarn catalog items cannot be used.");
      }
      if (resolvedType === DirectTxnType.yarn_sale_to_weaver) {
        const currentStock = Number(variant.stockSnapshot ?? 0);
        if (currentStock < line.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Cannot sell ${line.quantity} pieces of yarn "${variant.sku}". Available on-hand stock is ${currentStock} pieces.`,
          );
        }
      }
      const activePrice = await prisma.yarnPrice.findFirst({
        where: {
          yarnId: variant.yarnId,
          supplierId: variant.supplierId,
          isActive: true,
          effectiveFrom: { lte: eventDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: eventDate } }],
        },
      });
      if (!activePrice && (!line.unitPrice || line.unitPrice <= 0)) {
        throw new Error("VALIDATION: No active yarn price exists and valid unitPrice was not specified.");
      }
    }

    calculatedTotal += computeLineTotal(line.quantity, line.unitPrice);
  }

  return prisma.$transaction(async (tx) => {
    const initialPaid = input.initialPaymentAmount ? Number(input.initialPaymentAmount) : 0;
    if (initialPaid > calculatedTotal) {
      throw new Error("VALIDATION: Initial payment cannot exceed total transaction amount.");
    }

    const status = deriveDirectTxnStatus(calculatedTotal, initialPaid);

    const txn = await tx.directTransaction.create({
      data: {
        type: resolvedType,
        weaverUserId: input.weaverUserId,
        merchantUserId: input.merchantUserId,
        totalAmount: calculatedTotal,
        amountPaid: initialPaid,
        status,
        transactionDate: eventDate,
        createdByUserId: input.createdByUserId,
        notes: input.notes,
      },
    });

    for (const line of input.lines) {
      const lineTot = computeLineTotal(line.quantity, line.unitPrice);
      await tx.directTransactionLine.create({
        data: {
          transactionId: txn.transactionId,
          fabricVariantId: line.fabricVariantId,
          yarnVariantId: line.yarnVariantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: lineTot,
          description: line.description,
        },
      });

      if (resolvedType === DirectTxnType.fabric_purchase_from_weaver) {
        await tx.fabricVariant.update({
          where: { fabricVariantId: line.fabricVariantId! },
          data: { stockSnapshot: { increment: line.quantity } },
        });
      } else if (resolvedType === DirectTxnType.fabric_sale_to_merchant) {
        const current = await tx.fabricVariant.findUniqueOrThrow({
          where: { fabricVariantId: line.fabricVariantId! },
        });
        if (Number(current.stockSnapshot) < Number(line.quantity)) {
          throw new Error(
            `INSUFFICIENT_STOCK: Insufficient stock for fabric "${current.sku}". Available: ${current.stockSnapshot}, Requested: ${line.quantity}`,
          );
        }
        await tx.fabricVariant.update({
          where: { fabricVariantId: line.fabricVariantId! },
          data: { stockSnapshot: { decrement: line.quantity } },
        });
      } else if (resolvedType === DirectTxnType.yarn_sale_to_weaver) {
        const current = await tx.yarnVariant.findUniqueOrThrow({
          where: { yarnVariantId: line.yarnVariantId! },
        });
        if (Number(current.stockSnapshot) < Number(line.quantity)) {
          throw new Error(
            `INSUFFICIENT_STOCK: Insufficient stock for yarn "${current.sku}". Available: ${current.stockSnapshot}, Requested: ${line.quantity}`,
          );
        }
        await tx.yarnVariant.update({
          where: { yarnVariantId: line.yarnVariantId! },
          data: { stockSnapshot: { decrement: line.quantity } },
        });
      }
    }

    if (initialPaid > 0) {
      await tx.directTransactionPayment.create({
        data: {
          transactionId: txn.transactionId,
          amount: initialPaid,
          paymentMethod: input.paymentMethod,
          paymentDate: new Date(),
          recordedByUserId: input.createdByUserId,
          notes: "Initial payment upon transaction creation",
        },
      });
    }

    await AuditService.record(
      {
        actorUserId: input.createdByUserId,
        action: "direct_transaction.created",
        entityType: "direct_transaction",
        entityId: txn.transactionId,
        details: { type: input.type, totalAmount: calculatedTotal },
      },
      tx,
    );

    return tx.directTransaction.findUniqueOrThrow({
      where: { transactionId: txn.transactionId },
      include: {
        lines: true,
        payments: true,
        weaver: { select: { userId: true, fullName: true, username: true } },
        merchant: { select: { userId: true, fullName: true, username: true } },
      },
    });
  });
}

export async function recordDirectTransactionPayment(params: {
  transactionId: number;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  recordedByUserId: number;
}) {
  if (params.amount <= 0) {
    throw new Error("VALIDATION: Payment amount must be positive.");
  }

  return prisma.$transaction(async (tx) => {
    const txn = await tx.directTransaction.findUniqueOrThrow({
      where: { transactionId: params.transactionId },
      include: { payments: true },
    });

    if (txn.status === DirectTxnStatus.cancelled) {
      throw new Error("CONFLICT: Cannot record payment for a cancelled transaction.");
    }

    const currentPaid = Number(txn.amountPaid);
    const totalAmount = Number(txn.totalAmount);
    const newPaid = currentPaid + params.amount;

    if (newPaid > totalAmount + 0.001) {
      throw new Error(
        `VALIDATION: Payment of ${params.amount} exceeds remaining balance of ${totalAmount - currentPaid}.`,
      );
    }

    const newStatus = deriveDirectTxnStatus(totalAmount, newPaid);

    const payment = await tx.directTransactionPayment.create({
      data: {
        transactionId: txn.transactionId,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        paymentDate: new Date(),
        recordedByUserId: params.recordedByUserId,
        notes: params.notes,
      },
    });

    const updatedTxn = await tx.directTransaction.update({
      where: { transactionId: txn.transactionId },
      data: {
        amountPaid: newPaid,
        status: newStatus,
      },
      include: { payments: true, lines: true },
    });

    return { payment, transaction: updatedTxn };
  });
}

export async function cancelDirectTransaction(transactionId: number, actorUserId: number) {
  return prisma.$transaction(async (tx) => {
    const txn = await tx.directTransaction.findUniqueOrThrow({
      where: { transactionId },
      include: { lines: true, payments: true },
    });
    if (txn.status === DirectTxnStatus.cancelled) return txn;
    if (txn.payments.length > 0 || Number(txn.amountPaid) > 0) {
      throw new Error("CONFLICT: Paid direct transactions cannot be cancelled.");
    }

    for (const line of txn.lines) {
      if (txn.type === DirectTxnType.fabric_purchase_from_weaver) {
        const current = await tx.fabricVariant.findUniqueOrThrow({
          where: { fabricVariantId: line.fabricVariantId! },
        });
        if (Number(current.stockSnapshot) < Number(line.quantity)) {
          throw new Error(
            `INSUFFICIENT_STOCK: Cannot cancel transaction because current fabric stock (${current.stockSnapshot}) is less than quantity to reverse (${line.quantity}).`,
          );
        }
        await tx.fabricVariant.update({
          where: { fabricVariantId: line.fabricVariantId! },
          data: { stockSnapshot: { decrement: line.quantity } },
        });
      } else if (txn.type === DirectTxnType.fabric_sale_to_merchant) {
        await tx.fabricVariant.update({
          where: { fabricVariantId: line.fabricVariantId! },
          data: { stockSnapshot: { increment: line.quantity } },
        });
      } else {
        await tx.yarnVariant.update({
          where: { yarnVariantId: line.yarnVariantId! },
          data: { stockSnapshot: { increment: line.quantity } },
        });
      }
    }

    const cancelled = await tx.directTransaction.update({
      where: { transactionId },
      data: { status: DirectTxnStatus.cancelled },
      include: { lines: true, payments: true },
    });
    await AuditService.record(
      {
        actorUserId,
        action: "direct_transaction.cancelled",
        entityType: "direct_transaction",
        entityId: transactionId,
      },
      tx,
    );
    return cancelled;
  });
}

const txnInclude = {
  weaver: { select: { userId: true, username: true, fullName: true, phone: true } },
  merchant: { select: { userId: true, username: true, fullName: true, phone: true } },
  createdBy: { select: { userId: true, username: true, fullName: true } },
  lines: {
    include: {
      fabricVariant: {
        include: { fabric: true, warpColor: true, weftColor: true, design: true },
      },
      yarnVariant: {
        include: { yarn: true, color: true, supplier: true },
      },
    },
  },
  payments: {
    include: {
      recordedBy: { select: { userId: true, username: true, fullName: true } },
    },
    orderBy: { paymentDate: "asc" as const },
  },
};

const yarnPurchaseInclude = {
  supplier: true,
  lines: {
    include: {
      yarnVariant: {
        include: { yarn: true, color: true, supplier: true },
      },
    },
  },
  createdBy: { select: { userId: true, username: true, fullName: true } },
};

export function normalizeYarnPurchase(p: any) {
  const isCancelled = Boolean(p.notes && p.notes.includes("[CANCELLED]"));
  const txnId = `yp-${p.purchaseId}`;
  const lines = (p.lines ?? []).map((l: any) => {
    const qty = Number(l.quantity);
    const unitPrice = Number(l.unitPrice);
    const lineTotal = Math.round(qty * unitPrice * 100) / 100;
    return {
      lineId: l.lineId,
      transactionId: txnId,
      yarnVariantId: l.yarnVariantId,
      fabricVariantId: null,
      quantity: qty,
      unitPrice,
      lineTotal,
      description: l.yarnVariant?.yarn?.name
        ? `${l.yarnVariant.yarn.name} (${l.yarnVariant.color?.name ?? ""})`
        : "Raw Yarn",
      yarnVariant: l.yarnVariant,
      fabricVariant: null,
    };
  });
  const totalAmount = lines.reduce((acc: number, l: any) => acc + l.lineTotal, 0);

  return {
    transactionId: txnId,
    purchaseId: p.purchaseId,
    type: "yarn_purchase",
    status: isCancelled ? DirectTxnStatus.cancelled : DirectTxnStatus.paid,
    totalAmount,
    amountPaid: isCancelled ? 0 : totalAmount,
    transactionDate: p.purchaseDate,
    createdAt: p.purchaseDate,
    deliveredAt: p.purchaseDate,
    notes: p.notes,
    supplierId: p.supplierId,
    supplier: p.supplier,
    weaverUserId: null,
    merchantUserId: null,
    weaver: null,
    merchant: null,
    createdByUserId: p.createdByUserId,
    createdBy: p.createdBy,
    lines,
    payments: isCancelled
      ? []
      : [
          {
            paymentId: p.purchaseId,
            transactionId: txnId,
            amount: totalAmount,
            paymentMethod: "Supplier Invoice",
            paymentDate: p.purchaseDate,
            notes: "Direct procurement",
          },
        ],
  };
}

export class DirectTransactionService {
  static async listTransactions(filter: {
    type?: string;
    status?: DirectTxnStatus;
    weaverUserId?: number;
    merchantUserId?: number;
    actorUserId?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const isYarnPurchaseOnly = filter.type === "yarn_purchase";
    const excludeYarnPurchases =
      (filter.type && filter.type !== "yarn_purchase") ||
      filter.weaverUserId ||
      filter.merchantUserId;

    if (isYarnPurchaseOnly) {
      const [purchases, total] = await Promise.all([
        prisma.yarnPurchase.findMany({
          include: yarnPurchaseInclude,
          orderBy: { purchaseDate: "desc" },
          take: filter.limit ?? 100,
          skip: filter.offset ?? 0,
        }),
        prisma.yarnPurchase.count(),
      ]);
      return {
        transactions: purchases.map(normalizeYarnPurchase),
        total,
      };
    }

    const where: any = {};
    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.weaverUserId) where.weaverUserId = filter.weaverUserId;
    if (filter.merchantUserId) where.merchantUserId = filter.merchantUserId;

    if (filter.actorUserId) {
      where.OR = [
        { weaverUserId: filter.actorUserId },
        { merchantUserId: filter.actorUserId },
      ];
    }

    const [directTxns, directTotal] = await Promise.all([
      prisma.directTransaction.findMany({
        where,
        include: txnInclude,
        orderBy: { transactionDate: "desc" },
        take: filter.limit ?? 100,
        skip: filter.offset ?? 0,
      }),
      prisma.directTransaction.count({ where }),
    ]);

    if (excludeYarnPurchases) {
      return { transactions: directTxns, total: directTotal };
    }

    const [purchases, purchaseTotal] = await Promise.all([
      prisma.yarnPurchase.findMany({
        include: yarnPurchaseInclude,
        orderBy: { purchaseDate: "desc" },
        take: filter.limit ?? 100,
        skip: filter.offset ?? 0,
      }),
      prisma.yarnPurchase.count(),
    ]);

    const normalizedPurchases = purchases.map(normalizeYarnPurchase);
    const combined = [...directTxns, ...normalizedPurchases].sort((a: any, b: any) => {
      const dateA = new Date(a.transactionDate ?? a.createdAt).getTime();
      const dateB = new Date(b.transactionDate ?? b.createdAt).getTime();
      return dateB - dateA;
    });

    const limit = filter.limit ?? 100;
    const offset = filter.offset ?? 0;
    const paginated = combined.slice(offset, offset + limit);

    return {
      transactions: paginated,
      total: directTotal + purchaseTotal,
    };
  }

  static async getTransaction(transactionId: number | string, typeHint?: string) {
    const str = String(transactionId).trim();
    const isYarnPurchaseId =
      str.toLowerCase().startsWith("yp-") ||
      str.toLowerCase().startsWith("yp_") ||
      typeHint === "yarn_purchase";

    if (isYarnPurchaseId) {
      const purchaseId = Number(str.replace(/[^0-9]/g, ""));
      if (Number.isFinite(purchaseId)) {
        const purchase = await prisma.yarnPurchase.findUnique({
          where: { purchaseId },
          include: yarnPurchaseInclude,
        });
        if (purchase) {
          return normalizeYarnPurchase(purchase);
        }
      }
      throw new NotFoundError(`Yarn purchase ${transactionId} not found`);
    }

    const numId = Number(str);
    if (!Number.isNaN(numId)) {
      const txn = await prisma.directTransaction.findUnique({
        where: { transactionId: numId },
        include: txnInclude,
      });

      if (txn) {
        return txn;
      }

      const purchase = await prisma.yarnPurchase.findUnique({
        where: { purchaseId: numId },
        include: yarnPurchaseInclude,
      });

      if (purchase) {
        return normalizeYarnPurchase(purchase);
      }
    }

    throw new NotFoundError(`Transaction ${transactionId} not found`);
  }

  static async createTransaction(input: CreateDirectTransactionInput) {
    return createDirectTransaction(input);
  }

  static async recordPayment(
    transactionId: number | string,
    data: { amount: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    const str = String(transactionId).trim();
    if (str.toLowerCase().startsWith("yp-") || str.toLowerCase().startsWith("yp_")) {
      throw new ValidationError("Yarn purchases are settled in full upon receipt. Additional payments cannot be recorded.");
    }
    const numId = Number(str);
    return recordDirectTransactionPayment({
      transactionId: numId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      recordedByUserId: actorUserId,
    });
  }

  static async cancelTransaction(transactionId: number | string, actorUserId: number) {
    const str = String(transactionId).trim();
    if (str.toLowerCase().startsWith("yp-") || str.toLowerCase().startsWith("yp_")) {
      const purchaseId = Number(str.replace(/[^0-9]/g, ""));
      return prisma.$transaction(async (tx) => {
        const purchase = await tx.yarnPurchase.findUnique({
          where: { purchaseId },
          include: { lines: true, supplier: true },
        });
        if (!purchase) {
          throw new NotFoundError(`Yarn purchase ${purchaseId} not found`);
        }
        for (const line of purchase.lines) {
          await tx.yarnVariant.update({
            where: { yarnVariantId: line.yarnVariantId },
            data: { stockSnapshot: { decrement: line.quantity } },
          });
        }
        const updatedNotes = purchase.notes
          ? `${purchase.notes} [CANCELLED]`
          : "[CANCELLED]";
        const updatedPurchase = await tx.yarnPurchase.update({
          where: { purchaseId },
          data: { notes: updatedNotes },
          include: yarnPurchaseInclude,
        });
        await AuditService.record(
          {
            actorUserId,
            action: "procurement.cancelled",
            entityType: "yarn_purchase",
            entityId: purchaseId,
          },
          tx,
        );
        return normalizeYarnPurchase(updatedPurchase);
      });
    }

    const numId = Number(str);
    return cancelDirectTransaction(numId, actorUserId);
  }
}
