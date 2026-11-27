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
  revenue?: {
    merchantFabricSalesTotal: number;
    merchantFabricSalesCollected: number;
    weaverYarnSalesTotal: number;
    weaverYarnSalesCollected: number;
    grossCommercialRevenue: number;
  };
  expenses?: {
    supplierYarnProcurementExpense: number;
    weaverSettlementPayouts: number;
    weaverDirectFabricPurchases: number;
    totalExpenses: number;
  };
  profitability?: {
    netOperatingProfit: number;
  };
  fabricSalesRevenue?: number;
  yarnSalesRevenue?: number;
  fabricPurchasesExpense?: number;
  yarnProcurementExpense?: number;
  weaverSettlementsExpense?: number;
  netCashFlow?: number;
}

export interface ProductionReportSummary {
  periodStart: string | null;
  periodEnd: string | null;
  workOrdersAssigned: number;
  workOrdersReturned: number;
  fabricPiecesProduced: number;
  yarnIssuedPieces: number;
  grossFabricValueBirr?: number;
  totalQualityDeductionsBirr: number;
}
