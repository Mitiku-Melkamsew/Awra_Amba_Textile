import { prisma } from "../../lib/prisma.js";
import { numberToAmharicWords } from "../../utils/amharic-words.js";
import { formatDateDDMMYY } from "../../utils/format-date.js";

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

export async function buildHisabReport(settlementId: number) {
  const settlementInclude = {
    weaver: true,
    workOrders: {
      include: {
        fabricVariant: { include: { fabric: true } },
        fabricReturns: {
          include: { fabricVariant: { include: { fabric: true } } },
          orderBy: { dateReturned: "asc" as const },
        },
        yarnGiven: {
          include: { yarnVariant: { include: { yarn: true } } },
          orderBy: { dateGiven: "asc" as const },
        },
      },
      orderBy: { zigId: "asc" as const },
    },
    payments: true,
  };

  // Strictly by settlement ID. Payment IDs are resolved by
  // buildHisabReportByPaymentId so the two ID spaces can never collide.
  const settlement = await prisma.settlement.findUnique({
    where: { settlementId },
    include: settlementInclude,
  });

  if (!settlement) {
    throw new Error("CONFLICT:Settlement not found.");
  }

  const rows: HisabRow[] = [];
  const weaverName = settlement.weaver.fullName;
  let firstWeaverRow = true;

  // Flatten lines from workOrders
  const zigTotals = (settlement.workOrders ?? []).map((wo) => {
    const zigLines = wo.fabricReturns ?? [];
    const zigYarn = wo.yarnGiven ?? [];
    const yarnQty = zigYarn.reduce((sum, row) => sum + Number(row.quantity), 0);
    const yarnTotal = Math.round(
      zigYarn.reduce((sum, row) => sum + Number(row.quantity) * Number(row.unitPrice), 0),
    );
    const fabricTotalValue = Math.round(
      zigLines.reduce((sum, row) => sum + (Number(row.grossFabricValue) - Number(row.deductionAmount)), 0),
    );
    return {
      zigId: wo.zigId,
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
    const { zigId, zigLines, yarnQty, yarnTotal, yarnAvgPrice, fabricTotalValue, netProfit } = zig;
    let firstZigRow = true;

    if (zigLines.length === 0) {
      // Zig has yarn but no returns
      rows.push({
        weaverId: firstWeaverRow ? settlement.weaverUserId : "",
        weaverName: firstWeaverRow ? weaverName : "",
        zigId: firstZigRow ? zigId : "",
        fabricType: "—",
        fabricQty: 0,
        avgWeight: 0,
        basePrice: 0,
        deduction: 0,
        adjustedPrice: 0,
        lineSubtotal: 0,
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

    for (const line of zigLines) {
      const avgWeight = line.quantityReturned > 0 ? Math.floor(Number(line.totalWeight) / line.quantityReturned) : 0;
      const deduction = line.quantityReturned > 0 ? Number(line.deductionAmount) / line.quantityReturned : 0;
      const unitPrice = Number(line.unitPrice);
      const adjustedPrice = unitPrice - deduction;
      const lineSubtotal = Math.round(Number(line.grossFabricValue) - Number(line.deductionAmount));

      rows.push({
        weaverId: firstWeaverRow ? settlement.weaverUserId : "",
        weaverName: firstWeaverRow ? weaverName : "",
        zigId: firstZigRow ? zigId : "",
        fabricType: line.fabricVariant.fabric.name,
        fabricQty: line.quantityReturned,
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

  const allFabricReturns = (settlement.workOrders ?? []).flatMap((wo) => wo.fabricReturns ?? []);
  const allYarnGiven = (settlement.workOrders ?? []).flatMap((wo) => wo.yarnGiven ?? []);

  const grandFabricQty = allFabricReturns.reduce((sum, row) => sum + row.quantityReturned, 0);
  const grandFabricValue = allFabricReturns.reduce(
    (sum, row) => sum + (Number(row.grossFabricValue) - Number(row.deductionAmount)),
    0,
  );
  const grandYarnQty = allYarnGiven.reduce((sum, row) => sum + Number(row.quantity), 0);
  const grandYarnTotal = allYarnGiven.reduce(
    (sum, row) => sum + Number(row.quantity) * Number(row.unitPrice),
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
  const isPaid = settlement.status?.toLowerCase() === "paid" || settlement.payments.length > 0;

  return {
    paymentId: settlement.payments[0]?.settlementPaymentId ?? settlement.settlementId,
    settlementId: settlement.settlementId,
    paymentDate,
    weaver: settlement.weaver,
    amount: grandNet,
    amharicAmountInWords: amharicAmount,
    rows,
    isPaid,
    status: settlement.status,
  };
}

export async function buildHisabReportByPaymentId(id: number) {
  const payment = await prisma.settlementPayment.findUnique({
    where: { settlementPaymentId: id },
    include: { settlement: { select: { status: true } } },
  });
  if (!payment) {
    throw new Error("CONFLICT:Payment not found.");
  }

  const report = await buildHisabReport(payment.settlementId);
  return {
    ...report,
    paymentId: payment.settlementPaymentId,
    settlementId: payment.settlementId,
    paymentDate: payment.paymentDate,
    amount: Number(payment.amount),
    isPaid: true,
    status: payment.settlement?.status ?? "paid",
  };
}

/** Explicit settlement-ID lookup (no payment-ID fallback). */
export async function buildHisabReportBySettlementId(id: number) {
  return buildHisabReport(id);
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
