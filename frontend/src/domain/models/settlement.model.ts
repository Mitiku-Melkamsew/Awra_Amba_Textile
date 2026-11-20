import type { Weaver, WorkOrder } from "./index";

/** Mirrors Prisma `SettlementStatus` and `SettlementBatchStatus` enums. */
export type SettlementStatus = "draft" | "committed" | "paid" | "cancelled";
export type SettlementBatchStatus = "draft" | "committed" | "paid" | "cancelled";

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
  cancelReason?: string | null;
  notes?: string | null;
  weaver?: Weaver;
  workOrders?: WorkOrder[];
  payments?: SettlementPayment[];
}

export interface SettlementBatch {
  batchId: number;
  status: SettlementBatchStatus;
  cutoffDate?: string | null;
  exceptionZigIds?: string[];
  totalAmount: number | string;
  amountPaid: number | string;
  paymentMethod?: string | null;
  notes?: string | null;
  createdByUserId: number;
  createdAt: string;
  committedAt?: string | null;
  paidAt?: string | null;
  createdBy?: { fullName: string };
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

export interface WeaverSettlementBundlePreview {
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

export interface SettlementBatchPreview {
  cutoffDate?: string | null;
  weaverCount: number;
  grandTotal: number;
  amharicAmountInWords?: string;
  outOfCutoffZigs?: OutOfCutoffZig[];
  bundles: WeaverSettlementBundlePreview[];
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
    grossFabricValue?: number;
    deductionAmount?: number;
    netFabricValue?: number;
  };
  settlement?: {
    settlementId: number;
    batchId: number;
    status: string;
    amount: number | null;
  } | null;
  isSettled: boolean;
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
  paymentId: number | null;
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
