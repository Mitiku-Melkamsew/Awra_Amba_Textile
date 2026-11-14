import type { Weaver, WorkOrder, Fabric, YarnVariant } from "./index";

/** Mirrors Prisma `SettlementStatus` and `SettlementBatchStatus` enums. */
export type SettlementStatus = "draft" | "paid" | "cancelled";
export type SettlementBatchStatus = "draft" | "committed";

export interface SettlementLineReturn {
  settlementLineId: number;
  returnId: number;
}

export interface SettlementLine {
  settlementLineId: number;
  settlementId: number;
  zigId: string;
  fabricId: number;
  totalQuantity: number;
  totalWeight: number | string;
  averageWeight: number | string;
  standardWeightG: number | string;
  standardLengthCm?: number | string | null;
  standardWidthCm?: number | string | null;
  unitPrice: number | string;
  deductionFactor: string;
  deductionUnit: string;
  deductionPerPiece: number | string;
  deductionAmount: number | string;
  grossFabricValue: number | string;
  netFabricValue: number | string;
  fabric?: Fabric;
  workOrder?: WorkOrder;
  returns?: SettlementLineReturn[];
}

export interface SettlementYarnLine {
  settlementYarnLineId: number;
  settlementId: number;
  zigId: string;
  yarnGivenId: number;
  yarnVariantId: number;
  issuedQuantity: number | string;
  returnedQuantity: number | string;
  netQuantity: number | string;
  unitPrice: number | string;
  totalCost: number | string;
  workOrder?: WorkOrder;
  yarnVariant?: YarnVariant;
}

export interface SettlementPayment {
  settlementPaymentId: number;
  settlementId: number;
  amount: number | string;
  paymentMethod?: string | null;
  paymentDate: string;
  recordedByUserId?: number;
  notes?: string | null;
}

export interface Settlement {
  settlementId: number;
  batchId: number;
  weaverUserId: number;
  status: SettlementStatus;
  grossFabricValue: number | string;
  totalDeductions: number | string;
  totalYarnCost: number | string;
  netAmount: number | string;
  createdByUserId: number;
  createdAt: string;
  paidAt?: string | null;
  notes?: string | null;
  weaver?: Weaver;
  lines?: SettlementLine[];
  yarnLines?: SettlementYarnLine[];
  payments?: SettlementPayment[];
}

export interface SettlementBatch {
  batchId: number;
  status: SettlementBatchStatus;
  snapshot: any;
  totalAmount: number | string;
  amountPaid: number | string;
  createdByUserId: number;
  createdAt: string;
  committedAt?: string | null;
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
  batchId: number;
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
  settlementId?: number;
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
