import { prisma } from "../lib/prisma.js";
import { buildSettlementPreview } from "./calculation.service.js";
import { commitSettlement } from "./settlement.service.js";
import { createWeaverPayoutTransaction } from "./transaction.service.js";

export interface WeaverSettlementBundle {
  weaverId: number;
  weaverName: string;
  zigIds: string[];
  returnIds: number[];
  yarnGivenIds: number[];
  saleIds: number[];
  preview: ReturnType<typeof buildSettlementPreview>;
}

export async function discoverReturnedSettlementBundles(cutoffDate?: Date | null) {
  // Get all returned work orders
  const returnedOrders = await prisma.workOrder.findMany({
    where: { status: "returned" },
    include: { weaver: true },
    orderBy: [{ weaverId: "asc" }, { zigId: "asc" }],
  });

  const zigIds = returnedOrders.map((o) => o.zigId);
  if (zigIds.length === 0) return [];

  const [returns, yarnGiven] = await Promise.all([
    prisma.fabricReturn.findMany({
      where: { zigId: { in: zigIds }, paymentId: null },
      include: {
        fabricVariant: { include: { qualityRule: true, bonusRule: true } },
        workOrder: { include: { weaver: true } },
      },
      orderBy: [{ zigId: "asc" }, { returnId: "asc" }],
    }),
    prisma.yarnGiven.findMany({
      where: { zigId: { in: zigIds }, paymentId: null },
      orderBy: { yarnGivenId: "asc" },
    }),
  ]);

  // Build map of zigId -> first fabric return date
  const firstReturnDateByZig = new Map<string, Date>();
  for (const ret of returns) {
    const existing = firstReturnDateByZig.get(ret.zigId);
    const retDate = new Date(ret.dateReturned);
    if (!existing || retDate < existing) {
      firstReturnDateByZig.set(ret.zigId, retDate);
    }
  }

  // Filter by cutoff date: include zig only if its first return date <= cutoffDate
  const eligibleZigIds = new Set(
    returnedOrders
      .filter((o) => {
        if (!cutoffDate) return true;
        const firstReturn = firstReturnDateByZig.get(o.zigId);
        if (!firstReturn) return false; // no returns yet, exclude
        // Normalize cutoff to end of day for inclusive comparison
        const cutoffEnd = new Date(cutoffDate);
        cutoffEnd.setHours(23, 59, 59, 999);
        return firstReturn <= cutoffEnd;
      })
      .map((o) => o.zigId),
  );

  const eligibleOrders = returnedOrders.filter((o) => eligibleZigIds.has(o.zigId));

  const byWeaver = new Map<number, WeaverSettlementBundle>();

  for (const order of eligibleOrders) {
    if (!byWeaver.has(order.weaverId)) {
      byWeaver.set(order.weaverId, {
        weaverId: order.weaverId,
        weaverName: `${order.weaver.firstName} ${order.weaver.lastName}`,
        zigIds: [],
        returnIds: [],
        yarnGivenIds: [],
        saleIds: [],
        preview: {
          lineItems: [],
          yarnDebits: [],
          saleAdjustments: [],
          netSettlement: 0,
        },
      });
    }
    const bundle = byWeaver.get(order.weaverId)!;
    if (!bundle.zigIds.includes(order.zigId)) {
      bundle.zigIds.push(order.zigId);
    }
  }

  for (const [weaverId, bundle] of byWeaver) {
    const weaverReturns = returns.filter(
      (r) => r.workOrder.weaverId === weaverId && eligibleZigIds.has(r.zigId),
    );
    const weaverZigSet = new Set(bundle.zigIds);
    const weaverYarn = yarnGiven.filter((y) => weaverZigSet.has(y.zigId));

    bundle.returnIds = weaverReturns.map((r) => r.returnId);
    bundle.yarnGivenIds = weaverYarn.map((y) => y.yarnGivenId);

    if (bundle.returnIds.length === 0 && bundle.yarnGivenIds.length === 0) {
      byWeaver.delete(weaverId);
      continue;
    }

    bundle.preview = buildSettlementPreview({
      returns: weaverReturns.map((row) => ({
        returnId: row.returnId,
        zigId: row.zigId,
        fabricVariantId: row.fabricVariantId,
        quantityReturned: row.quantityReturned,
        totalWeight: Number(row.totalWeight),
        unitPrice: Number(row.unitPrice),
        qualityRule: row.fabricVariant.qualityRule
          ? { minWeightThreshold: Number(row.fabricVariant.qualityRule.minWeightThreshold) }
          : null,
        bonusRule: null,
      })),
      yarnGiven: weaverYarn.map((row) => ({
        yarnGivenId: row.yarnGivenId,
        zigId: row.zigId,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      })),
      sales: [],
    });
  }

  return [...byWeaver.values()];
}

export async function batchCommitSettlements(
  recordedByUserId: number,
  paymentMethod?: string,
  settlementPreviewId?: string,
  cutoffDate?: Date | null,
) {
  const bundles = await discoverReturnedSettlementBundles(cutoffDate);
  const payments: Array<{
    paymentId: number;
    weaverId: number;
    weaverName: string;
    amount: number;
    reconciledZigIds: string[];
  }> = [];

  for (const bundle of bundles) {
    if (bundle.returnIds.length === 0) continue;

    const result = await commitSettlement({
      weaverId: bundle.weaverId,
      returnIds: bundle.returnIds,
      yarnGivenIds: bundle.yarnGivenIds,
      saleIds: [],
      paymentMethod: paymentMethod ?? "Recorded",
      notes: settlementPreviewId
        ? `Batch settlement — preview ${settlementPreviewId}`
        : "Batch settlement — returned zigs",
      recordedByUserId,
    });

    if (settlementPreviewId) {
      await prisma.payment.update({
        where: { paymentId: result.paymentId },
        data: { settlementPreviewId },
      });
    }

    await createWeaverPayoutTransaction({
      linkedPaymentId: result.paymentId,
      weaverId: bundle.weaverId,
      amount: result.amount,
      notes: settlementPreviewId
        ? `Settlement preview ${settlementPreviewId}`
        : undefined,
      recordedByUserId,
    });

    payments.push({
      paymentId: result.paymentId,
      weaverId: bundle.weaverId,
      weaverName: bundle.weaverName,
      amount: result.amount,
      reconciledZigIds: result.reconciledZigIds,
    });
  }

  const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  return { payments, grandTotal, weaverCount: payments.length };
}