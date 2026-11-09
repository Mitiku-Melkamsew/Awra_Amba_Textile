import { DirectTxnStatus, DirectTxnType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AuditService } from "../application/services/audit.service.js";
import { resolveFabricVariant, resolveYarnVariant } from "./variant.service.js";

export interface CreateDirectTxnLineInput {
  fabricVariantId?: number | null;
  yarnVariantId?: number | null;
  productId?: number | null;
  fabricId?: number | null;
  warpColorId?: number | null;
  weftColorId?: number | null;
  designId?: number | null;
  yarnId?: number | null;
  yarnTypeId?: number | null;
  colorId?: number | null;
  supplierId?: number | null;
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
  let resolvedType = input.type;
  if ((resolvedType as any) === "fabric_sale") resolvedType = DirectTxnType.fabric_sale_to_merchant;
  if ((resolvedType as any) === "yarn_sale") resolvedType = DirectTxnType.yarn_sale_to_weaver;
  if ((resolvedType as any) === "fabric_purchase") resolvedType = DirectTxnType.fabric_purchase_from_weaver;

  const isSale = resolvedType === DirectTxnType.fabric_sale_to_merchant || resolvedType === DirectTxnType.yarn_sale_to_weaver;

  // Validate counterparty
  if (resolvedType === DirectTxnType.fabric_purchase_from_weaver) {
    if (!input.weaverUserId) {
      throw new Error("VALIDATION: weaverUserId is required for weaver direct transactions.");
    }
  } else if (resolvedType === DirectTxnType.yarn_sale_to_weaver) {
    if (!input.weaverUserId && !input.merchantUserId) {
      throw new Error("VALIDATION: A buyer (weaver or merchant) is required for yarn sales.");
    }
  } else if (resolvedType === DirectTxnType.fabric_sale_to_merchant) {
    if (!input.merchantUserId && !input.weaverUserId) {
      throw new Error("VALIDATION: merchantUserId is required for merchant direct transactions.");
    }
  }

  if (!input.lines || input.lines.length === 0) {
    throw new Error("VALIDATION: At least one transaction line is required.");
  }

  // Auto-resolve variants if catalog combinations are provided
  for (const line of input.lines) {
    if (!line.fabricVariantId && (line.fabricId || line.productId)) {
      const fId = Number(line.fabricId ?? line.productId);
      let warpColorId = line.warpColorId ? Number(line.warpColorId) : undefined;
      let weftColorId = line.weftColorId ? Number(line.weftColorId) : undefined;
      let designId = line.designId ? Number(line.designId) : undefined;
      if (!warpColorId || !weftColorId) {
        const firstColor = await prisma.color.findFirst({ orderBy: { colorId: "asc" } });
        warpColorId = warpColorId ?? firstColor?.colorId ?? 1;
        weftColorId = weftColorId ?? firstColor?.colorId ?? 1;
      }
      if (isSale) {
        let defaultDesignId: number | undefined;
        if (!designId) {
          const firstDesign = await prisma.design.findFirst({ orderBy: { designId: "asc" } });
          defaultDesignId = firstDesign?.designId;
        }
        const existing = await prisma.fabricVariant.findFirst({
          where: {
            fabricId: fId,
            warpColorId,
            weftColorId,
            ...(designId ? { designId } : defaultDesignId ? { designId: defaultDesignId } : {}),
          },
        });
        if (!existing) {
          throw new Error("VALIDATION: Cannot sell a fabric combination that does not exist in inventory.");
        }
        line.fabricVariantId = existing.fabricVariantId;
      } else {
        const res = await resolveFabricVariant({
          fabricId: fId,
          warpColorId,
          weftColorId,
          designId,
        });
        line.fabricVariantId = res.variantId;
      }
    }

    if (!line.yarnVariantId && (line.yarnId || line.yarnTypeId)) {
      const yId = Number(line.yarnId ?? line.yarnTypeId);
      let cId = line.colorId ? Number(line.colorId) : undefined;
      if (!cId) {
        const firstColor = await prisma.color.findFirst({ orderBy: { colorId: "asc" } });
        cId = firstColor?.colorId ?? 1;
      }
      let sId = (line.supplierId ?? (input as any).supplierId) ? Number(line.supplierId ?? (input as any).supplierId) : undefined;
      if (!sId) {
        const firstSupplier = await prisma.supplier.findFirst({ orderBy: { supplierId: "asc" } });
        sId = firstSupplier?.supplierId ?? 1;
      }
      if (isSale) {
        const existing = await prisma.yarnVariant.findFirst({
          where: {
            yarnId: yId,
            colorId: cId,
            supplierId: sId,
          },
        });
        if (!existing) {
          throw new Error("VALIDATION: Cannot sell a yarn combination that does not exist in inventory.");
        }
        line.yarnVariantId = existing.yarnVariantId;
      } else {
        const res = await resolveYarnVariant({
          yarnId: yId,
          colorId: cId,
          supplierId: sId,
        });
        line.yarnVariantId = res.variantId;
      }
    }
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
    // 1. Create transaction header
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
      if (resolvedType === DirectTxnType.fabric_purchase_from_weaver) {
        // Fabric stock increases
        await tx.fabricVariant.update({
          where: { fabricVariantId: line.fabricVariantId! },
          data: { stockSnapshot: { increment: line.quantity } },
        });
      } else if (resolvedType === DirectTxnType.fabric_sale_to_merchant) {
        // Fabric stock decreases - prohibit negative stock
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
        // Yarn stock decreases - prohibit negative stock
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
