import type { Weaver, WorkOrder } from "./index";

export type SettlementBatchStatus = "draft" | "paid" | "cancelled";

export interface SettlementLineFabric {
  settlementLineFabricId: number;
  settlementId: number;
  fabricReturnId: number;
  quantity: number;
  unitPrice: number | string;
  totalAmount: number | string;
  fabricReturn?: {
    fabricReturnId: number;
    workOrderId: number;
    actualWeightG: number | string;
    avgWeight?: number | string;
    workOrder?: WorkOrder;
  };
}

export interface SettlementLineYarnGiven {
  settlementLineYarnGivenId: number;
  settlementId: number;
  yarnGivenId: number;
  quantityKg: number | string;
  unitPrice: number | string;
  totalCost: number | string;
  yarnGiven?: {
    yarnGivenId: number;
    workOrderId: number;
    yarn?: { materialName: string };
  };
}

export interface SettlementDeduction {
  settlementDeductionId: number;
  settlementId: number;
  reason: string;
  amount: number | string;
}

export interface Settlement {
  settlementId: number;
  settlementBatchId: number;
  weaverId: number;
  periodStart: string;
  periodEnd: string;
  totalFabricAmount: number | string;
  totalYarnDeduction: number | string;
  totalOtherDeductions: number | string;
  netPayout: number | string;
  status: "unpaid" | "paid";
  createdAt: string;
  weaver?: Weaver;
  linesFabric?: SettlementLineFabric[];
  linesYarnGiven?: SettlementLineYarnGiven[];
  deductions?: SettlementDeduction[];
}

export interface SettlementBatch {
  settlementBatchId: number;
  periodStart: string;
  periodEnd: string;
  batchStatus: SettlementBatchStatus;
  totalAmount: number | string;
  notes?: string | null;
  createdAt: string;
  settlements?: Settlement[];
  _count?: {
    settlements?: number;
  };
}

export interface SettlementBatchPreview {
  periodStart: string;
  periodEnd: string;
  totalWeavers: number;
  totalZigsCount: number;
  totalFabricPieces: number;
  estimatedGrossFabricCredit: number;
  estimatedYarnDebits: number;
  estimatedQualityDeductions: number;
  estimatedNetPayout: number;
  weavers: Array<{
    weaverId: number;
    fullName: string;
    phone: string | null;
    workOrdersCount: number;
    fabricPieces: number;
    grossFabricCredit: number;
    yarnDebits: number;
    qualityDeductions: number;
    netPayout: number;
    workOrders: WorkOrder[];
  }>;
}

export interface DeductionResult {
  threshold: number;
  deductionPerPiece: number;
  adjustedUnitPrice: number;
  lineCredit: number;
  ruleApplied: string;
  remark: string;
}

export interface BonusResult {
  bonusPerPiece: number;
  totalBonus: number;
  ruleApplied: string;
  remark: string;
}

export interface GroupedFabricLine {
  returnIds: number[];
  returnCount: number;
  fabricType: string;
  quantityReturned: number;
  avgWeight: number;
  unitPrice: number;
  deductionPerPiece: number;
  adjustedPrice: number;
  lineSubtotal: number;
  netCredit: number;
}

export interface CommittedSettlementSummary {
  previewId: string;
  batchId?: number;
  createdAt: string;
  committedAt: string | null;
  cutoffDate: string | null;
  weaverCount: number;
  grandTotal: number;
  paymentCount: number;
  paidTotal: number;
  balance?: number;
  status?: "paid" | "partial" | "unpaid";
  paymentMethod: string | null;
  confirmedBy: string;
}

export interface HisabReport {
  paymentId: number;
  paymentDate: string;
  weaver: Weaver;
  amount: number;
  amharicAmountInWords: string;
  rows: Array<{
    weaverId: string | number;
    weaverName: string;
    zigId: string;
    fabricType: string;
    fabricQty: string | number;
    avgWeight: string | number;
    basePrice: string | number;
    deduction: string | number;
    adjustedPrice: string | number;
    lineSubtotal: string | number;
    fabricTotalValue: string | number;
    yarnQty: string | number;
    yarnAvgPrice: string | number;
    yarnTotal: string | number;
    netProfit: string | number;
    totalNetProfit: string | number;
  }>;
}
