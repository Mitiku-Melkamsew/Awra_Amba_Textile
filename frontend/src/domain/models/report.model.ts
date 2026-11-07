export interface WeaverBalanceSummary {
  weaverId: number;
  fullName: string;
  phone: string | null;
  activeWorkOrdersCount: number;
  unsettledPiecesCount: number;
  estimatedPendingPayout: number;
  directSalesPayableBalance: number;
  netPayableBalance: number;
}

export interface CommercialReportSummary {
  fabricSalesRevenue: number;
  yarnSalesRevenue: number;
  fabricPurchasesExpense: number;
  yarnProcurementExpense: number;
  weaverSettlementsExpense: number;
  netCashFlow: number;
}

export interface ProductionReportSummary {
  periodStart: string;
  periodEnd: string;
  workOrdersAssigned: number;
  workOrdersReturned: number;
  fabricPiecesProduced: number;
  yarnIssuedKg: number;
  yarnReturnedKg: number;
  totalQualityDeductionsBirr: number;
}
