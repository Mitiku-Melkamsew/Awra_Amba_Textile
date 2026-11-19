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

export interface OutOfCutoffZig {
  zigId: string;
  weaverUserId: number;
  weaverName: string;
  firstReturnDate: string;
}

export interface PendingSettlementsSummary {
  pendingLiability: number;
  unsettledZigCount: number;
  totalPendingAmount?: number;
  totalFabricValue?: number;
  totalDeductions?: number;
  totalYarnCost?: number;
  weaverCount?: number;
  zigCount?: number;
  totalPieceCount?: number;
}

export interface SettlementFabricLinePreview {
  returnId: number;
  zigId: string;
  fabricVariantId: number;
  fabricName: string;
  quantityReturned: number;
  totalWeight: number;
  avgWeight: number;
  unitPrice: number;
  grossFabricValue: number;
  deductions?: Array<{ factor: string; perPiece: number; remark?: string }>;
  deductionAmount: number;
  netFabricValue: number;
  remark?: string | null;
}

export interface SettlementYarnLinePreview {
  yarnGivenId: number;
  zigId: string;
  yarnVariantId: number;
  yarnSku: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  remark?: string | null;
}

export interface WeaverSettlementBundle {
  weaverUserId: number;
  weaverName: string;
  weaverPhone?: string | null;
  zigIds: string[];
  fabricLines: SettlementFabricLinePreview[];
  yarnLines: SettlementYarnLinePreview[];
  grossFabricValue: number;
  totalDeductions: number;
  totalYarnCost: number;
  netSettlement: number;
  isBlocked: boolean;
  blockReasons: string[];
}

export interface ZigLedgerItem {
  zigId: string;
  weaverUserId: number;
  weaverName: string;
  weaverPhone?: string | null;
  status: string;
  dateIssued: string;
  fabricName: string;
  standardWeightG: number;
  warpColor?: string;
  weftColor?: string;
  design?: string;
  yarn: {
    issuedQuantity: number;
    returnedQuantity: number;
    netQuantity: number;
    totalCost: number;
  };
  fabric: {
    receivedQuantity: number;
    defectiveQuantity: number;
    billableQuantity: number;
    totalWeight: number;
    averageWeight: number;
  };
  settlement?: {
    settlementId: number;
    batchId: number;
    status: string;
    amount: number | null;
  } | null;
  isSettled: boolean;
}

export interface SettlementBatchPreview {
  periodStart?: string;
  periodEnd?: string;
  cutoffDate?: string | null;
  previewId?: string;
  totalWeavers?: number;
  weaverCount?: number;
  totalZigsCount?: number;
  totalFabricPieces?: number;
  grandTotal?: number;
  estimatedGrossFabricCredit?: number;
  estimatedYarnDebits?: number;
  estimatedQualityDeductions?: number;
  estimatedNetPayout?: number;
  amharicAmountInWords?: string;
  outOfCutoffZigs?: OutOfCutoffZig[];
  weavers: Array<{
    weaverId: number;
    weaverUserId?: number;
    fullName?: string;
    weaverName?: string;
    phone?: string | null;
    workOrdersCount?: number;
    fabricPieces?: number;
    grossFabricCredit?: number;
    yarnDebits?: number;
    qualityDeductions?: number;
    netPayout?: number;
    netSettlement?: number;
    workOrders?: WorkOrder[];
    zigIds?: string[];
    returnCount?: number;
    yarnCount?: number;
    isBlocked?: boolean;
    blockReasons?: string[];
    lineItems?: any[];
    zigDetails?: any[];
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
  isPaid?: boolean;
  status?: string;
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
