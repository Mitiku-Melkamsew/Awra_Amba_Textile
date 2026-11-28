import { project, serializeUserBrief, type AnyRecord } from "./project.js";
import { serializeWorkOrder } from "./work-order.serializer.js";

const SETTLEMENT_PAYMENT_KEYS = [
  "settlementPaymentId",
  "settlementId",
  "amount",
  "paymentMethod",
  "paymentDate",
  "recordedByUserId",
  "notes",
] as const;

const SETTLEMENT_KEYS = [
  "settlementId",
  "batchId",
  "weaverUserId",
  "status",
  "grossFabricValue",
  "totalDeductions",
  "totalYarnCost",
  "netAmount",
  "cancelReason",
  "notes",
  "createdByUserId",
  "createdAt",
  "paidAt",
] as const;

const SETTLEMENT_BATCH_KEYS = [
  "batchId",
  "status",
  "cutoffDate",
  "exceptionZigIds",
  "totalAmount",
  "amountPaid",
  "paymentMethod",
  "notes",
  "createdByUserId",
  "createdAt",
  "committedAt",
  "paidAt",
  "amharicAmountInWords",
] as const;

const PREVIEW_FABRIC_LINE_KEYS = [
  "returnId",
  "zigId",
  "fabricVariantId",
  "fabricName",
  "quantityReturned",
  "totalWeight",
  "avgWeight",
  "unitPrice",
  "grossFabricValue",
  "deductions",
  "deductionAmount",
  "netFabricValue",
  "remark",
] as const;

const PREVIEW_YARN_LINE_KEYS = [
  "yarnGivenId",
  "zigId",
  "yarnVariantId",
  "yarnSku",
  "quantity",
  "unitPrice",
  "totalCost",
  "remark",
] as const;

const PREVIEW_BUNDLE_KEYS = [
  "weaverUserId",
  "weaverName",
  "weaverPhone",
  "zigIds",
  "returnIds",
  "yarnGivenIds",
  "grossFabricValue",
  "totalDeductions",
  "totalYarnCost",
  "netSettlement",
  "isBlocked",
  "blockReasons",
] as const;

const OUT_OF_CUTOFF_KEYS = [
  "zigId",
  "weaverUserId",
  "weaverName",
  "firstReturnDate",
] as const;

export function serializeSettlementPayment(payment: AnyRecord): AnyRecord {
  const out = project(payment, SETTLEMENT_PAYMENT_KEYS);
  if (payment.batch) {
    out.batch = {
      totalAmount: Number(payment.batch.totalAmount ?? 0),
      amountPaid: Number(payment.batch.amountPaid ?? 0),
      status: payment.batch.status,
    };
  }
  return out;
}

export function serializeSettlement(settlement: AnyRecord): AnyRecord {
  const out = project(settlement, SETTLEMENT_KEYS);
  if (settlement.weaver) out.weaver = serializeUserBrief(settlement.weaver);
  if (settlement.batch) out.batch = project(settlement.batch, SETTLEMENT_BATCH_KEYS);
  if (Array.isArray(settlement.payments)) {
    out.payments = settlement.payments.map(serializeSettlementPayment);
  }
  if (Array.isArray(settlement.workOrders)) {
    out.workOrders = settlement.workOrders.map(serializeWorkOrder);
  }
  return out;
}

export function serializeSettlementBatch(batch: AnyRecord): AnyRecord {
  const out = project(batch, SETTLEMENT_BATCH_KEYS);
  if (batch.createdBy) out.createdBy = serializeUserBrief(batch.createdBy);
  if (Array.isArray(batch.settlements)) {
    out.settlements = batch.settlements.map(serializeSettlement);
  }
  if (Array.isArray(batch.workOrders)) {
    out.workOrders = batch.workOrders.map(serializeWorkOrder);
  }
  if (batch._count) out._count = { ...batch._count };
  return out;
}

export function serializeSettlementPreview(preview: AnyRecord) {
  return {
    bundles: (preview.bundles ?? []).map((b: AnyRecord) => {
      const bundle = project(b, PREVIEW_BUNDLE_KEYS);
      bundle.fabricLines = (b.fabricLines ?? []).map((l: AnyRecord) =>
        project(l, PREVIEW_FABRIC_LINE_KEYS),
      );
      bundle.yarnLines = (b.yarnLines ?? []).map((l: AnyRecord) =>
        project(l, PREVIEW_YARN_LINE_KEYS),
      );
      return bundle;
    }),
    grandTotal: Number(preview.grandTotal ?? 0),
    grossFabricValue: Number(preview.grossFabricValue ?? 0),
    totalDeductions: Number(preview.totalDeductions ?? 0),
    totalYarnCost: Number(preview.totalYarnCost ?? 0),
    weaverCount: Number(preview.weaverCount ?? 0),
    zigCount: Number(preview.zigCount ?? 0),
    outOfCutoffZigs: (preview.outOfCutoffZigs ?? []).map((z: AnyRecord) =>
      project(z, OUT_OF_CUTOFF_KEYS),
    ),
    amharicAmountInWords: preview.amharicAmountInWords ?? "",
    isBlocked: Boolean(preview.isBlocked),
    blockReasons: Array.isArray(preview.blockReasons) ? [...preview.blockReasons] : [],
  };
}

export function serializeBatchCommitResult(result: AnyRecord) {
  return {
    batchId: result.batchId,
    status: result.status,
    grandTotal: Number(result.grandTotal ?? 0),
    amountPaid: Number(result.amountPaid ?? 0),
    weaverCount: Number(result.weaverCount ?? 0),
    amharicAmountInWords: result.amharicAmountInWords ?? "",
    settlements: (result.settlements ?? []).map(serializeSettlement),
  };
}

export function serializeBatchPayResult(result: AnyRecord) {
  return {
    batchId: result.batchId,
    payments: (result.payments ?? []).map(serializeSettlementPayment),
    amountPaid: Number(result.amountPaid ?? 0),
    totalAmount: Number(result.totalAmount ?? 0),
    status: result.status,
    settlements: (result.settlements ?? []).map((s: AnyRecord) => ({
      settlementId: s.settlementId,
      status: s.status,
    })),
  };
}

export function serializePendingSummary(summary: AnyRecord) {
  return {
    pendingLiability: Number(summary.pendingLiability ?? 0),
    unsettledZigCount: Number(summary.unsettledZigCount ?? 0),
    weaverCount: Number(summary.weaverCount ?? 0),
  };
}

export function serializeZigsLedgerRow(row: AnyRecord) {
  return {
    zigId: row.zigId,
    weaverUserId: row.weaverUserId,
    weaverName: row.weaverName,
    weaverPhone: row.weaverPhone ?? null,
    status: row.status,
    dateIssued: row.dateIssued,
    dateReturned: row.dateReturned ?? null,
    fabricName: row.fabricName,
    standardWeightG: Number(row.standardWeightG ?? 0),
    warpColor: row.warpColor,
    weftColor: row.weftColor,
    design: row.design,
    netPayable: Number(row.netPayable ?? 0),
    yarn: {
      issuedQuantity: Number(row.yarn?.issuedQuantity ?? 0),
      returnedQuantity: Number(row.yarn?.returnedQuantity ?? 0),
      netQuantity: Number(row.yarn?.netQuantity ?? 0),
      totalCost: Number(row.yarn?.totalCost ?? 0),
    },
    fabric: {
      receivedQuantity: Number(row.fabric?.receivedQuantity ?? 0),
      defectiveQuantity: Number(row.fabric?.defectiveQuantity ?? 0),
      billableQuantity: Number(row.fabric?.billableQuantity ?? 0),
      totalWeight: Number(row.fabric?.totalWeight ?? 0),
      averageWeight: Number(row.fabric?.averageWeight ?? 0),
      grossFabricValue: Number(row.fabric?.grossFabricValue ?? 0),
      deductionAmount: Number(row.fabric?.deductionAmount ?? 0),
      netFabricValue: Number(row.fabric?.netFabricValue ?? 0),
    },
    settlement: row.settlement
      ? {
          settlementId: row.settlement.settlementId,
          batchId: row.settlement.batchId,
          status: row.settlement.status,
          amount: Number(row.settlement.amount ?? 0),
        }
      : null,
    isSettled: Boolean(row.isSettled),
  };
}
