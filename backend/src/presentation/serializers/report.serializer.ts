import { project, serializeUserBrief, type AnyRecord } from "./project.js";

export interface FinancialSummaryResponse {
  revenue: {
    merchantFabricSalesTotal: number;
    merchantFabricSalesCollected: number;
    weaverYarnSalesTotal: number;
    weaverYarnSalesCollected: number;
    grossCommercialRevenue: number;
  };
  expenses: {
    supplierYarnProcurementExpense: number;
    weaverSettlementPayouts: number;
    weaverDirectFabricPurchases: number;
    totalExpenses: number;
  };
  profitability: {
    netOperatingProfit: number;
  };
  fabricSalesRevenue: number;
  yarnSalesRevenue: number;
  fabricPurchasesExpense: number;
  yarnProcurementExpense: number;
  weaverSettlementsExpense: number;
  netCashFlow: number;
}

export interface ProductionSummaryResponse {
  periodStart: string | null;
  periodEnd: string | null;
  workOrdersAssigned: number;
  workOrdersReturned: number;
  fabricPiecesProduced: number;
  yarnIssuedPieces: number;
  grossFabricValueBirr: number;
  totalQualityDeductionsBirr: number;
}

const WEAVER_BALANCE_KEYS = [
  "weaverId",
  "weaverUserId",
  "firstName",
  "lastName",
  "fullName",
  "username",
  "phone",
  "directPurchasePayable",
  "directSalesPayableBalance",
  "unsettledReturnedZigsCount",
  "unsettledPiecesCount",
  "activeWorkOrdersCount",
  "estimatedPendingPayout",
  "committedSettlementPayable",
  "netPayableBalance",
] as const;

const MERCHANT_BALANCE_KEYS = [
  "merchantId",
  "merchantUserId",
  "firstName",
  "lastName",
  "fullName",
  "username",
  "phone",
  "outstandingReceivable",
  "totalReceivableBalance",
  "unpaidSalesCount",
] as const;

const HISAB_ROW_KEYS = [
  "weaverId",
  "weaverName",
  "zigId",
  "fabricType",
  "fabricQty",
  "avgWeight",
  "basePrice",
  "deduction",
  "adjustedPrice",
  "lineSubtotal",
  "fabricTotalValue",
  "yarnQty",
  "yarnAvgPrice",
  "yarnTotal",
  "netProfit",
  "totalNetProfit",
] as const;

export function serializeFinancialSummary(summary: AnyRecord): FinancialSummaryResponse {
  return {
    revenue: {
      merchantFabricSalesTotal: Number(summary.revenue?.merchantFabricSalesTotal ?? 0),
      merchantFabricSalesCollected: Number(summary.revenue?.merchantFabricSalesCollected ?? 0),
      weaverYarnSalesTotal: Number(summary.revenue?.weaverYarnSalesTotal ?? 0),
      weaverYarnSalesCollected: Number(summary.revenue?.weaverYarnSalesCollected ?? 0),
      grossCommercialRevenue: Number(summary.revenue?.grossCommercialRevenue ?? 0),
    },
    expenses: {
      supplierYarnProcurementExpense: Number(summary.expenses?.supplierYarnProcurementExpense ?? 0),
      weaverSettlementPayouts: Number(summary.expenses?.weaverSettlementPayouts ?? 0),
      weaverDirectFabricPurchases: Number(summary.expenses?.weaverDirectFabricPurchases ?? 0),
      totalExpenses: Number(summary.expenses?.totalExpenses ?? 0),
    },
    profitability: {
      netOperatingProfit: Number(summary.profitability?.netOperatingProfit ?? 0),
    },
    fabricSalesRevenue: Number(summary.fabricSalesRevenue ?? 0),
    yarnSalesRevenue: Number(summary.yarnSalesRevenue ?? 0),
    fabricPurchasesExpense: Number(summary.fabricPurchasesExpense ?? 0),
    yarnProcurementExpense: Number(summary.yarnProcurementExpense ?? 0),
    weaverSettlementsExpense: Number(summary.weaverSettlementsExpense ?? 0),
    netCashFlow: Number(summary.netCashFlow ?? 0),
  };
}

export function serializeProductionSummary(summary: AnyRecord): ProductionSummaryResponse {
  return {
    periodStart: summary.periodStart ?? null,
    periodEnd: summary.periodEnd ?? null,
    workOrdersAssigned: Number(summary.workOrdersAssigned ?? 0),
    workOrdersReturned: Number(summary.workOrdersReturned ?? 0),
    fabricPiecesProduced: Number(summary.fabricPiecesProduced ?? 0),
    yarnIssuedPieces: Number(summary.yarnIssuedPieces ?? 0),
    grossFabricValueBirr: Number(summary.grossFabricValueBirr ?? 0),
    totalQualityDeductionsBirr: Number(summary.totalQualityDeductionsBirr ?? 0),
  };
}

export function serializeWeaverBalanceItem(item: AnyRecord) {
  return project(item, WEAVER_BALANCE_KEYS);
}

export function serializeMerchantBalanceItem(item: AnyRecord) {
  return project(item, MERCHANT_BALANCE_KEYS);
}

export function serializeSettlementPaymentReportItem(item: AnyRecord) {
  return {
    paymentId: item.paymentId,
    settlementId: item.settlementId,
    amount: Number(item.amount ?? 0),
    paymentDate: item.paymentDate,
    weaver: item.weaver
      ? {
          weaverUserId: item.weaver.weaverUserId ?? item.weaver.userId,
          userId: item.weaver.userId,
          firstName: item.weaver.firstName,
          lastName: item.weaver.lastName,
          fullName: item.weaver.fullName,
        }
      : undefined,
  };
}

export function serializeWeaverPaymentItem(item: AnyRecord) {
  return {
    paymentId: item.paymentId,
    settlementId: item.settlementId,
    batchId: item.batchId,
    amount: Number(item.amount ?? 0),
    paymentDate: item.paymentDate,
    paymentMethod: item.paymentMethod ?? "Cash",
    notes: item.notes ?? null,
    settlementStatus: item.settlementStatus,
  };
}

export function serializeHisabReport(report: AnyRecord) {
  return {
    paymentId: report.paymentId ?? null,
    settlementId: report.settlementId,
    paymentDate: report.paymentDate,
    weaver: report.weaver ? serializeUserBrief(report.weaver) : null,
    amount: Number(report.amount ?? 0),
    amharicAmountInWords: report.amharicAmountInWords ?? "",
    rows: (report.rows ?? []).map((r: AnyRecord) => project(r, HISAB_ROW_KEYS)),
    isPaid: Boolean(report.isPaid),
    status: report.status,
  };
}
