import { serializeFabricVariant, serializeYarnVariant } from "./catalog.serializer.js";
import { project, serializeUserBrief, type AnyRecord } from "./project.js";

const WORK_ORDER_KEYS = [
  "zigId",
  "weaverUserId",
  "fabricVariantId",
  "status",
  "dateIssued",
  "dateReturned",
  "issuedByUserId",
  "netPayable",
  "settlementId",
  "settlementBatchId",
] as const;

const YARN_GIVEN_KEYS = [
  "yarnGivenId",
  "zigId",
  "yarnVariantId",
  "quantity",
  "unitPrice",
  "dateGiven",
  "recordedByUserId",
  "remark",
] as const;

const FABRIC_RETURN_KEYS = [
  "returnId",
  "zigId",
  "fabricVariantId",
  "quantityReturned",
  "totalWeight",
  "lengthCm",
  "widthCm",
  "unitPrice",
  "grossFabricValue",
  "deductionAmount",
  "deductions",
  "dateReturned",
  "recordedByUserId",
  "remark",
] as const;

const SETTLEMENT_REF_KEYS = [
  "settlementId",
  "batchId",
  "weaverUserId",
  "status",
  "grossFabricValue",
  "totalDeductions",
  "totalYarnCost",
  "netAmount",
  "createdAt",
  "paidAt",
] as const;

const BATCH_REF_KEYS = [
  "batchId",
  "status",
  "cutoffDate",
  "totalAmount",
  "amountPaid",
  "paymentMethod",
  "createdAt",
  "committedAt",
  "paidAt",
] as const;

export function serializeYarnGiven(row: AnyRecord): AnyRecord {
  const out = project(row, YARN_GIVEN_KEYS);
  if (row.yarnVariant) out.yarnVariant = serializeYarnVariant(row.yarnVariant);
  return out;
}

export function serializeFabricReturn(row: AnyRecord): AnyRecord {
  const out = project(row, FABRIC_RETURN_KEYS);
  if (row.fabricVariant) out.fabricVariant = serializeFabricVariant(row.fabricVariant);
  return out;
}

export function serializeWorkOrder(order: AnyRecord): AnyRecord {
  const out = project(order, WORK_ORDER_KEYS);

  if (order.weaver) out.weaver = serializeUserBrief(order.weaver);
  if (order.issuedBy) out.issuedBy = serializeUserBrief(order.issuedBy);
  if (order.fabricVariant) out.fabricVariant = serializeFabricVariant(order.fabricVariant);
  if (order.settlement) out.settlement = project(order.settlement, SETTLEMENT_REF_KEYS);
  if (order.settlementBatch) {
    out.settlementBatch = project(order.settlementBatch, BATCH_REF_KEYS);
  }
  if (Array.isArray(order.yarnGiven)) {
    out.yarnGiven = order.yarnGiven.map(serializeYarnGiven);
  }
  if (Array.isArray(order.fabricReturns)) {
    out.fabricReturns = order.fabricReturns.map(serializeFabricReturn);
  }
  if (order._count) out._count = { ...order._count };

  return out;
}

export function serializeWorkOrderList(result: { workOrders: AnyRecord[]; total: number }) {
  return {
    workOrders: (result.workOrders ?? []).map(serializeWorkOrder),
    total: Number(result.total ?? 0),
  };
}
