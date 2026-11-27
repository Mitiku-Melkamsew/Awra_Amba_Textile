export const DEFAULT_DEDUCTION_RATE = 10;

export interface QualityDeductionInput {
  avgWeight: number;
  standardWeight: number;
  deductionRatePerUnit?: number;
}

export interface QualityDeductionOutput {
  standardWeight: number;
  avgWeight: number;
  deficit: number;
  deductionPerPiece: number;
  ruleApplied: "no_weight" | "meets_threshold" | "below_threshold";
  remark: string;
}

/**
 * Pure domain rule for calculating quality deduction per piece.
 * When average weight is below standard, deducts deductionRatePerUnit for each unit deficit.
 */
export function calculatePieceDeduction(
  input: QualityDeductionInput,
): QualityDeductionOutput {
  const { avgWeight, standardWeight, deductionRatePerUnit = DEFAULT_DEDUCTION_RATE } = input;
  const flooredWeight = Math.floor(avgWeight);

  if (!avgWeight || avgWeight <= 0) {
    return {
      standardWeight,
      avgWeight: 0,
      deficit: 0,
      deductionPerPiece: 0,
      ruleApplied: "no_weight",
      remark: "No weight recorded; no deduction applied.",
    };
  }

  if (avgWeight >= standardWeight) {
    return {
      standardWeight,
      avgWeight,
      deficit: 0,
      deductionPerPiece: 0,
      ruleApplied: "meets_threshold",
      remark: `Weight ${flooredWeight} meets or exceeds standard ${standardWeight}.`,
    };
  }

  const deficit = Math.max(0, standardWeight - flooredWeight);
  const deductionPerPiece = deficit * deductionRatePerUnit;

  return {
    standardWeight,
    avgWeight,
    deficit,
    deductionPerPiece,
    ruleApplied: "below_threshold",
    remark: `Weight ${flooredWeight} is ${deficit} below standard ${standardWeight}; deduction ${deductionPerPiece} per piece.`,
  };
}

export interface DimensionalDeductionInput {
  measuredValue: number;
  standardValue: number;
  deductionRatePerUnit?: number;
  factor: "length" | "width" | string;
  unit?: string;
}

export interface DimensionalDeductionOutput {
  standardValue: number;
  measuredValue: number;
  deficit: number;
  deductionPerPiece: number;
  ruleApplied: "no_measurement" | "meets_threshold" | "below_threshold";
  remark: string;
}

export function calculateDimensionalDeduction(
  input: DimensionalDeductionInput,
): DimensionalDeductionOutput {
  const { measuredValue, standardValue, deductionRatePerUnit = 5, factor, unit = "cm" } = input;
  const floored = Math.floor(measuredValue);

  if (!measuredValue || measuredValue <= 0) {
    return {
      standardValue,
      measuredValue: 0,
      deficit: 0,
      deductionPerPiece: 0,
      ruleApplied: "no_measurement",
      remark: `No ${factor} recorded; no deduction applied.`,
    };
  }

  if (measuredValue >= standardValue) {
    return {
      standardValue,
      measuredValue,
      deficit: 0,
      deductionPerPiece: 0,
      ruleApplied: "meets_threshold",
      remark: `${factor} ${floored}${unit} meets or exceeds standard ${standardValue}${unit}.`,
    };
  }

  const deficit = Math.max(0, standardValue - floored);
  const deductionPerPiece = deficit * deductionRatePerUnit;

  return {
    standardValue,
    measuredValue,
    deficit,
    deductionPerPiece,
    ruleApplied: "below_threshold",
    remark: `${factor} ${floored}${unit} is ${deficit}${unit} below standard ${standardValue}${unit}; deduction ${deductionPerPiece} per piece.`,
  };
}

export interface GroupedFabricLineCreditInput {
  totalQuantity: number;
  unitPrice: number;
  deductionPerPiece: number;
}

export interface GroupedFabricLineCreditOutput {
  grossCredit: number;
  deductionAmount: number;
  adjustedUnitPrice: number;
  netCredit: number;
}

export function calculateFabricLineCredit(
  input: GroupedFabricLineCreditInput,
): GroupedFabricLineCreditOutput {
  const grossCredit = Number((input.totalQuantity * input.unitPrice).toFixed(2));
  const adjustedUnitPrice = Math.max(0, input.unitPrice - input.deductionPerPiece);
  const deductionAmount = Number((input.totalQuantity * input.deductionPerPiece).toFixed(2));
  const netCredit = Number((grossCredit - deductionAmount).toFixed(2));

  return {
    grossCredit,
    deductionAmount,
    adjustedUnitPrice,
    netCredit,
  };
}
