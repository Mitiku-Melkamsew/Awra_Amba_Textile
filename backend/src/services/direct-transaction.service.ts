import { DirectTxnStatus, DirectTxnType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { recordAudit } from "./audit.service.js";

export interface CreateDirectTxnLineInput {
  fabricVariantId?: number | null;
  yarnVariantId?: number | null;
  quantity: number;
  unitPrice: number;
  description?: string;
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
  // Validate counterparty
  if (
    input.type === "fabric_purchase_from_weaver" ||
    input.type === "yarn_sale_to_weaver"
  ) {
    if (!input.weaverUserId) {
      throw new Error("VALIDATION: weaverUserId is required for weaver direct transactions.");
    }
  } else if (input.type === "fabric_sale_to_merchant") {
    if (!input.merchantUserId) {
      throw new Error("VALIDATION: merchantUserId is required for merchant direct transactions.");
    }
  }

  if (!input.lines || input.lines.length === 0) {
    throw new Error("VALIDATION: At least one transaction line is required.");
  }

  // Validate line items & stock types
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
      (input.type === "fabric_purchase_from_weaver" || input.type === "fabric_sale_to_merchant") &&
      !hasFabric
    ) {
      throw new Error("VALIDATION: Fabric variant is required for fabric transactions.");
    }

    if (input.type === "yarn_sale_to_weaver" && !hasYarn) {
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
      const activePrice = await prisma.fabricPrice.findFirst({
        where: {
          fabricId: variant.fabricId,
          isActive: true,
          effectiveFrom: { lte: eventDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: eventDate } }],
        },
      });
      if (!activePrice) {
        throw new Error("VALIDATION: No active fabric price exists for the transaction date.");
      }
    } else {
      const variant = await prisma.yarnVariant.findUnique({
        where: { yarnVariantId: line.yarnVariantId! },
        include: { yarn: true },
      });
      if (!variant?.isActive || !variant.yarn.isActive) {
        throw new Error("VALIDATION: Inactive yarn catalog items cannot be used.");
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
      if (!activePrice) {
        throw new Error("VALIDATION: No active yarn price exists for the transaction date.");
      }
    }

    calculatedTotal += computeLineTotal(line.quantity, line.unitPrice);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create transaction header
    const initialPaid = input.initialPaymentAmount ? Number(input.initialPaymentAmount) : 0;
    if (initialPaid > calculatedTotal) {
      throw new Error("VALIDATION: Initial payment cannot exceed total transaction amount.");
    }

    const status = deriveDirectTxnStatus(calculatedTotal, initialPaid);

    const txn = await tx.directTransaction.create({
      data: {
        type: input.type,
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

    // 2. Create lines and adjust stock
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

      // Stock adjustment according to transaction type
      if (input.type === "fabric_purchase_from_weaver") {
        // Fabric stock increases
        await tx.fabricVariant.update({
          where: { fabricVariantId: line.fabricVariantId! },
          data: { stockSnapshot: { increment: line.quantity } },
        });
      } else if (input.type === "fabric_sale_to_merchant") {
        // Fabric stock decreases
        await tx.fabricVariant.update({
          where: { fabricVariantId: line.fabricVariantId! },
          data: { stockSnapshot: { decrement: line.quantity } },
        });
      } else if (input.type === "yarn_sale_to_weaver") {
        // Yarn stock decreases
        await tx.yarnVariant.update({
          where: { yarnVariantId: line.yarnVariantId! },
          data: { stockSnapshot: { decrement: line.quantity } },
        });
      }
    }

    // 3. Create initial payment record if provided
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

    await recordAudit(
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
    await recordAudit(
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
