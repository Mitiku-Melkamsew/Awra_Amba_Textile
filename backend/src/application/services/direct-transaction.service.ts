import { DirectTxnStatus, DirectTxnType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import {
  createDirectTransaction as coreCreateDirectTxn,
  recordDirectTransactionPayment as coreRecordPayment,
  cancelDirectTransaction as coreCancelTxn,
  type CreateDirectTransactionInput,
} from "../../services/direct-transaction.service.js";
import { NotFoundError } from "../../domain/errors/domain-errors.js";

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
  const lines = (p.lines ?? []).map((l: any) => {
    const qty = Number(l.quantity);
    const unitPrice = Number(l.unitPrice);
    const lineTotal = Math.round(qty * unitPrice * 100) / 100;
    return {
      lineId: l.lineId,
      transactionId: p.purchaseId,
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
    transactionId: p.purchaseId,
    directTransactionId: p.purchaseId,
    type: "yarn_purchase",
    status: DirectTxnStatus.paid,
    totalAmount,
    amountPaid: totalAmount,
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
    payments: [
      {
        paymentId: p.purchaseId,
        transactionId: p.purchaseId,
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

  static async getTransaction(transactionId: number) {
    const txn = await prisma.directTransaction.findUnique({
      where: { transactionId },
      include: txnInclude,
    });

    if (txn) {
      return txn;
    }

    const purchase = await prisma.yarnPurchase.findUnique({
      where: { purchaseId: transactionId },
      include: yarnPurchaseInclude,
    });

    if (purchase) {
      return normalizeYarnPurchase(purchase);
    }

    throw new NotFoundError(`Transaction ${transactionId} not found`);
  }

  static async createTransaction(input: CreateDirectTransactionInput) {
    return coreCreateDirectTxn(input);
  }

  static async recordPayment(
    transactionId: number,
    data: { amount: number; paymentMethod?: string; notes?: string },
    actorUserId: number,
  ) {
    return coreRecordPayment({
      transactionId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      recordedByUserId: actorUserId,
    });
  }

  static async cancelTransaction(transactionId: number, actorUserId: number) {
    return coreCancelTxn(transactionId, actorUserId);
  }
}
