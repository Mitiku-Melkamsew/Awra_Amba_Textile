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

/**
 * Commit exactly the selected returns/yarn lines for one weaver.
 *
 * The settlement is committed unpaid unless `markAsPaid` is explicitly true,
 * so money movement always goes through the payout endpoints.
 */
export async function commitSettlement(
  input: CommitSettlementInput,
  _transaction?: Prisma.TransactionClient,
) {
  const { SettlementService } = await import("./settlement.service.js");
  const result = await SettlementService.commitSingleSettlement({
    weaverUserId: input.weaverUserId,
    returnIds: input.returnIds,
    yarnGivenIds: input.yarnGivenIds,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    recordedByUserId: input.recordedByUserId,
    overrides: input.overrides,
    autoPay: input.markAsPaid === true,
    expectedNetSettlement: input.expectedNetSettlement,
  });

  const settlement = result.settlements[0];
  const netAmount = Number(settlement?.netAmount ?? 0);

  return {
    settlementId: settlement?.settlementId ?? 0,
    batchId: result.batchId,
    amount: netAmount,
    netAmount,
    weaverUserId: input.weaverUserId,
    status: settlement?.status ?? "committed",
  };
}
