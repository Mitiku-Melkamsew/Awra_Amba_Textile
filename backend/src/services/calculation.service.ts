/** Birr deducted per piece for every unit of average weight below the threshold. */
export const DEDUCTION_RATE_PER_UNIT = 10;

export interface DeductionInput {
  avgWeight: number;
  unitPrice: number;
  quantity: number;
  minWeightThreshold: number;
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

export interface SettlementLinePreview {
  returnId: number;
  zigId: string;
  fabricVariantId: number;
  quantity: number;
  /** This return's own average weight. */
  avgWeight: number;
  /** Merged average weight of all returns of the same fabric in the same zig; the deduction is based on this. */
  deductionBasisAvgWeight: number;
  unitPrice: number;
  deductionPerPiece: number;
  bonusAmount: number;
  netCredit: number;
  remark: string;
}

export interface SettlementPreview {
  lineItems: SettlementLinePreview[];
  yarnDebits: Array<{ yarnGivenId: number; zigId: string; cost: number }>;
  saleAdjustments: Array<{ saleId: number; signedAmount: number }>;
  netSettlement: number;
}

export interface PieceDeduction {
  threshold: number;
  deductionPerPiece: number;
  ruleApplied: string;
  remark: string;
}

/**
 * The deduction rule itself, independent of price and quantity:
 * below the threshold, deduct DEDUCTION_RATE_PER_UNIT for every whole unit of average weight missing.
 */
export function deductionForAverageWeight(avgWeight: number, minWeightThreshold: number): PieceDeduction {
  const threshold = minWeightThreshold;
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
      remark: `Weight ${flooredWeight} meets minimum ${threshold}.`,
    };
  }

  const deductionPerPiece = (threshold - flooredWeight) * DEDUCTION_RATE_PER_UNIT;
  return {
    threshold,
    deductionPerPiece,
    ruleApplied: "below_threshold",
    remark: `Weight ${flooredWeight} below ${threshold}; deduction ${deductionPerPiece} per piece.`,
  };
}

export function calculateDeduction(input: DeductionInput): DeductionResult {
  const rule = deductionForAverageWeight(input.avgWeight, input.minWeightThreshold);
  const adjustedUnitPrice = input.unitPrice - rule.deductionPerPiece;
  return {
    threshold: rule.threshold,
    deductionPerPiece: rule.deductionPerPiece,
    adjustedUnitPrice,
    lineCredit: Math.round(adjustedUnitPrice * input.quantity),
    ruleApplied: rule.ruleApplied,
    remark: rule.remark,
  };
}

// Bonus is disabled — always returns zero.
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

export function buildSettlementPreview(params: {
  returns: Array<{
    returnId: number;
    zigId: string;
    fabricVariantId: number;
    quantityReturned: number;
    totalWeight: number;
    unitPrice: number;
    qualityRule?: { minWeightThreshold: number } | null;
    bonusRule?: unknown;
  }>;
  yarnGiven: Array<{ yarnGivenId: number; zigId: string; quantity: number; unitPrice: number }>;
  sales: Array<{ saleId: number; movementType: string; quantity: number; unitPrice: number }>;
  overrides?: LineOverride[];
}): SettlementPreview {
  // The deduction is based on the MERGED average weight of all returns of the same
  // fabric in the same zig (total weight / total pieces), not on each return alone.
  const groups = new Map<
    string,
    { quantity: number; weight: number; threshold: number; count: number }
  >();
  for (const row of params.returns) {
    const key = `${row.zigId}::${row.fabricVariantId}`;
    const group = groups.get(key) ?? {
      quantity: 0,
      weight: 0,
      threshold: Number(row.qualityRule?.minWeightThreshold ?? 0),
      count: 0,
    };
    group.quantity += row.quantityReturned;
    group.weight += Number(row.totalWeight);
    group.count += 1;
    groups.set(key, group);
  }

  const groupDeductions = new Map<string, PieceDeduction & { mergedAvgWeight: number }>();
  for (const [key, group] of groups) {
    const mergedAvgWeight = group.quantity > 0 ? group.weight / group.quantity : 0;
    const rule = deductionForAverageWeight(mergedAvgWeight, group.threshold);
    groupDeductions.set(key, {
      ...rule,
      mergedAvgWeight,
      remark:
        group.count > 1
          ? `${rule.remark} (merged average of ${group.count} returns)`
          : rule.remark,
    });
  }

  const overrideMap = new Map((params.overrides ?? []).map((item) => [item.returnId, item]));

  const lineItems: SettlementLinePreview[] = params.returns.map((row) => {
    const avgWeight = row.quantityReturned > 0 ? row.totalWeight / row.quantityReturned : 0;
    const unitPrice = Number(row.unitPrice);
    const group = groupDeductions.get(`${row.zigId}::${row.fabricVariantId}`)!;
    const override = overrideMap.get(row.returnId);

    const deductionPerPiece = override?.calculatedDeduction ?? group.deductionPerPiece;
    const netCredit = calculateNetCredit(unitPrice, deductionPerPiece, row.quantityReturned);

    return {
      returnId: row.returnId,
      zigId: row.zigId,
      fabricVariantId: row.fabricVariantId,
      quantity: row.quantityReturned,
      avgWeight,
      deductionBasisAvgWeight: group.mergedAvgWeight,
      unitPrice,
      deductionPerPiece,
      bonusAmount: 0,
      netCredit,
      remark: override?.remark ?? group.remark,
    };
  });

  const yarnDebits = params.yarnGiven.map((row) => ({
    yarnGivenId: row.yarnGivenId,
    zigId: row.zigId,
    cost: Math.round(Number(row.quantity) * Number(row.unitPrice)),
  }));

  const saleAdjustments = params.sales.map((row) => {
    const amount = Math.round(Number(row.quantity) * Number(row.unitPrice));
    let signedAmount = amount;
    if (row.movementType === "weaver_yarn_sale") {
      signedAmount = -Math.abs(amount);
    } else if (row.movementType === "weaver_fabric_purchase") {
      signedAmount = Math.abs(amount);
    }
    return { saleId: row.saleId, signedAmount };
  });

  const fabricCredits = lineItems.reduce((sum, item) => sum + item.netCredit, 0);
  const yarnTotal = yarnDebits.reduce((sum, item) => sum + item.cost, 0);
  const saleTotal = saleAdjustments.reduce((sum, item) => sum + item.signedAmount, 0);
  const netSettlement = fabricCredits - yarnTotal + saleTotal;

  return { lineItems, yarnDebits, saleAdjustments, netSettlement };
}