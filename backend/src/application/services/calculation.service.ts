/** Birr deducted per piece for every unit of average weight below standard. */
export const DEDUCTION_RATE_PER_UNIT = 10;

/** Utility for standard financial rounding to 2 decimal places */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export interface DeductionEntry {
  factor: string;
  perPiece: number;
  remark?: string;
}

/** Compute total deduction = sum(perPiece) * quantity */
export function computeDeductionAmount(
  deductions: DeductionEntry[],
  quantity: number,
): number {
  if (!deductions || deductions.length === 0 || quantity <= 0) return 0;
  const totalPerPiece = deductions.reduce((sum, d) => sum + (Number(d.perPiece) || 0), 0);
  return roundCurrency(totalPerPiece * quantity);
}

/** grossFabricValue = quantity * unitPrice */
export function computeGrossFabricValue(
  quantity: number,
  unitPrice: number,
): number {
  return roundCurrency((Number(quantity) || 0) * (Number(unitPrice) || 0));
}

/** netFabricValue = grossFabricValue - deductionAmount */
export function computeNetFabricValue(
  grossFabricValue: number,
  deductionAmount: number,
): number {
  return roundCurrency((Number(grossFabricValue) || 0) - (Number(deductionAmount) || 0));
}

/**
 * Suggest a weight deduction entry if average weight is below standardWeightG.
 * Checks against fabric type's standard weight (ignoring variant/color).
 */
export function suggestWeightDeduction(
  totalWeight: number,
  quantity: number,
  standardWeightG: number,
  deductionRatePerUnit: number = DEDUCTION_RATE_PER_UNIT,
): DeductionEntry | null {
  if (!quantity || quantity <= 0 || !standardWeightG || standardWeightG <= 0) {
    return null;
  }
  const avgWeight = totalWeight / quantity;
  const flooredWeight = Math.floor(avgWeight);
  if (flooredWeight >= standardWeightG) {
    return null;
  }
  const deficit = standardWeightG - flooredWeight;
  const perPiece = deficit * deductionRatePerUnit;
  return {
    factor: "weight",
    perPiece,
    remark: `Average weight ${flooredWeight}g is ${deficit}g below standard ${standardWeightG}g (${perPiece} ETB/piece)`,
  };
}

export interface FabricReturnFinancials {
  grossFabricValue: number;
  deductionAmount: number;
}

export interface YarnGivenFinancials {
  quantity: number;
  unitPrice: number;
}

/**
 * Pure function: recalculate a Zig's net payable from its lines.
 *
 * netPayable = totalNetFabricValue - totalYarnCost
 * Starts negative when yarn is issued, increases to positive as fabric returns arrive.
 */
export function computeNetPayable(
  fabricReturns: FabricReturnFinancials[],
  yarnGiven: YarnGivenFinancials[],
): number {
  const totalFabricNet = fabricReturns.reduce(
    (sum, fr) => sum + computeNetFabricValue(Number(fr.grossFabricValue) || 0, Number(fr.deductionAmount) || 0),
    0,
  );

  const totalYarnCost = yarnGiven.reduce(
    (sum, yg) => sum + roundCurrency((Number(yg.quantity) || 0) * (Number(yg.unitPrice) || 0)),
    0,
  );

  return roundCurrency(totalFabricNet - totalYarnCost);
}

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
    lineCredit: roundCurrency(adjustedUnitPrice * input.quantity),
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
  return roundCurrency((unitPrice - deductionPerPiece) * quantity);
}

export interface LineOverride {
  returnId: number;
  /** Deduction per piece to use for this return instead of the calculated one. */
  calculatedDeduction?: number;
  remark?: string;
}
