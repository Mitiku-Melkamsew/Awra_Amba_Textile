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
  parts.push(`warp:${fabricVariant.warpColor.name}`);
  parts.push(`weft:${fabricVariant.weftColor.name}`);
  if (fabricVariant.design) parts.push(fabricVariant.design.name);
  return parts.join(" · ");
}

export async function buildDetailedBatchSnapshot() {
  const bundles = await discoverReturnedSettlementBundles();
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
      const yarnTotal = zigYarn.reduce(
        (sum, y) => sum + Number(y!.quantity) * Number(y!.unitPrice),
        0,
      );
      const fabricTotal = bundle.preview.lineItems
        .filter((li) => li.zigId === zigId)
        .reduce((sum, li) => sum + li.netCredit, 0);

      return {
        zigId,
        returns: zigReturns.map((row) => ({
          returnId: row!.returnId,
          fabricType: fabricTypeLabel(row!.fabricVariant),
          quantityReturned: row!.quantityReturned,
          totalWeight: Number(row!.totalWeight),
          avgWeight: Number(row!.totalWeight) / row!.quantityReturned,
          unitPrice: Number(row!.unitPrice),
          netCredit:
            bundle.preview.lineItems.find((li) => li.returnId === row!.returnId)?.netCredit ?? 0,
          deductionPerPiece:
            bundle.preview.lineItems.find((li) => li.returnId === row!.returnId)
              ?.deductionPerPiece ?? 0,
          bonusAmount:
            bundle.preview.lineItems.find((li) => li.returnId === row!.returnId)?.bonusAmount ?? 0,
        })),
        yarnQty,
        yarnTotal,
        yarnAvgPrice: yarnQty > 0 ? yarnTotal / yarnQty : 0,
        fabricTotal,
        netProfit: fabricTotal - yarnTotal,
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
      netSettlement: bundle.preview.netSettlement,
      lineItems: bundle.preview.lineItems,
      yarnDebits: bundle.preview.yarnDebits,
      zigDetails,
    };
  });

  const grandTotal = weavers.reduce((sum, w) => sum + w.netSettlement, 0);

  return {
    weavers,
    weaverCount: weavers.length,
    grandTotal,
    amharicAmountInWords: numberToAmharicWords(Math.round(grandTotal)),
    generatedAt: new Date().toISOString(),
  };
}

export async function createSettlementPreview(createdByUserId: number) {
  const snapshot = await buildDetailedBatchSnapshot();
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
    "return_id",
    "fabric_type",
    "fabric_qty",
    "avg_weight",
    "base_price",
    "deduction",
    "bonus",
    "line_net",
    "zig_yarn_qty",
    "zig_yarn_total",
    "zig_net_profit",
    "weaver_total_net",
  ];

  const lines: string[] = [
    `Preview date: ${formatDateDDMMYY(snapshot.generatedAt)}`,
    `Grand total: ${snapshot.grandTotal}`,
    "",
    header.join(","),
  ];

  for (const weaver of snapshot.weavers) {
    for (const zig of weaver.zigDetails) {
      for (const ret of zig.returns) {
        lines.push(
          [
            weaver.weaverId,
            weaver.weaverName,
            zig.zigId,
            ret.returnId,
            ret.fabricType,
            ret.quantityReturned,
            ret.avgWeight.toFixed(2),
            ret.unitPrice,
            ret.deductionPerPiece,
            ret.bonusAmount,
            ret.netCredit,
            zig.yarnQty,
            zig.yarnTotal.toFixed(2),
            zig.netProfit.toFixed(2),
            weaver.netSettlement,
          ]
            .map((value) => {
              const text = String(value ?? "");
              return text.includes(",") ? `"${text}"` : text;
            })
            .join(","),
        );
      }
      if (zig.returns.length === 0) {
        lines.push(
          [
            weaver.weaverId,
            weaver.weaverName,
            zig.zigId,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            zig.yarnQty,
            zig.yarnTotal.toFixed(2),
            zig.netProfit.toFixed(2),
            weaver.netSettlement,
          ].join(","),
        );
      }
    }
  }

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
  const current = await buildDetailedBatchSnapshot();

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

  const result = await batchCommitSettlements(recordedByUserId, paymentMethod, previewId);

  await prisma.settlementPreview.update({
    where: { previewId },
    data: { status: "committed", committedAt: new Date() },
  });

  return { previewId, ...result };
}