/** Birr deducted per piece for every unit of average weight below standard. */
export const DEDUCTION_RATE_PER_UNIT = 10;

export interface DeductionInput {
  avgWeight: number;
  unitPrice: number;
  quantity: number;
  minWeightThreshold: number;
  deductionRatePerUnit?: number;
}

export interface DeductionResult {
  threshold: number;
  deductionPerPiece: number;
  adjustedUnitPrice: number;
  lineCredit: number;
  ruleApplied: string;
  remark: string;
}

export interface BonusResult {
  bonusPerPiece: number;
  totalBonus: number;
  ruleApplied: string;
  remark: string;
}

export interface PieceDeduction {
  threshold: number;
  deductionPerPiece: number;
  ruleApplied: string;
  remark: string;
}

/**
 * The deduction rule itself:
 * Below the standard, deduct deductionRatePerUnit for every whole unit of average weight missing.
 * Clamps overweight measurements to 0 (no deduction, no bonus).
 */
export function deductionForAverageWeight(
  avgWeight: number,
  standardWeight: number,
  deductionRatePerUnit: number = DEDUCTION_RATE_PER_UNIT,
): PieceDeduction {
  const threshold = standardWeight;
  const flooredWeight = Math.floor(avgWeight);

  if (!avgWeight || avgWeight <= 0) {
    return {
      threshold,
      deductionPerPiece: 0,
      ruleApplied: "no_weight",
      remark: "No weight recorded; no deduction applied.",
    };
  }

  if (avgWeight >= threshold) {
    return {
      threshold,
      deductionPerPiece: 0,
      ruleApplied: "meets_threshold",
      remark: `Weight ${flooredWeight} meets or exceeds standard ${threshold}.`,
    };
  }

  const deficit = Math.max(0, threshold - flooredWeight);
  const deductionPerPiece = deficit * deductionRatePerUnit;
  return {
    threshold,
    deductionPerPiece,
    ruleApplied: "below_threshold",
    remark: `Weight ${flooredWeight} is ${deficit} below standard ${threshold}; deduction ${deductionPerPiece} per piece.`,
  };
}

export function calculateDeduction(input: DeductionInput): DeductionResult {
  const rate = input.deductionRatePerUnit ?? DEDUCTION_RATE_PER_UNIT;
  const rule = deductionForAverageWeight(input.avgWeight, input.minWeightThreshold, rate);
  const adjustedUnitPrice = Math.max(0, input.unitPrice - rule.deductionPerPiece);
  return {
    threshold: rule.threshold,
    deductionPerPiece: rule.deductionPerPiece,
    adjustedUnitPrice,
    lineCredit: Math.round(adjustedUnitPrice * input.quantity),
    ruleApplied: rule.ruleApplied,
    remark: rule.remark,
  };
}

// Bonus is disabled in this design — always returns zero.
export function calculateBonus(_input?: {
  avgWeight?: number;
  unitPrice?: number;
  quantity?: number;
  minWeightThreshold?: number;
  bonusRatePerUnit?: number;
  maxBonusPerPiece?: number | null;
}): BonusResult {
  return {
    bonusPerPiece: 0,
    totalBonus: 0,
    ruleApplied: "bonus_disabled",
    remark: "Bonus calculation is disabled.",
  };
}

export function calculateNetCredit(
  unitPrice: number,
  deductionPerPiece: number,
  quantity: number,
): number {
  return Math.round((unitPrice - deductionPerPiece) * quantity);
}

export interface LineOverride {
  returnId: number;
  /** Deduction per piece to use for this return instead of the calculated one. */
  calculatedDeduction?: number;
  remark?: string;
}

export interface SettlementLinePreview {
  returnId: number;
  zigId: string;
  fabricId?: number;
  fabricVariantId: number;
  quantity: number;
  totalWeight: number;
  avgWeight: number;
  deductionBasisAvgWeight: number;
  unitPrice: number;
  deductionPerPiece: number;
  bonusAmount: number;
  grossValue: number;
  deductionAmount: number;
  netCredit: number;
  remark: string;
}

export interface SettlementGroupPreview {
  zigId: string;
  fabricId: number;
  fabricName?: string;
  totalQuantity: number;
  totalWeight: number;
  averageWeight: number;
  standardWeightG: number;
  unitPrice: number;
  deductionFactor: string;
  deductionUnit: string;
  deductionPerPiece: number;
  deductionAmount: number;
  grossFabricValue: number;
  netFabricValue: number;
  returnIds: number[];
}

export interface SettlementYarnLinePreview {
  yarnGivenId: number;
  zigId: string;
  yarnVariantId: number;
  issuedQuantity: number;
  returnedQuantity: number;
  netQuantity: number;
  unitPrice: number;
  totalCost: number;
}

export interface SettlementPreview {
  lineItems: SettlementLinePreview[];
  groupedLines: SettlementGroupPreview[];
  yarnLines: SettlementYarnLinePreview[];
  yarnDebits: Array<{ yarnGivenId: number; zigId: string; cost: number }>;
  grossFabricValue: number;
  totalDeductions: number;
  totalYarnCost: number;
  netSettlement: number;
  isBlocked: boolean;
  blockReasons: string[];
  // For backwards compatibility with older tests/pages
  saleAdjustments: Array<{ saleId: number; signedAmount: number }>;
}

export function buildSettlementPreview(params: {
  returns: Array<{
    returnId: number;
    zigId: string;
    fabricId?: number;
    fabricName?: string;
    fabricVariantId: number;
    quantityReturned: number;
    totalWeight: number;
    excludedQuantity?: number;
    unitPrice: number;
    standardWeightG?: number;
    qualityRule?: { minWeightThreshold: number; deductionRatePerUnit?: number } | null;
  }>;
  yarnGiven: Array<{
    yarnGivenId: number;
    zigId: string;
    yarnVariantId?: number;
    quantity: number;
    unitPrice: number;
  }>;
  yarnReturns?: Array<{
    yarnVariantId: number;
    zigId: string;
    quantity: number;
  }>;
  sales?: Array<{
    saleId: number;
    movementType: string;
    quantity: number;
    unitPrice: number;
  }>;
  overrides?: LineOverride[];
}): SettlementPreview {
  // 1. Group fabric returns by zigId + fabricId (or fabricVariantId if fabricId is omitted)
  const groups = new Map<
    string,
    {
      zigId: string;
      fabricId: number;
      fabricName?: string;
      quantity: number;
      weight: number;
      standardWeight: number;
      deductionRate: number;
      unitPriceSum: number;
      returnIds: number[];
    }
  >();

  for (const row of params.returns) {
    const quantity = Math.max(0, row.quantityReturned - (row.excludedQuantity ?? 0));
    const weight =
      row.quantityReturned > 0
        ? row.totalWeight * (quantity / row.quantityReturned)
        : 0;
    if (quantity === 0) continue;
    const fabricId = row.fabricId ?? row.fabricVariantId;
    const key = `${row.zigId}::${fabricId}`;
    const standardWeight = Number(
      row.standardWeightG ?? row.qualityRule?.minWeightThreshold ?? 0,
    );
    const deductionRate = Number(
      row.qualityRule?.deductionRatePerUnit ?? DEDUCTION_RATE_PER_UNIT,
    );

    const group = groups.get(key) ?? {
      zigId: row.zigId,
      fabricId,
      fabricName: row.fabricName,
      quantity: 0,
      weight: 0,
      standardWeight,
      deductionRate,
      unitPriceSum: 0,
      returnIds: [],
    };

    group.quantity += quantity;
    group.weight += Number(weight);
    group.unitPriceSum += quantity * Number(row.unitPrice);
    group.returnIds.push(row.returnId);
    groups.set(key, group);
  }

  // 2. Compute group deduction for each zigId + fabricId group
  const groupDeductions = new Map<
    string,
    PieceDeduction & { mergedAvgWeight: number; weightedUnitPrice: number }
  >();

  for (const [key, group] of groups) {
    const mergedAvgWeight = group.quantity > 0 ? group.weight / group.quantity : 0;
    const weightedUnitPrice =
      group.quantity > 0 ? group.unitPriceSum / group.quantity : 0;
    const rule = deductionForAverageWeight(
      mergedAvgWeight,
      group.standardWeight,
      group.deductionRate,
    );

    groupDeductions.set(key, {
      ...rule,
      mergedAvgWeight,
      weightedUnitPrice,
      remark:
        group.returnIds.length > 1
          ? `${rule.remark} (merged average of ${group.returnIds.length} returns)`
          : rule.remark,
    });
  }

  const overrideMap = new Map((params.overrides ?? []).map((item) => [item.returnId, item]));
  const blockReasons: string[] = [];

  // 3. Process individual return line items
  let grossFabricValue = 0;
  let totalDeductions = 0;

  const lineItems: SettlementLinePreview[] = params.returns.map((row) => {
    const quantity = Math.max(0, row.quantityReturned - (row.excludedQuantity ?? 0));
    const totalWeight =
      row.quantityReturned > 0
        ? row.totalWeight * (quantity / row.quantityReturned)
        : 0;
    const fabricId = row.fabricId ?? row.fabricVariantId;
    const key = `${row.zigId}::${fabricId}`;
    const group = groupDeductions.get(key) ?? {
      threshold: Number(row.standardWeightG ?? row.qualityRule?.minWeightThreshold ?? 0),
      deductionPerPiece: 0,
      ruleApplied: "excluded",
      remark: "Return quantity excluded from settlement.",
      mergedAvgWeight: 0,
      weightedUnitPrice: Number(row.unitPrice),
    };
    const override = overrideMap.get(row.returnId);

    const deductionPerPiece = override?.calculatedDeduction ?? group.deductionPerPiece;
    const unitPrice = Number(row.unitPrice);
    const grossValue = unitPrice * quantity;
    const deductionAmount = deductionPerPiece * quantity;
    const netCredit = calculateNetCredit(unitPrice, deductionPerPiece, quantity);

    grossFabricValue += grossValue;
    totalDeductions += deductionAmount;

    // Check if deduction exceeds unit price
    if (deductionPerPiece > unitPrice) {
      blockReasons.push(
        `Deduction (${deductionPerPiece} ETB) exceeds unit price (${unitPrice} ETB) on return #${row.returnId} (zig ${row.zigId}). Settlement blocked for admin review.`,
      );
    }

    const avgWeight = quantity > 0 ? totalWeight / quantity : 0;

    return {
      returnId: row.returnId,
      zigId: row.zigId,
      fabricId: row.fabricId,
      fabricVariantId: row.fabricVariantId,
      quantity,
      totalWeight,
      avgWeight,
      deductionBasisAvgWeight: group.mergedAvgWeight,
      unitPrice,
      deductionPerPiece,
      bonusAmount: 0,
      grossValue,
      deductionAmount,
      netCredit,
      remark: override?.remark ?? group.remark,
    };
  });

  // 4. Construct grouped lines summary
  const groupedLines: SettlementGroupPreview[] = [...groups.values()].map((g) => {
    const key = `${g.zigId}::${g.fabricId}`;
    const group = groupDeductions.get(key)!;
    const gross = g.unitPriceSum;
    const deductionAmt = group.deductionPerPiece * g.quantity;
    return {
      zigId: g.zigId,
      fabricId: g.fabricId,
      fabricName: g.fabricName,
      totalQuantity: g.quantity,
      totalWeight: g.weight,
      averageWeight: group.mergedAvgWeight,
      standardWeightG: g.standardWeight,
      unitPrice: group.weightedUnitPrice,
      deductionFactor: "weight",
      deductionUnit: "g",
      deductionPerPiece: group.deductionPerPiece,
      deductionAmount: deductionAmt,
      grossFabricValue: gross,
      netFabricValue: gross - deductionAmt,
      returnIds: g.returnIds,
    };
  });

  // 5. Process yarn lines (with yarn returns subtracted)
  const yarnReturnsMap = new Map<string, number>();
  for (const yr of params.yarnReturns ?? []) {
    const key = `${yr.zigId}::${yr.yarnVariantId}`;
    yarnReturnsMap.set(key, (yarnReturnsMap.get(key) ?? 0) + Number(yr.quantity));
  }

  let totalYarnCost = 0;
  const yarnLines: SettlementYarnLinePreview[] = params.yarnGiven.map((yg) => {
    const key = `${yg.zigId}::${yg.yarnVariantId ?? 0}`;
    const returnedQty = yarnReturnsMap.get(key) ?? 0;
    const netQty = Math.max(0, yg.quantity - returnedQty);
    const cost = Math.round(netQty * yg.unitPrice);
    totalYarnCost += cost;

    return {
      yarnGivenId: yg.yarnGivenId,
      zigId: yg.zigId,
      yarnVariantId: yg.yarnVariantId ?? 0,
      issuedQuantity: yg.quantity,
      returnedQuantity: returnedQty,
      netQuantity: netQty,
      unitPrice: yg.unitPrice,
      totalCost: cost,
    };
  });

  const yarnDebits = yarnLines.map((yl) => ({
    yarnGivenId: yl.yarnGivenId,
    zigId: yl.zigId,
    cost: yl.totalCost,
  }));

  // Backwards compatibility for tests with sales adjustments
  let salesAdjustmentTotal = 0;
  const saleAdjustments = (params.sales ?? []).map((sale) => {
    const amount = Number(sale.quantity) * Number(sale.unitPrice);
    const signedAmount =
      sale.movementType === "weaver_fabric_purchase" ? amount : -amount;
    salesAdjustmentTotal += signedAmount;
    return { saleId: sale.saleId, signedAmount };
  });

  const netFabricValue = grossFabricValue - totalDeductions;

  // Check if yarn cost exceeds net fabric credit
  if (totalYarnCost > netFabricValue) {
    blockReasons.push(
      `Total yarn cost (${totalYarnCost} ETB) exceeds net fabric credit (${netFabricValue} ETB). Settlement blocked for admin review.`,
    );
  }

  const netSettlement = netFabricValue - totalYarnCost + salesAdjustmentTotal;

  return {
    lineItems,
    groupedLines,
    yarnLines,
    yarnDebits,
    grossFabricValue,
    totalDeductions,
    totalYarnCost,
    netSettlement,
    isBlocked: blockReasons.length > 0,
    blockReasons,
    saleAdjustments,
  };
}
