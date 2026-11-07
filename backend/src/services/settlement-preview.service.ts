import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { numberToAmharicWords } from "../utils/amharic-words.js";
import { formatDateDDMMYY } from "../utils/format-date.js";
import { groupReturnsByFabricType } from "./fabric-line-grouping.js";
import type { LineOverride } from "./calculation.service.js";
import {
  batchCommitSettlements,
  discoverReturnedSettlementBundles,
} from "./batch-settlement.service.js";

function fabricTypeLabel(fabricVariant: {
  fabric: { name: string };
  warpColor: { name: string };
  weftColor: { name: string };
  design: { name: string } | null;
}): string {
  const parts = [fabricVariant.fabric.name];
  if (fabricVariant.warpColor?.name && fabricVariant.warpColor.name !== "Default") {
    parts.push(`warp:${fabricVariant.warpColor.name}`);
  }
  if (fabricVariant.weftColor?.name && fabricVariant.weftColor.name !== "Default") {
    parts.push(`weft:${fabricVariant.weftColor.name}`);
  }
  if (fabricVariant.design) parts.push(fabricVariant.design.name);
  return parts.join(" · ");
}

export function summarizeYarnLines(
  yarnLines: Array<{ zigId: string; netQuantity: number; totalCost: number }>,
  zigId: string,
) {
  const lines = yarnLines.filter((line) => line.zigId === zigId);
  const quantity = lines.reduce((sum, line) => sum + line.netQuantity, 0);
  const total = Number(lines.reduce((sum, line) => sum + line.totalCost, 0).toFixed(2));
  return {
    quantity,
    total,
    averagePrice: quantity > 0 ? Math.round(total / quantity) : 0,
  };
}

export async function buildDetailedBatchSnapshot(
  cutoffDate?: Date | null,
  overrides: LineOverride[] = [],
) {
  const bundles = await discoverReturnedSettlementBundles(cutoffDate, overrides);
  const returnIds = bundles.flatMap((b) => b.returnIds);
  const yarnIds = bundles.flatMap((b) => b.yarnGivenIds);

  const [returns, yarnRows] = await Promise.all([
    prisma.fabricReturn.findMany({
      where: { returnId: { in: returnIds } },
      include: {
        fabricVariant: {
          include: { fabric: true, warpColor: true, weftColor: true, design: true },
        },
      },
      orderBy: [{ zigId: "asc" }, { returnId: "asc" }],
    }),
    prisma.yarnGiven.findMany({
      where: { yarnGivenId: { in: yarnIds } },
      include: {
        yarnVariant: { include: { yarn: true, color: true } },
      },
      orderBy: { yarnGivenId: "asc" },
    }),
  ]);

  const returnById = new Map(returns.map((r) => [r.returnId, r]));
  const yarnById = new Map(yarnRows.map((y) => [y.yarnGivenId, y]));

  const weavers = bundles.map((bundle) => {
    const zigDetails = bundle.zigIds.map((zigId) => {
      const zigReturns = bundle.returnIds
        .map((id) => returnById.get(id))
        .filter((r) => r && r.zigId === zigId);
      const zigYarn = bundle.yarnGivenIds
        .map((id) => yarnById.get(id))
        .filter((y) => y && y.zigId === zigId);

      const { quantity: yarnQty, total: yarnTotal, averagePrice: yarnAvgPrice } =
        summarizeYarnLines(bundle.preview.yarnLines, zigId);
      const fabricTotal = Math.round(
        bundle.preview.lineItems
          .filter((li) => li.zigId === zigId)
          .reduce((sum, li) => sum + li.netCredit, 0),
      );
      const netProfit = fabricTotal - yarnTotal;

      return {
        zigId,
        returns: zigReturns.map((row) => {
          const li = bundle.preview.lineItems.find((item) => item.returnId === row!.returnId);
          const deduction = li?.deductionPerPiece ?? 0;
          const adjustedPrice = Math.round(Number(row!.unitPrice) - deduction);
          const avgWeight =
            row!.quantityReturned > 0
              ? Number(row!.totalWeight) / row!.quantityReturned
              : 0;
          return {
            returnId: row!.returnId,
            fabricVariantId: row!.fabricVariantId,
            fabricType: fabricTypeLabel(row!.fabricVariant),
            quantityReturned: row!.quantityReturned,
            totalWeight: Number(row!.totalWeight),
            avgWeight: Math.floor(avgWeight),
            unitPrice: Number(row!.unitPrice),
            deductionPerPiece: deduction,
            adjustedPrice,
            lineSubtotal: li?.netCredit ?? Math.round(adjustedPrice * row!.quantityReturned),
            bonusAmount: 0,
            netCredit: li?.netCredit ?? 0,
          };
        }),
        yarnQty,
        yarnTotal,
        yarnAvgPrice,
        fabricTotal,
        netProfit,
      };
    });

    return {
      weaverId: bundle.weaverUserId,
      weaverName: bundle.weaverName,
      zigIds: bundle.zigIds,
      returnIds: bundle.returnIds,
      yarnGivenIds: bundle.yarnGivenIds,
      overrides: bundle.overrides,
      saleIds: [],
      returnCount: bundle.returnIds.length,
      yarnCount: bundle.yarnGivenIds.length,
      netSettlement: Number(bundle.preview.netSettlement.toFixed(2)),
      lineItems: bundle.preview.lineItems,
      yarnDebits: bundle.preview.yarnDebits,
      zigDetails,
      isBlocked: bundle.preview.isBlocked,
      blockReasons: bundle.preview.blockReasons,
    };
  });

  const grandTotal = Number(weavers.reduce((sum, w) => sum + w.netSettlement, 0).toFixed(2));

  return {
    weavers,
    weaverCount: weavers.length,
    grandTotal,
    amharicAmountInWords: numberToAmharicWords(grandTotal),
    generatedAt: new Date().toISOString(),
    cutoffDate: cutoffDate ? cutoffDate.toISOString() : null,
  };
}

export type BatchSnapshot = Awaited<ReturnType<typeof buildDetailedBatchSnapshot>>;

export function withGroupedReturns(snapshot: BatchSnapshot) {
  return {
    ...snapshot,
    weavers: snapshot.weavers.map((weaver) => ({
      ...weaver,
      zigDetails: weaver.zigDetails.map((zig) => ({
        ...zig,
        groupedReturns: groupReturnsByFabricType(zig.returns),
      })),
    })),
  };
}

export async function createSettlementPreview(
  createdByUserId: number,
  cutoffDate?: Date | null,
  overrides: LineOverride[] = [],
) {
  const snapshot = await buildDetailedBatchSnapshot(cutoffDate, overrides);
  const persistedSnapshot = withGroupedReturns(snapshot);
  const batch = await prisma.settlementBatch.create({
    data: {
      snapshot: persistedSnapshot as unknown as Prisma.InputJsonValue,
      totalAmount: snapshot.grandTotal,
      createdByUserId,
    },
  });
  return {
    batchId: batch.batchId,
    previewId: String(batch.batchId),
    status: batch.status,
    ...persistedSnapshot,
    generatedAt: batch.createdAt,
  };
}

export function snapshotToCsv(snapshot: BatchSnapshot): string {
  const header = [
    "weaver_id",
    "weaver_name",
    "zig_id",
    "fabric_type",
    "fabric_qty",
    "avg_weight",
    "base_price",
    "deduction",
    "adjusted_price",
    "line_subtotal",
    "fabric_total_value",
    "yarn_qty",
    "yarn_avg_price",
    "yarn_total",
    "net_profit",
    "total_net_profit",
  ];

  const rows: Array<Record<string, string | number>> = [];

  let grandFabricQty = 0;
  let grandFabricValue = 0;
  let grandYarnQty = 0;
  let grandYarnTotal = 0;
  let grandNetProfit = 0;

  for (const weaver of snapshot.weavers) {
    const weaverTotal = Math.round(weaver.netSettlement);
    let firstRowForWeaver = true;

    for (const zig of weaver.zigDetails) {
      const zigFabricTotal = Math.round(zig.fabricTotal);
      const zigYarnQty = zig.yarnQty;
      const zigYarnTotal = Math.round(zig.yarnTotal);
      const zigYarnAvgPrice = zig.yarnAvgPrice;
      const zigNetProfit = Math.round(zig.netProfit);

      grandFabricValue += zigFabricTotal;
      grandYarnQty += zigYarnQty;
      grandYarnTotal += zigYarnTotal;
      grandNetProfit += zigNetProfit;

      const grouped = groupReturnsByFabricType(zig.returns);
      const lines = grouped.length > 0 ? grouped : [null];
      let firstRowForZig = true;

      for (const line of lines) {
        if (line) {
          grandFabricQty += line.quantityReturned;
        }

        rows.push({
          weaver_id: firstRowForWeaver ? weaver.weaverId : "",
          weaver_name: firstRowForWeaver ? weaver.weaverName : "",
          zig_id: firstRowForZig ? zig.zigId : "",
          fabric_type: line ? line.fabricType : "",
          fabric_qty: line ? line.quantityReturned : "",
          avg_weight: line ? line.avgWeight : "",
          base_price: line ? line.unitPrice : "",
          deduction: line ? line.deductionPerPiece : "",
          adjusted_price: line ? line.adjustedPrice : "",
          line_subtotal: line ? line.lineSubtotal : "",
          fabric_total_value: firstRowForZig ? zigFabricTotal : "",
          yarn_qty: firstRowForZig ? zigYarnQty : "",
          yarn_avg_price: firstRowForZig ? zigYarnAvgPrice : "",
          yarn_total: firstRowForZig ? zigYarnTotal : "",
          net_profit: firstRowForZig ? zigNetProfit : "",
          total_net_profit: firstRowForWeaver ? weaverTotal : "",
        });

        firstRowForWeaver = false;
        firstRowForZig = false;
      }
    }
  }

  const lines: string[] = [
    `ቀን: ${snapshot.cutoffDate ? formatDateDDMMYY(snapshot.cutoffDate) : "____________________"}`,
    "",
    header.join(","),
  ];

  for (const row of rows) {
    lines.push(
      header
        .map((k) => {
          const text = String(row[k] ?? "");
          return text.includes(",") ? `"${text}"` : text;
        })
        .join(","),
    );
  }

  lines.push(header.map(() => "").join(","));

  lines.push(
    [
      "",
      "ድምር",
      "",
      "",
      grandFabricQty,
      "",
      "",
      "",
      "",
      "",
      grandFabricValue,
      grandYarnQty,
      "",
      grandYarnTotal,
      grandNetProfit,
      grandNetProfit,
    ].join(","),
  );

  const amharicAmount = numberToAmharicWords(Math.round(grandNetProfit));
  lines.push(
    [
      `"ጠቅላላ ተከፋይ ${amharicAmount}"`,
      ...new Array(15).fill(""),
    ].join(","),
  );

  lines.push(header.map(() => "").join(","));
  lines.push(header.map(() => "").join(","));

  lines.push(
    [
      "",
      "ክፍያውን ያዘጋጀው",
      "የገንዘብ ከፋይ",
      "ክፍያውን ያጸደቀው",
      ...new Array(12).fill(""),
    ].join(","),
  );
  lines.push(["ስም", ...new Array(15).fill("")].join(","));
  lines.push(["ፊርማ", ...new Array(15).fill("")].join(","));

  return `\uFEFF${lines.join("\n")}`;
}

export async function exportBatchSettlementCsv(batchId: number): Promise<string | null> {
  const batch = await prisma.settlementBatch.findUnique({
    where: { batchId },
    select: { snapshot: true },
  });
  if (!batch) return null;
  return snapshotToCsv(batch.snapshot as unknown as BatchSnapshot);
}

export async function commitBatchSettlementPreview(params: {
  recordedByUserId: number;
  paymentMethod?: string;
  cutoffDate?: Date | null;
  batchId?: number;
}) {
  const bundles = await discoverReturnedSettlementBundles(params.cutoffDate);
  const eligibleBundles = bundles.filter((b) => !b.preview.isBlocked);
  return batchCommitSettlements({
    bundles: eligibleBundles,
    batchId: params.batchId,
    recordedByUserId: params.recordedByUserId,
    paymentMethod: params.paymentMethod,
  });
}

export async function listCommittedSettlements() {
  const rows = await prisma.settlement.findMany({
    where: { status: "paid" },
    orderBy: { paidAt: "desc" },
    take: 200,
    include: {
      weaver: { select: { fullName: true, username: true } },
      createdBy: { select: { username: true } },
      payments: true,
      lines: true,
    },
  });

  return rows.map((row) => ({
    settlementId: row.settlementId,
    weaverUserId: row.weaverUserId,
    weaverName: row.weaver.fullName,
    createdAt: row.createdAt,
    paidAt: row.paidAt,
    netAmount: Number(row.netAmount),
    grossFabricValue: Number(row.grossFabricValue),
    totalDeductions: Number(row.totalDeductions),
    totalYarnCost: Number(row.totalYarnCost),
    paymentCount: row.payments.length,
    payments: row.payments.map((p) => ({
      paymentId: p.settlementPaymentId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
    })),
  }));
}
