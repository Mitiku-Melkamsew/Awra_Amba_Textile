import { prisma } from "../lib/prisma.js";
import { buildSettlementPreview, type SettlementPreview } from "./calculation.service.js";
import { commitSettlement } from "./settlement.service.js";

export interface WeaverSettlementBundle {
  weaverUserId: number;
  weaverName: string;
  zigIds: string[];
  returnIds: number[];
  yarnGivenIds: number[];
  preview: SettlementPreview;
}

export async function discoverReturnedSettlementBundles(cutoffDate?: Date | null) {
  // 1. Get all returned work orders
  const returnedOrders = await prisma.workOrder.findMany({
    where: { status: "returned" },
    include: { weaver: true },
    orderBy: [{ weaverUserId: "asc" }, { zigId: "asc" }],
  });

  const zigIds = returnedOrders.map((o) => o.zigId);
  if (zigIds.length === 0) return [];

  // 2. Fetch unsettled fabric returns and yarn given for these zigs
  const [returns, yarnGiven, yarnReturns, qualityRules, fabricReturnsToWeaver] = await Promise.all([
    prisma.fabricReturn.findMany({
      where: {
        zigId: { in: zigIds },
        settlementLineReturns: { none: {} },
      },
      include: {
        fabricVariant: {
          include: {
            fabric: true,
          },
        },
        workOrder: { include: { weaver: true } },
      },
      orderBy: [{ zigId: "asc" }, { returnId: "asc" }],
    }),
    prisma.yarnGiven.findMany({
      where: { zigId: { in: zigIds } },
      orderBy: { yarnGivenId: "asc" },
    }),
    prisma.yarnReturn.findMany({
      where: { zigId: { in: zigIds } },
    }),
    prisma.qualityRule.findMany({
      where: { isActive: true },
    }),
    prisma.fabricReturnToWeaver.findMany({
      where: { zigId: { in: zigIds } },
    }),
  ]);

  const weightRule = qualityRules.find((q) => q.factor === "weight");

  // 3. Optional cutoff filter by first return date
  const firstReturnDateByZig = new Map<string, Date>();
  for (const ret of returns) {
    const existing = firstReturnDateByZig.get(ret.zigId);
    const retDate = new Date(ret.dateReturned);
    if (!existing || retDate < existing) {
      firstReturnDateByZig.set(ret.zigId, retDate);
    }
  }

  const eligibleZigIds = new Set(
    returnedOrders
      .filter((o) => {
        if (!cutoffDate) return true;
        const firstReturn = firstReturnDateByZig.get(o.zigId);
        if (!firstReturn) return false;
        const cutoffEnd = new Date(cutoffDate);
        cutoffEnd.setHours(23, 59, 59, 999);
        return firstReturn <= cutoffEnd;
      })
      .map((o) => o.zigId),
  );

  const eligibleOrders = returnedOrders.filter((o) => eligibleZigIds.has(o.zigId));
  const byWeaver = new Map<number, WeaverSettlementBundle>();

  for (const order of eligibleOrders) {
    if (!byWeaver.has(order.weaverUserId)) {
      byWeaver.set(order.weaverUserId, {
        weaverUserId: order.weaverUserId,
        weaverName: order.weaver.fullName,
        zigIds: [],
        returnIds: [],
        yarnGivenIds: [],
        preview: {
          lineItems: [],
          groupedLines: [],
          yarnLines: [],
          yarnDebits: [],
          grossFabricValue: 0,
          totalDeductions: 0,
          totalYarnCost: 0,
          netSettlement: 0,
          isBlocked: false,
          blockReasons: [],
          saleAdjustments: [],
        },
      });
    }
    const bundle = byWeaver.get(order.weaverUserId)!;
    if (!bundle.zigIds.includes(order.zigId)) {
      bundle.zigIds.push(order.zigId);
    }
  }

  for (const [weaverUserId, bundle] of byWeaver) {
    const weaverReturns = returns.filter(
      (r) => r.workOrder.weaverUserId === weaverUserId && eligibleZigIds.has(r.zigId),
    );
    const weaverZigSet = new Set(bundle.zigIds);
    const weaverYarn = yarnGiven.filter((y) => weaverZigSet.has(y.zigId));
    const weaverYarnReturns = yarnReturns.filter((yr) => weaverZigSet.has(yr.zigId));

    bundle.returnIds = weaverReturns.map((r) => r.returnId);
    bundle.yarnGivenIds = weaverYarn.map((y) => y.yarnGivenId);

    bundle.preview = buildSettlementPreview({
      returns: weaverReturns.map((r) => ({
        returnId: r.returnId,
        zigId: r.zigId,
        fabricId: r.fabricVariant.fabricId,
        fabricName: r.fabricVariant.fabric.name,
        fabricVariantId: r.fabricVariantId,
        quantityReturned: r.quantityReturned,
        totalWeight: Number(r.totalWeight),
        excludedQuantity: fabricReturnsToWeaver
          .filter((excluded) =>
            excluded.zigId === r.zigId && excluded.fabricVariantId === r.fabricVariantId)
          .reduce((sum, excluded) => sum + excluded.quantity, 0),
        unitPrice: Number(r.unitPrice),
        standardWeightG: Number(r.fabricVariant.fabric.standardWeightG),
        qualityRule: weightRule
          ? {
              minWeightThreshold: Number(r.fabricVariant.fabric.standardWeightG),
              deductionRatePerUnit: Number(weightRule.deductionPerUnit),
            }
          : undefined,
      })),
      yarnGiven: weaverYarn.map((y) => ({
        yarnGivenId: y.yarnGivenId,
        zigId: y.zigId,
        yarnVariantId: y.yarnVariantId,
        quantity: Number(y.quantity),
        unitPrice: Number(y.unitPrice),
      })),
      yarnReturns: weaverYarnReturns.map((yr) => ({
        yarnVariantId: yr.yarnVariantId,
        zigId: yr.zigId,
        quantity: Number(yr.quantity),
      })),
    });
  }

  return [...byWeaver.values()].filter((b) => b.returnIds.length > 0);
}

export async function batchCommitSettlements(params: {
  bundles: WeaverSettlementBundle[];
  recordedByUserId: number;
  paymentMethod?: string;
}) {
  const results = [];
  for (const bundle of params.bundles) {
    if (bundle.preview.isBlocked) {
      continue;
    }
    const result = await commitSettlement({
      weaverUserId: bundle.weaverUserId,
      returnIds: bundle.returnIds,
      yarnGivenIds: bundle.yarnGivenIds,
      paymentMethod: params.paymentMethod,
      recordedByUserId: params.recordedByUserId,
    });
    results.push(result);
  }
  return results;
}
