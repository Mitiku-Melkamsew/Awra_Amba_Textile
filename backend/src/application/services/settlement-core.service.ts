import type { Prisma } from "@prisma/client";
import type { LineOverride } from "./calculation.service.js";

export type SettlementOverride = LineOverride;

export interface CommitSettlementInput {
  batchId?: number;
  weaverUserId: number;
  returnIds?: number[];
  yarnGivenIds?: number[];
  paymentMethod?: string;
  notes?: string;
  recordedByUserId: number;
  overrides?: SettlementOverride[];
  expectedNetSettlement?: number;
  markAsPaid?: boolean;
}

export async function commitSettlement(
  input: CommitSettlementInput,
  _transaction?: Prisma.TransactionClient,
) {
  const { SettlementService } = await import("./settlement.service.js");
  const result = await SettlementService.commitSingleSettlement(input);
  return {
    settlementId: result.settlements[0]?.settlementId ?? 0,
    amount: result.grandTotal,
    netAmount: result.grandTotal,
    weaverUserId: input.weaverUserId,
    status: "paid",
  };
}
