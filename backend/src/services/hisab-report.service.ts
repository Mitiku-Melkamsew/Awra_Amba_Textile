import { prisma } from "../lib/prisma.js";
import { numberToAmharicWords } from "../utils/amharic-words.js";
import { formatDateDDMMYY } from "../utils/format-date.js";

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

export interface HisabRow {
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
}

function zigSortKey(zigId: string): number {
  const match = zigId.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export async function buildHisabReport(paymentId: number) {
  const payment = await prisma.payment.findUnique({
    where: { paymentId },
    include: {
      weaver: true,
      fabricReturns: {
        include: {
          fabricVariant: {
            include: { product: true, warpColor: true, weftColor: true, design: true },
          },
          workOrder: true,
        },
        orderBy: [{ zigId: "asc" }, { returnId: "asc" }],
      },
      yarnGiven: {
        include: { workOrder: true },
        orderBy: { yarnGivenId: "asc" },
      },
    },
  });

  if (!payment) {
    throw new Error("CONFLICT:Payment not found.");
  }

  const rows: HisabRow[] = [];
  const zigIds = [...new Set(payment.fabricReturns.map((row) => row.zigId))].sort(
    (a, b) => zigSortKey(a) - zigSortKey(b),
  );

  const yarnByZig = new Map<string, typeof payment.yarnGiven>();
  for (const yarn of payment.yarnGiven) {
    const list = yarnByZig.get(yarn.zigId) ?? [];
    list.push(yarn);
    yarnByZig.set(yarn.zigId, list);
  }

  const returnsByZig = new Map<string, typeof payment.fabricReturns>();
  for (const row of payment.fabricReturns) {
    const list = returnsByZig.get(row.zigId) ?? [];
    list.push(row);
    returnsByZig.set(row.zigId, list);
  }

  const weaverName = `${payment.weaver.firstName} ${payment.weaver.lastName}`;
  let firstWeaverRow = true;

  const zigTotals = zigIds.map((zigId) => {
    const zigReturns = returnsByZig.get(zigId) ?? [];
    const zigYarn = yarnByZig.get(zigId) ?? [];
    const yarnQty = zigYarn.reduce((sum, row) => sum + Number(row.quantity), 0);
    const yarnTotal = zigYarn.reduce(
      (sum, row) => sum + Number(row.quantity) * Number(row.unitPrice),
      0,
    );
    const fabricTotalValue = zigReturns.reduce(
      (sum, row) => sum + Number(row.netCreditValue ?? 0),
      0,
    );
    return {
      zigId,
      zigReturns,
      yarnQty,
      yarnTotal,
      yarnAvgPrice: yarnQty > 0 ? yarnTotal / yarnQty : 0,
      fabricTotalValue,
      netProfit: fabricTotalValue - yarnTotal,
    };
  });

  const weaverNetTotal = zigTotals.reduce((sum, zig) => sum + zig.netProfit, 0);

  for (const zig of zigTotals) {
    const { zigId, zigReturns, yarnQty, yarnTotal, yarnAvgPrice, fabricTotalValue, netProfit } =
      zig;

    let firstZigRow = true;
    for (const fabricRow of zigReturns) {
      const avgWeight =
        fabricRow.quantityReturned > 0
          ? Math.floor(Number(fabricRow.totalWeight) / fabricRow.quantityReturned)
          : 0;
      const deduction = Number(fabricRow.calculatedDeduction ?? 0);
      const unitPrice = Number(fabricRow.unitPrice);
      const adjustedPrice = unitPrice - deduction;
      const lineSubtotal =
        Number(fabricRow.netCreditValue ?? 0) - Number(fabricRow.bonusAmount ?? 0);

      rows.push({
        weaverId: firstWeaverRow ? payment.weaverId : "",
        weaverName: firstWeaverRow ? weaverName : "",
        zigId: firstZigRow ? zigId : "",
        fabricType: fabricTypeLabel(fabricRow.fabricVariant),
        fabricQty: fabricRow.quantityReturned,
        avgWeight,
        basePrice: unitPrice,
        deduction,
        adjustedPrice,
        lineSubtotal,
        fabricTotalValue: firstZigRow ? fabricTotalValue : "",
        yarnQty: firstZigRow ? yarnQty : "",
        yarnAvgPrice: firstZigRow ? Math.round(yarnAvgPrice) : "",
        yarnTotal: firstZigRow ? yarnTotal : "",
        netProfit: firstZigRow ? netProfit : "",
        totalNetProfit: firstWeaverRow && firstZigRow ? weaverNetTotal : "",
      });
      if (firstZigRow) firstWeaverRow = false;
      firstZigRow = false;
    }
  }

  const grandFabricQty = payment.fabricReturns.reduce(
    (sum, row) => sum + row.quantityReturned,
    0,
  );
  const grandFabricValue = payment.fabricReturns.reduce(
    (sum, row) => sum + Number(row.netCreditValue ?? 0),
    0,
  );
  const grandYarnQty = payment.yarnGiven.reduce(
    (sum, row) => sum + Number(row.quantity),
    0,
  );
  const grandYarnTotal = payment.yarnGiven.reduce(
    (sum, row) => sum + Number(row.quantity) * Number(row.unitPrice),
    0,
  );
  const grandNet = Number(payment.amount);

  rows.push({
    weaverId: "",
    weaverName: "ድምር",
    zigId: "",
    fabricType: "",
    fabricQty: grandFabricQty,
    avgWeight: "",
    basePrice: "",
    deduction: "",
    adjustedPrice: "",
    lineSubtotal: "",
    fabricTotalValue: grandFabricValue,
    yarnQty: grandYarnQty,
    yarnAvgPrice: "",
    yarnTotal: grandYarnTotal,
    netProfit: grandNet,
    totalNetProfit: grandNet,
  });

  const amharicAmount = numberToAmharicWords(Math.round(grandNet));
  rows.push({
    weaverId: `ጠቅላላ ተከፋይ ${amharicAmount}`,
    weaverName: "",
    zigId: "",
    fabricType: "",
    fabricQty: "",
    avgWeight: "",
    basePrice: "",
    deduction: "",
    adjustedPrice: "",
    lineSubtotal: "",
    fabricTotalValue: "",
    yarnQty: "",
    yarnAvgPrice: "",
    yarnTotal: "",
    netProfit: "",
    totalNetProfit: "",
  });

  rows.push(
    {
      weaverId: "",
      weaverName: "ክፍያውን ያዘጋጀው",
      zigId: "የገንዘብ ከፋይ",
      fabricType: "ክፍያውን ያጸደቀው",
      fabricQty: "",
      avgWeight: "",
      basePrice: "",
      deduction: "",
      adjustedPrice: "",
      lineSubtotal: "",
      fabricTotalValue: "",
      yarnQty: "",
      yarnAvgPrice: "",
      yarnTotal: "",
      netProfit: "",
      totalNetProfit: "",
    },
    {
      weaverId: "ስም",
      weaverName: "",
      zigId: "",
      fabricType: "",
      fabricQty: "",
      avgWeight: "",
      basePrice: "",
      deduction: "",
      adjustedPrice: "",
      lineSubtotal: "",
      fabricTotalValue: "",
      yarnQty: "",
      yarnAvgPrice: "",
      yarnTotal: "",
      netProfit: "",
      totalNetProfit: "",
    },
    {
      weaverId: "ፊርማ",
      weaverName: "",
      zigId: "",
      fabricType: "",
      fabricQty: "",
      avgWeight: "",
      basePrice: "",
      deduction: "",
      adjustedPrice: "",
      lineSubtotal: "",
      fabricTotalValue: "",
      yarnQty: "",
      yarnAvgPrice: "",
      yarnTotal: "",
      netProfit: "",
      totalNetProfit: "",
    },
  );

  return {
    paymentId: payment.paymentId,
    paymentDate: payment.paymentDate,
    weaver: payment.weaver,
    amount: grandNet,
    amharicAmountInWords: amharicAmount,
    rows,
  };
}

export function hisabToCsv(report: Awaited<ReturnType<typeof buildHisabReport>>): string {
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

  const lines = [
    `ቀን: ${formatDateDDMMYY(report.paymentDate)}`,
    "",
    header.join(","),
    ...report.rows.map((row) =>
      [
        row.weaverId,
        row.weaverName,
        row.zigId,
        row.fabricType,
        row.fabricQty,
        row.avgWeight,
        row.basePrice,
        row.deduction,
        row.adjustedPrice,
        row.lineSubtotal,
        row.fabricTotalValue,
        row.yarnQty,
        row.yarnAvgPrice,
        row.yarnTotal,
        row.netProfit,
        row.totalNetProfit,
      ]
        .map((value) => {
          const text = String(value ?? "");
          return text.includes(",") ? `"${text}"` : text;
        })
        .join(","),
    ),
  ];

  return `\uFEFF${lines.join("\n")}`;
}