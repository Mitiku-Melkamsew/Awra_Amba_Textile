export interface ZigLedgerItem {
  zigId: string;
  weaverUserId: number;
  weaverName: string;
  weaverPhone?: string | null;
  status: string;
  dateIssued: string;
  dateReturned?: string | null;
  fabricName: string;
  standardWeightG: number;
  warpColor?: string;
  weftColor?: string;
  design?: string;
  netPayable: number;
  yarn: {
    issuedQuantity: number;
    totalCost: number;
  };
  fabric: {
    receivedQuantity: number;
    totalWeight: number;
    averageWeight: number;
    grossFabricValue: number;
    deductionAmount: number;
  };
  settlement: {
    settlementId: number;
    batchId: number;
    status: string;
    amount: number;
  } | null;
  isSettled: boolean;
}

export type ProductionStatusTab = "all" | "ongoing" | "returned" | "reconciled";

export interface ProductionStats {
  ongoingCount: number;
  ongoingYarnPieces: number;
  returnedCount: number;
  pendingLiability: number;
  reconciledCount: number;
  reconciledTotal: number;
  qualityRate: number;
}
