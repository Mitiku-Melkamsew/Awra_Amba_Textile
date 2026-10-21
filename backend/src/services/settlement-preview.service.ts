import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { numberToAmharicWords } from "../utils/amharic-words.js";
import { formatDateDDMMYY } from "../utils/format-date.js";
import {
  batchCommitSettlements,
  discoverReturnedSettlementBundles,
} from "./batch-settlement.service.js";

export async function generateNextPreviewId(): Promise<string> {
  const rows = await prisma.settlementPreview.findMany({
    select: { previewId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  let max = 0;
  for (const row of rows) {
    const match = row.previewId.match(/^prev-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `prev-${max + 1}`;
}

function fabricTypeLabel(fabricVariant: {
  product: { name: string };
  warpColor: { name: string };
  weftColor: { name: string };
  design: { name: string } | null;
}): string {
  const parts = [fabricVariant.product.name];
  if (fabricVariant.warpColor?.name && fabricVariant.warpColor.name !== "Default") {
    parts.push(`warp:${fabricVariant.warpColor.name}`);
  }
  if (fabricVariant.weftColor?.name && fabricVariant.weftColor.name !== "Default") {
    parts.push(`weft:${fabricVariant.weftColor.name}`);
  }
  if (fabricVariant.design) parts.push(fabricVariant.design.name);
  return parts.join(" · ");
}

export async function buildDetailedBatchSnapshot(cutoffDate?: Date | null) {
  const bundles = await discoverReturnedSettlementBundles(cutoffDate);
  const returnIds = bundles.flatMap((b) => b.returnIds);
  const yarnIds = bundles.flatMap((b) => b.yarnGivenIds);

  const [returns, yarnRows] = await Promise.all([
    prisma.fabricReturn.findMany({
      where: { returnId: { in: returnIds } },
      include: {
        fabricVariant: {
          include: { product: true, warpColor: true, weftColor: true, design: true },
        },
      },
      orderBy: [{ zigId: "asc" }, { returnId: "asc" }],
    }),
    prisma.yarnGiven.findMany({
      where: { yarnGivenId: { in: yarnIds } },
      include: {
        yarnVariant: { include: { yarnType: true, color: true } },
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

      const yarnQty = zigYarn.reduce((sum, y) => sum + Number(y!.quantity), 0);
      const yarnTotal = Math.round(
        zigYarn.reduce((sum, y) => sum + Number(y!.quantity) * Number(y!.unitPrice), 0),
      );
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
          const avgWeight = row!.quantityReturned > 0 ? Number(row!.totalWeight) / row!.quantityReturned : 0;
          return {
            returnId: row!.returnId,
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
        yarnAvgPrice: yarnQty > 0 ? Math.round(yarnTotal / yarnQty) : 0,
        fabricTotal,
        netProfit,
      };
    });

    return {
      weaverId: bundle.weaverId,
      weaverName: bundle.weaverName,
      zigIds: bundle.zigIds,
      returnIds: bundle.returnIds,
      yarnGivenIds: bundle.yarnGivenIds,
      saleIds: bundle.saleIds,
      returnCount: bundle.returnIds.length,
      yarnCount: bundle.yarnGivenIds.length,
      netSettlement: Math.round(bundle.preview.netSettlement),
      lineItems: bundle.preview.lineItems,
      yarnDebits: bundle.preview.yarnDebits,
      zigDetails,
    };
  });

  const grandTotal = Math.round(weavers.reduce((sum, w) => sum + w.netSettlement, 0));

  return {
    weavers,
    weaverCount: weavers.length,
    grandTotal,
    amharicAmountInWords: numberToAmharicWords(grandTotal),
    generatedAt: new Date().toISOString(),
    cutoffDate: cutoffDate ? cutoffDate.toISOString() : null,
  };
}

export async function createSettlementPreview(createdByUserId: number, cutoffDate?: Date | null) {
  const snapshot = await buildDetailedBatchSnapshot(cutoffDate);
  const previewId = await generateNextPreviewId();

  const row = await prisma.settlementPreview.create({
    data: {
      previewId,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
      createdByUserId,
    },
  });

  return { previewId: row.previewId, ...snapshot };
}

export function snapshotToCsv(snapshot: Awaited<ReturnType<typeof buildDetailedBatchSnapshot>>): string {
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

      const lines = zig.returns.length > 0 ? zig.returns : [null];
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

  // Empty spacer row
  const emptyRow: Record<string, string> = {};
  header.forEach((h) => {
    emptyRow[h] = "";
  });

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

  // Empty spacer row
  lines.push(header.map(() => "").join(","));

  // Grand Totals row
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

  // Amharic Amount Text row
  const amharicAmount = numberToAmharicWords(Math.round(grandNetProfit));
  lines.push(
    [
      `"ጠቅላላ ተከፋይ ${amharicAmount}"`,
      ...new Array(15).fill(""),
    ].join(","),
  );

  // 2 spacer rows
  lines.push(header.map(() => "").join(","));
  lines.push(header.map(() => "").join(","));

  // Signature Block
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

function bundleFingerprint(bundle: {
  returnIds: number[];
  yarnGivenIds: number[];
  netSettlement: number;
}) {
  return {
    returnIds: [...bundle.returnIds].sort((a, b) => a - b),
    yarnGivenIds: [...bundle.yarnGivenIds].sort((a, b) => a - b),
    netSettlement: bundle.netSettlement,
  };
}

export async function commitSettlementPreview(
  previewId: string,
  recordedByUserId: number,
  paymentMethod?: string,
  cutoffDate?: Date | null,
) {
  const preview = await prisma.settlementPreview.findUnique({
    where: { previewId },
  });
  if (!preview) {
    throw new Error("NOT_FOUND:Settlement preview not found.");
  }
  if (preview.status !== "draft") {
    throw new Error("CONFLICT:This preview was already committed.");
  }

  const snapshot = preview.snapshot as unknown as Awaited<
    ReturnType<typeof buildDetailedBatchSnapshot>
  >;

  // Use stored cutoff date if not provided
  const effectiveCutoff = cutoffDate ?? (snapshot.cutoffDate ? new Date(snapshot.cutoffDate) : null);
  const current = await buildDetailedBatchSnapshot(effectiveCutoff);

  if (current.weaverCount !== snapshot.weaverCount) {
    throw new Error("CONFLICT:Settlement data changed since preview. Generate a new preview.");
  }

  for (const snapWeaver of snapshot.weavers) {
    const cur = current.weavers.find((w) => w.weaverId === snapWeaver.weaverId);
    if (!cur) {
      throw new Error("CONFLICT:Weaver missing from current settlement. Regenerate preview.");
    }
    const a = bundleFingerprint(snapWeaver);
    const b = bundleFingerprint(cur);
    if (
      JSON.stringify(a.returnIds) !== JSON.stringify(b.returnIds) ||
      JSON.stringify(a.yarnGivenIds) !== JSON.stringify(b.yarnGivenIds) ||
      Math.abs(a.netSettlement - b.netSettlement) > 0.01
    ) {
      throw new Error("CONFLICT:Settlement amounts changed since preview. Regenerate preview.");
    }
  }

  const result = await batchCommitSettlements(
    recordedByUserId,
    paymentMethod,
    previewId,
    effectiveCutoff,
  );

  await prisma.settlementPreview.update({
    where: { previewId },
    data: { status: "committed", committedAt: new Date() },
  });

  return { previewId, ...result };
}