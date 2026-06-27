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

export interface BonusInput {
  avgWeight: number;
  unitPrice: number;
  quantity: number;
  minWeightThreshold: number;
  bonusRatePerUnit?: number;
  maxBonusPerPiece?: number | null;
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
  avgWeight: number;
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

export function calculateDeduction(input: DeductionInput): DeductionResult {
  const rate = input.deductionRatePerUnit ?? 10;
  const threshold = input.minWeightThreshold;
  const flooredWeight = Math.floor(input.avgWeight);

  if (!input.avgWeight || input.avgWeight <= 0) {
    return {
      threshold,
      deductionPerPiece: 0,
      adjustedUnitPrice: input.unitPrice,
      lineCredit: input.unitPrice * input.quantity,
      ruleApplied: "no_weight",
      remark: "No weight recorded; no deduction applied.",
    };
  }

  if (input.avgWeight >= threshold) {
    return {
      threshold,
      deductionPerPiece: 0,
      adjustedUnitPrice: input.unitPrice,
      lineCredit: input.unitPrice * input.quantity,
      ruleApplied: "meets_threshold",
      remark: `Weight ${flooredWeight} meets minimum ${threshold}.`,
    };
  }

  const deductionPerPiece = (threshold - flooredWeight) * rate;
  const adjustedUnitPrice = input.unitPrice - deductionPerPiece;
  const lineCredit = adjustedUnitPrice * input.quantity;

  return {
    threshold,
    deductionPerPiece,
    adjustedUnitPrice,
    lineCredit,
    ruleApplied: "below_threshold",
    remark: `Weight ${flooredWeight} below ${threshold}; deduction ${deductionPerPiece} per piece.`,
  };
}

export function calculateBonus(input: BonusInput): BonusResult {
  const rate = input.bonusRatePerUnit ?? 10;
  const threshold = input.minWeightThreshold;
  const flooredWeight = Math.floor(input.avgWeight);

  if (!input.avgWeight || input.avgWeight <= 0) {
    return {
      bonusPerPiece: 0,
      totalBonus: 0,
      ruleApplied: "no_weight",
      remark: "No weight recorded; no bonus applied.",
    };
  }

  if (flooredWeight <= threshold) {
    return {
      bonusPerPiece: 0,
      totalBonus: 0,
      ruleApplied: "at_or_below_threshold",
      remark: `Weight ${flooredWeight} at or below bonus threshold ${threshold}.`,
    };
  }

  let bonusPerPiece = (flooredWeight - threshold) * rate;
  if (input.maxBonusPerPiece != null) {
    bonusPerPiece = Math.min(bonusPerPiece, input.maxBonusPerPiece);
  }

  const totalBonus = bonusPerPiece * input.quantity;

  return {
    bonusPerPiece,
    totalBonus,
    ruleApplied: "above_threshold",
    remark: `Weight ${flooredWeight} above ${threshold}; bonus ${bonusPerPiece} per piece.`,
  };
}

export function calculateNetCredit(
  unitPrice: number,
  deductionPerPiece: number,
  quantity: number,
  bonusAmount: number,
): number {
  return (unitPrice - deductionPerPiece) * quantity + bonusAmount;
}

export function buildSettlementPreview(params: {
  returns: Array<{
    returnId: number;
    zigId: string;
    fabricVariantId: number;
    quantityReturned: number;
    totalWeight: number;
    unitPrice: number;
    qualityRule?: { minWeightThreshold: number; deductionRatePerUnit: number } | null;
    bonusRule?: {
      minWeightThreshold: number;
      bonusRatePerUnit: number;
      maxBonusPerPiece: number | null;
    } | null;
  }>;
  yarnGiven: Array<{ yarnGivenId: number; zigId: string; quantity: number; unitPrice: number }>;
  sales: Array<{ saleId: number; movementType: string; quantity: number; unitPrice: number }>;
}): SettlementPreview {
  const lineItems: SettlementLinePreview[] = params.returns.map((row) => {
    const avgWeight = row.quantityReturned > 0 ? row.totalWeight / row.quantityReturned : 0;
    const unitPrice = Number(row.unitPrice);

    const deduction = calculateDeduction({
      avgWeight,
      unitPrice,
      quantity: row.quantityReturned,
      minWeightThreshold: Number(row.qualityRule?.minWeightThreshold ?? 0),
      deductionRatePerUnit: row.qualityRule
        ? Number(row.qualityRule.deductionRatePerUnit)
        : undefined,
    });

    const bonus = calculateBonus({
      avgWeight,
      unitPrice,
      quantity: row.quantityReturned,
      minWeightThreshold: Number(row.bonusRule?.minWeightThreshold ?? 0),
      bonusRatePerUnit: row.bonusRule ? Number(row.bonusRule.bonusRatePerUnit) : undefined,
      maxBonusPerPiece: row.bonusRule?.maxBonusPerPiece
        ? Number(row.bonusRule.maxBonusPerPiece)
        : null,
    });

    const netCredit = calculateNetCredit(
      unitPrice,
      deduction.deductionPerPiece,
      row.quantityReturned,
      bonus.totalBonus,
    );

    return {
      returnId: row.returnId,
      zigId: row.zigId,
      fabricVariantId: row.fabricVariantId,
      quantity: row.quantityReturned,
      avgWeight,
      unitPrice,
      deductionPerPiece: deduction.deductionPerPiece,
      bonusAmount: bonus.totalBonus,
      netCredit,
      remark: `${deduction.remark} ${bonus.remark}`.trim(),
    };
  });

  const yarnDebits = params.yarnGiven.map((row) => ({
    yarnGivenId: row.yarnGivenId,
    zigId: row.zigId,
    cost: Number(row.quantity) * Number(row.unitPrice),
  }));

  const saleAdjustments = params.sales.map((row) => {
    const amount = Number(row.quantity) * Number(row.unitPrice);
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