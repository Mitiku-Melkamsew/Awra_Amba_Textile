import { prisma } from "../../lib/prisma.js";
import {
  buildSettlementPreview,
  type LineOverride,
  type SettlementPreview,
} from "./calculation.service.js";
import { commitSettlement } from "./settlement-core.service.js";

export interface WeaverSettlementBundle {
  weaverUserId: number;
  weaverName: string;
  zigIds: string[];
  returnIds: number[];
  yarnGivenIds: number[];
  overrides: LineOverride[];
  preview: SettlementPreview;
}

export interface OutOfCutoffZig {
  zigId: string;
  weaverUserId: number;
  weaverName: string;
  firstReturnDate: string;
}

export function eligibleReturnedZigIds(
  returnedOrders: Array<{ zigId: string }>,
  unsettledReturns: Array<{ zigId: string; dateReturned: Date | string }>,
  cutoffDate?: Date | null,
  includeZigIds?: string[],
): Set<string> {
  const firstReturnDateByZig = new Map<string, Date>();
  for (const ret of unsettledReturns) {
    const date = new Date(ret.dateReturned);
    const first = firstReturnDateByZig.get(ret.zigId);
    if (!first || date < first) firstReturnDateByZig.set(ret.zigId, date);
  }

  const cutoffEnd = cutoffDate ? new Date(cutoffDate) : null;
  cutoffEnd?.setHours(23, 59, 59, 999);

  const exceptions = new Set(includeZigIds ?? []);

  return new Set(
    returnedOrders
      .filter((order) => {
        if (exceptions.has(order.zigId)) return true;
        const firstReturn = firstReturnDateByZig.get(order.zigId);
        return Boolean(firstReturn) && (!cutoffEnd || firstReturn! <= cutoffEnd);
      })
      .map((order) => order.zigId),
  );
}

export function discoverOutOfCutoffZigs(
  returnedOrders: Array<{ zigId: string; weaver: { fullName: string; userId: number } }>,
  unsettledReturns: Array<{ zigId: string; dateReturned: Date | string }>,
  cutoffDate?: Date | null,
  includeZigIds?: string[],
): OutOfCutoffZig[] {
  if (!cutoffDate) return [];
  const cutoffEnd = new Date(cutoffDate);
  cutoffEnd.setHours(23, 59, 59, 999);
  const exceptions = new Set(includeZigIds ?? []);

  const firstReturnDateByZig = new Map<string, Date>();
  for (const ret of unsettledReturns) {
    const date = new Date(ret.dateReturned);
    const first = firstReturnDateByZig.get(ret.zigId);
    if (!first || date < first) firstReturnDateByZig.set(ret.zigId, date);
  }

  return returnedOrders
    .filter((order) => {
      if (exceptions.has(order.zigId)) return false;
      const firstReturn = firstReturnDateByZig.get(order.zigId);
      return Boolean(firstReturn) && firstReturn! > cutoffEnd;
    })
    .map((order) => ({
      zigId: order.zigId,
      weaverUserId: order.weaver.userId,
      weaverName: order.weaver.fullName,
      firstReturnDate: firstReturnDateByZig.get(order.zigId)!.toISOString(),
    }));
}

export async function discoverReturnedSettlementBundles(
  cutoffDate?: Date | null,
  _overrides: LineOverride[] = [],
  includeZigIds?: string[],
) {
  const { SettlementService } = await import("./settlement.service.js");
  const preview = await SettlementService.generatePreview(cutoffDate, undefined, _overrides, includeZigIds ?? []);
  return preview.bundles as unknown as WeaverSettlementBundle[];
}

export async function batchCommitSettlements(params: {
  bundles: WeaverSettlementBundle[];
  batchId?: number;
  recordedByUserId: number;
  paymentMethod?: string;
}) {
  const { SettlementService } = await import("./settlement.service.js");
  return SettlementService.commitBatch(
    {
      includeZigIds: params.bundles.flatMap((b) => b.zigIds),
      paymentMethod: params.paymentMethod,
    },
    params.recordedByUserId,
  );
}
