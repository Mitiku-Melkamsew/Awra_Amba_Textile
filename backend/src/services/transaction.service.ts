import type {
  CommercialTransaction,
  CommercialTransactionLine,
  CommercialTxnStatus,
  CommercialTxnType,
  PaymentTerms,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const PURCHASE_TYPES: CommercialTxnType[] = ["yarn_purchase", "fabric_purchase"];
const SALE_TYPES: CommercialTxnType[] = ["yarn_sale", "fabric_sale"];

export async function generateNextTransactionId(): Promise<string> {
  const rows = await prisma.commercialTransaction.findMany({
    select: { transactionId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  let max = 0;
  for (const row of rows) {
    const match = row.transactionId.match(/^txn-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `txn-${max + 1}`;
}

export function lineTotal(line: { quantity: unknown; unitPrice: unknown }): number {
  return Number(line.quantity) * Number(line.unitPrice);
}

export function computeTotalAmount(
  lines: Array<{ quantity: unknown; unitPrice: unknown }>,
): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function isStockTransaction(type: CommercialTxnType): boolean {
  return type !== "weaver_payout";
}

function isFullyDelivered(
  type: CommercialTxnType,
  lines: Array<{ quantity: unknown; deliveredQuantity: unknown }>,
): boolean {
  if (!isStockTransaction(type)) return true;
  if (lines.length === 0) return false;
  return lines.every(
    (line) => Number(line.deliveredQuantity) >= Number(line.quantity),
  );
}

function isFullyPaid(totalAmount: number, amountPaid: number): boolean {
  return amountPaid >= totalAmount - 0.001;
}

export function deriveTransactionStatus(input: {
  type: CommercialTxnType;
  totalAmount: number;
  amountPaid: number;
  deliveredAt: Date | null;
  lines: Array<{ quantity: unknown; deliveredQuantity: unknown }>;
}): CommercialTxnStatus {
  if (input.type === "weaver_payout") return "completed";

  const delivered = isFullyDelivered(input.type, input.lines);
  const paid = isFullyPaid(input.totalAmount, input.amountPaid);
  const hasPayment = input.amountPaid > 0.001;
  const hasPartialDelivery = input.lines.some(
    (line) =>
      Number(line.deliveredQuantity) > 0 &&
      Number(line.deliveredQuantity) < Number(line.quantity),
  );

  if (delivered && paid) return "completed";
  if (delivered && !paid) return "awaiting_payment";
  if (!delivered && paid) return "awaiting_delivery";
  if (hasPayment || hasPartialDelivery || input.deliveredAt) return "in_progress";
  return "pending";
}

export async function refreshTransactionStatus(
  transactionId: string,
): Promise<CommercialTransaction> {
  const txn = await prisma.commercialTransaction.findUniqueOrThrow({
    where: { transactionId },
    include: { lines: true, payments: true },
  });

  const amountPaid = txn.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const status = deriveTransactionStatus({
    type: txn.type,
    totalAmount: Number(txn.totalAmount),
    amountPaid,
    deliveredAt: txn.deliveredAt,
    lines: txn.lines,
  });

  const allDelivered = isFullyDelivered(txn.type, txn.lines);
  const deliveredAt =
    allDelivered && !txn.deliveredAt ? new Date() : txn.deliveredAt;

  return prisma.commercialTransaction.update({
    where: { transactionId },
    data: { status, amountPaid, deliveredAt },
  });
}

export function validateCounterparty(
  type: CommercialTxnType,
  ids: { supplierId?: number | null; weaverId?: number | null; merchantId?: number | null },
): void {
  if (type === "yarn_purchase" && !ids.supplierId) {
    throw new Error("VALIDATION:Supplier is required for yarn purchase.");
  }
  if (type === "fabric_purchase" && !ids.weaverId) {
    throw new Error("VALIDATION:Weaver is required for fabric purchase.");
  }
  if (type === "fabric_sale" && !ids.merchantId) {
    throw new Error("VALIDATION:Merchant is required for fabric sale.");
  }
  if (type === "yarn_sale" && !ids.merchantId && !ids.weaverId) {
    throw new Error("VALIDATION:Merchant or weaver is required for yarn sale.");
  }
}

export function expectedVariantField(type: CommercialTxnType): "yarn" | "fabric" | "none" {
  if (type === "weaver_payout") return "none";
  if (type === "yarn_purchase" || type === "yarn_sale") return "yarn";
  return "fabric";
}

export async function createWeaverPayoutTransaction(input: {
  linkedPaymentId: number;
  weaverId: number;
  amount: number;
  notes?: string;
  recordedByUserId: number;
}) {
  const existing = await prisma.commercialTransaction.findUnique({
    where: { linkedPaymentId: input.linkedPaymentId },
  });
  if (existing) return existing;

  const transactionId = await generateNextTransactionId();
  return prisma.commercialTransaction.create({
    data: {
      transactionId,
      type: "weaver_payout",
      status: "completed",
      paymentTerms: "on_delivery",
      weaverId: input.weaverId,
      totalAmount: input.amount,
      amountPaid: input.amount,
      deliveredAt: new Date(),
      linkedPaymentId: input.linkedPaymentId,
      notes: input.notes ?? "Monthly settlement — net weaver profit",
      createdByUserId: input.recordedByUserId,
      lines: {
        create: {
          quantity: 1,
          unitPrice: input.amount,
          deliveredQuantity: 1,
          description: "Net settlement payout",
        },
      },
      payments: {
        create: {
          amount: input.amount,
          paymentMethod: "Settlement",
          notes: "Linked settlement payment",
          recordedByUserId: input.recordedByUserId,
        },
      },
    },
  });
}

export const TXN_TYPE_LABELS: Record<CommercialTxnType, string> = {
  yarn_purchase: "Yarn Purchase",
  fabric_purchase: "Fabric Purchase",
  yarn_sale: "Yarn Sale",
  fabric_sale: "Fabric Sale",
  weaver_payout: "Weaver Payout",
};

export const TXN_STATUS_LABELS: Record<CommercialTxnStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_delivery: "Paid — Awaiting Delivery",
  awaiting_payment: "Delivered — Awaiting Payment",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  prepaid: "Prepaid",
  on_delivery: "On Delivery",
  installment: "Installment",
};

export function directionForType(type: CommercialTxnType): "buy" | "sell" | "payout" {
  if (PURCHASE_TYPES.includes(type)) return "buy";
  if (SALE_TYPES.includes(type)) return "sell";
  return "payout";
}