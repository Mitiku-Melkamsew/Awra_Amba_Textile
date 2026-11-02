import { prisma } from "../lib/prisma.js";
import { numberToAmharicWords } from "../utils/amharic-words.js";
import { formatDateDDMMYY } from "../utils/format-date.js";

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

export async function buildHisabReport(settlementOrPaymentId: number) {
  // Try by settlementId first, fallback to settlementPaymentId
  let settlement = await prisma.settlement.findUnique({
    where: { settlementId: settlementOrPaymentId },
    include: {
      weaver: true,
      lines: {
        include: { fabric: true },
        orderBy: [{ zigId: "asc" }, { settlementLineId: "asc" }],
      },
      yarnLines: {
        include: { yarnVariant: { include: { yarn: true } } },
        orderBy: { settlementYarnLineId: "asc" },
      },
      payments: true,
    },
  });

  if (!settlement) {
    const payment = await prisma.settlementPayment.findUnique({
      where: { settlementPaymentId: settlementOrPaymentId },
      include: {
        settlement: {
          include: {
            weaver: true,
            lines: {
              include: { fabric: true },
              orderBy: [{ zigId: "asc" }, { settlementLineId: "asc" }],
            },
            yarnLines: {
              include: { yarnVariant: { include: { yarn: true } } },
              orderBy: { settlementYarnLineId: "asc" },
            },
            payments: true,
          },
        },
      },
    });
    if (payment?.settlement) {
      settlement = payment.settlement;
    }
  }

  if (!settlement) {
    throw new Error("CONFLICT:Settlement or payment not found.");
  }

  const rows: HisabRow[] = [];
  const zigIds = [...new Set(settlement.lines.map((l) => l.zigId))].sort(
    (a, b) => zigSortKey(a) - zigSortKey(b),
  );

  const yarnByZig = new Map<string, typeof settlement.yarnLines>();
  for (const yarn of settlement.yarnLines) {
    const list = yarnByZig.get(yarn.zigId) ?? [];
    list.push(yarn);
    yarnByZig.set(yarn.zigId, list);
  }

  const linesByZig = new Map<string, typeof settlement.lines>();
  for (const line of settlement.lines) {
    const list = linesByZig.get(line.zigId) ?? [];
    list.push(line);
    linesByZig.set(line.zigId, list);
  }

  const weaverName = settlement.weaver.fullName;
  let firstWeaverRow = true;

  const zigTotals = zigIds.map((zigId) => {
    const zigLines = linesByZig.get(zigId) ?? [];
    const zigYarn = yarnByZig.get(zigId) ?? [];
    const yarnQty = zigYarn.reduce((sum, row) => sum + Number(row.netQuantity), 0);
    const yarnTotal = Math.round(
      zigYarn.reduce((sum, row) => sum + Number(row.totalCost), 0),
    );
    const fabricTotalValue = Math.round(
      zigLines.reduce((sum, row) => sum + Number(row.netFabricValue), 0),
    );
    return {
      zigId,
      zigLines,
      yarnQty,
      yarnTotal,
      yarnAvgPrice: yarnQty > 0 ? Math.round(yarnTotal / yarnQty) : 0,
      fabricTotalValue,
      netProfit: fabricTotalValue - yarnTotal,
    };
  });

  const weaverNetTotal = zigTotals.reduce((sum, zig) => sum + zig.netProfit, 0);

  for (const zig of zigTotals) {
    const { zigId, zigLines, yarnQty, yarnTotal, yarnAvgPrice, fabricTotalValue, netProfit } =
      zig;

    let firstZigRow = true;
    for (const line of zigLines) {
      const avgWeight = Math.floor(Number(line.averageWeight));
      const deduction = Number(line.deductionPerPiece);
      const unitPrice = Number(line.unitPrice);
      const adjustedPrice = unitPrice - deduction;
      const lineSubtotal = Math.round(Number(line.netFabricValue));

      rows.push({
        weaverId: firstWeaverRow ? settlement.weaverUserId : "",
        weaverName: firstWeaverRow ? weaverName : "",
        zigId: firstZigRow ? zigId : "",
        fabricType: line.fabric.name,
        fabricQty: line.totalQuantity,
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

  const grandFabricQty = settlement.lines.reduce((sum, row) => sum + row.totalQuantity, 0);
  const grandFabricValue = settlement.lines.reduce(
    (sum, row) => sum + Number(row.netFabricValue),
    0,
  );
  const grandYarnQty = settlement.yarnLines.reduce(
    (sum, row) => sum + Number(row.netQuantity),
    0,
  );
  const grandYarnTotal = settlement.yarnLines.reduce(
    (sum, row) => sum + Number(row.totalCost),
    0,
  );
  const grandNet = Number(settlement.netAmount);

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

  const paymentDate = settlement.paidAt ?? settlement.createdAt;

  return {
    paymentId: settlement.payments[0]?.settlementPaymentId ?? settlement.settlementId,
    settlementId: settlement.settlementId,
    paymentDate,
    weaver: settlement.weaver,
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
