import {
  serializeFabricVariant,
  serializeSupplier,
  serializeYarnVariant,
} from "./catalog.serializer.js";
import { project, serializeUserBrief, type AnyRecord } from "./project.js";

const TXN_LINE_KEYS = [
  "lineId",
  "transactionId",
  "fabricVariantId",
  "yarnVariantId",
  "quantity",
  "unitPrice",
  "lineTotal",
  "description",
] as const;

const TXN_PAYMENT_KEYS = [
  "paymentId",
  "transactionId",
  "amount",
  "paymentMethod",
  "paymentDate",
  "recordedByUserId",
  "notes",
] as const;

const DIRECT_TXN_KEYS = [
  "transactionId",
  "purchaseId",
  "type",
  "status",
  "totalAmount",
  "amountPaid",
  "transactionDate",
  "createdAt",
  "deliveredAt",
  "notes",
  "supplierId",
  "weaverUserId",
  "merchantUserId",
  "createdByUserId",
] as const;

const YARN_PURCHASE_LINE_KEYS = [
  "lineId",
  "purchaseId",
  "yarnVariantId",
  "quantity",
  "unitPrice",
] as const;

const YARN_PURCHASE_KEYS = [
  "purchaseId",
  "supplierId",
  "purchaseDate",
  "createdByUserId",
  "notes",
] as const;

export function serializeDirectTxnLine(line: AnyRecord): AnyRecord {
  const out = project(line, TXN_LINE_KEYS);
  if (line.fabricVariant) out.fabricVariant = serializeFabricVariant(line.fabricVariant);
  if (line.yarnVariant) out.yarnVariant = serializeYarnVariant(line.yarnVariant);
  return out;
}

export function serializeDirectTxnPayment(payment: AnyRecord): AnyRecord {
  const out = project(payment, TXN_PAYMENT_KEYS);
  if (payment.recordedBy) out.recordedBy = serializeUserBrief(payment.recordedBy);
  return out;
}

export function serializeDirectTransaction(txn: AnyRecord): AnyRecord {
  const out = project(txn, DIRECT_TXN_KEYS);

  if (txn.supplier) out.supplier = serializeSupplier(txn.supplier);
  if (txn.weaver) out.weaver = serializeUserBrief(txn.weaver);
  if (txn.merchant) out.merchant = serializeUserBrief(txn.merchant);
  if (txn.createdBy) out.createdBy = serializeUserBrief(txn.createdBy);
  if (Array.isArray(txn.lines)) out.lines = txn.lines.map(serializeDirectTxnLine);
  if (Array.isArray(txn.payments)) {
    out.payments = txn.payments.map(serializeDirectTxnPayment);
  }

  return out;
}

export function serializeDirectTransactionList(result: {
  transactions: AnyRecord[];
  total: number;
}) {
  return {
    transactions: (result.transactions ?? []).map(serializeDirectTransaction),
    total: Number(result.total ?? 0),
  };
}

export function serializeDirectTxnPaymentResult(result: {
  payment: AnyRecord;
  transaction: AnyRecord;
}) {
  return {
    payment: serializeDirectTxnPayment(result.payment),
    transaction: serializeDirectTransaction(result.transaction),
  };
}

export function serializeYarnPurchaseLine(line: AnyRecord): AnyRecord {
  const out = project(line, YARN_PURCHASE_LINE_KEYS);
  if (line.yarnVariant) out.yarnVariant = serializeYarnVariant(line.yarnVariant);
  return out;
}

export function serializeYarnPurchase(purchase: AnyRecord): AnyRecord {
  const out = project(purchase, YARN_PURCHASE_KEYS);
  if (purchase.supplier) out.supplier = serializeSupplier(purchase.supplier);
  if (purchase.createdBy) out.createdBy = serializeUserBrief(purchase.createdBy);
  if (Array.isArray(purchase.lines)) {
    out.lines = purchase.lines.map(serializeYarnPurchaseLine);
  }
  return out;
}

export function serializeYarnPurchaseList(result: {
  purchases: AnyRecord[];
  total: number;
}) {
  return {
    purchases: (result.purchases ?? []).map(serializeYarnPurchase),
    total: Number(result.total ?? 0),
  };
}
