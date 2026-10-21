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
  const threshold = input.minWeightThreshold;
  const flooredWeight = Math.floor(input.avgWeight);

  if (!input.avgWeight || input.avgWeight <= 0) {
    return {
      threshold,
      deductionPerPiece: 0,
      adjustedUnitPrice: input.unitPrice,
      lineCredit: Math.round(input.unitPrice * input.quantity),
      ruleApplied: "no_weight",
      remark: "No weight recorded; no deduction applied.",
    };
  }

  if (input.avgWeight >= threshold) {
    return {
      threshold,
      deductionPerPiece: 0,
      adjustedUnitPrice: input.unitPrice,
      lineCredit: Math.round(input.unitPrice * input.quantity),
      ruleApplied: "meets_threshold",
      remark: `Weight ${flooredWeight} meets minimum ${threshold}.`,
    };
  }

  const deductionPerPiece = (threshold - flooredWeight) * 10;
  const adjustedUnitPrice = input.unitPrice - deductionPerPiece;
  const lineCredit = Math.round(adjustedUnitPrice * input.quantity);

  return {
    threshold,
    deductionPerPiece,
    adjustedUnitPrice,
    lineCredit,
    ruleApplied: "below_threshold",
    remark: `Weight ${flooredWeight} below ${threshold}; deduction ${deductionPerPiece} per piece.`,
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

export function buildSettlementPreview(params: {
  returns: Array<{
    returnId: number;
    zigId: string;
    fabricVariantId: number;
    quantityReturned: number;
    totalWeight: number;
    unitPrice: number;
    qualityRule?: { minWeightThreshold: number; deductionRatePerUnit: number } | null;
    bonusRule?: unknown;
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
      deductionRatePerUnit: 10,
    });

    const netCredit = calculateNetCredit(
      unitPrice,
      deduction.deductionPerPiece,
      row.quantityReturned,
    );

    return {
      returnId: row.returnId,
      zigId: row.zigId,
      fabricVariantId: row.fabricVariantId,
      quantity: row.quantityReturned,
      avgWeight,
      unitPrice,
      deductionPerPiece: deduction.deductionPerPiece,
      bonusAmount: 0,
      netCredit,
      remark: deduction.remark,
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