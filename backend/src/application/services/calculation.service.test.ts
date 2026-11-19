import { describe, expect, it } from "vitest";
import {
  calculateBonus,
  calculateDeduction,
  calculateNetCredit,
  computeDeductionAmount,
  computeGrossFabricValue,
  computeNetFabricValue,
  computeNetPayable,
  DEDUCTION_RATE_PER_UNIT,
  suggestWeightDeduction,
} from "./calculation.service.js";

describe("calculateDeduction", () => {
  it("f-04: below threshold 84, weight 81", () => {
    const result = calculateDeduction({
      avgWeight: 81,
      unitPrice: 1707,
      quantity: 33,
      minWeightThreshold: 84,
    });
    expect(result.deductionPerPiece).toBe(30);
    expect(result.adjustedUnitPrice).toBe(1677);
    expect(result.lineCredit).toBe(55341);
  });

  it("f-01: meets threshold 64 exactly", () => {
    const result = calculateDeduction({
      avgWeight: 64,
      unitPrice: 1300,
      quantity: 40,
      minWeightThreshold: 64,
    });
    expect(result.deductionPerPiece).toBe(0);
    expect(result.lineCredit).toBe(52000);
  });

  it("f-05: below threshold 90, weight 85", () => {
    const result = calculateDeduction({
      avgWeight: 85,
      unitPrice: 1860,
      quantity: 33,
      minWeightThreshold: 90,
    });
    expect(result.deductionPerPiece).toBe(50);
    expect(result.adjustedUnitPrice).toBe(1810);
    expect(result.lineCredit).toBe(59730);
  });

  it("f-06: threshold is 42, weight 38", () => {
    const result = calculateDeduction({
      avgWeight: 38,
      unitPrice: 950,
      quantity: 10,
      minWeightThreshold: 42,
    });
    expect(result.deductionPerPiece).toBe(40);
    expect(result.adjustedUnitPrice).toBe(910);
    expect(result.lineCredit).toBe(9100);
  });

  it("f-06: above threshold 42, no deduction", () => {
    const result = calculateDeduction({
      avgWeight: 50,
      unitPrice: 950,
      quantity: 5,
      minWeightThreshold: 42,
    });
    expect(result.deductionPerPiece).toBe(0);
    expect(result.lineCredit).toBe(4750);
  });

  it("integer rounding: fractional quantity * price rounds correctly", () => {
    const result = calculateDeduction({
      avgWeight: 80,
      unitPrice: 1707,
      quantity: 33,
      minWeightThreshold: 84,
    });
    expect(result.deductionPerPiece).toBe(40);
    expect(result.lineCredit).toBe(55011);
  });
});

describe("calculateBonus â€” always zero (disabled)", () => {
  it("returns zero bonus regardless of inputs", () => {
    const result = calculateBonus({
      avgWeight: 93,
      unitPrice: 1635,
      quantity: 30,
      minWeightThreshold: 90,
      bonusRatePerUnit: 10,
      maxBonusPerPiece: 100,
    });
    expect(result.bonusPerPiece).toBe(0);
    expect(result.totalBonus).toBe(0);
    expect(result.ruleApplied).toBe("bonus_disabled");
  });
});

describe("calculateNetCredit", () => {
  it("computes integer net credit without bonus", () => {
    expect(calculateNetCredit(1707, 30, 33)).toBe(55341);
  });

  it("rounds fractional result to integer", () => {
    expect(calculateNetCredit(1860, 50, 33)).toBe(59730);
  });
});

describe("DEDUCTION_RATE_PER_UNIT", () => {
  it("is the single rate used by the deduction rule", () => {
    expect(DEDUCTION_RATE_PER_UNIT).toBe(10);
    const result = calculateDeduction({
      avgWeight: 60,
      unitPrice: 1300,
      quantity: 1,
      minWeightThreshold: 64,
    });
    expect(result.deductionPerPiece).toBe(4 * DEDUCTION_RATE_PER_UNIT);
  });
});
describe("Pure Calculation Functions for Zig & Return Level Math", () => {
  it("computeGrossFabricValue calculates quantity * unitPrice", () => {
    expect(computeGrossFabricValue(15, 1300)).toBe(19500);
    expect(computeGrossFabricValue(0, 1300)).toBe(0);
  });

  it("computeDeductionAmount sums factors per piece and multiplies by quantity", () => {
    const deductions = [
      { factor: "weight", perPiece: 10 },
      { factor: "low_quality", perPiece: 5 },
    ];
    // (10 + 5) * 20 = 300
    expect(computeDeductionAmount(deductions, 20)).toBe(300);
    expect(computeDeductionAmount([], 20)).toBe(0);
  });

  it("computeNetFabricValue subtracts deduction from gross", () => {
    expect(computeNetFabricValue(19500, 300)).toBe(19200);
  });

  it("suggestWeightDeduction returns factor with deficit rate or null if standard met", () => {
    // 800g / 10 pcs = 80g. Standard is 84g. Deficit = 4g -> 4 * 10 = 40 ETB/piece
    const suggestion = suggestWeightDeduction(800, 10, 84, 10);
    expect(suggestion).not.toBeNull();
    expect(suggestion?.factor).toBe("weight");
    expect(suggestion?.perPiece).toBe(40);

    // Meets standard
    const meetsStandard = suggestWeightDeduction(850, 10, 84, 10);
    expect(meetsStandard).toBeNull();
  });

  it("computeNetPayable tracks negative balance when yarn issued and turns positive when fabric returned", () => {
    // Initial state: 10kg yarn issued at 120 ETB -> netPayable is -1200
    const initialPayable = computeNetPayable(
      [],
      [{ quantity: 10, unitPrice: 120 }]
    );
    expect(initialPayable).toBe(-1200);

    // First fabric return: 5 pcs at 500 ETB, deduction 50 -> net fabric = 2450
    // Net payable becomes 2450 - 1200 = 1250
    const partialReturnPayable = computeNetPayable(
      [{ grossFabricValue: 2500, deductionAmount: 50 }],
      [{ quantity: 10, unitPrice: 120 }]
    );
    expect(partialReturnPayable).toBe(1250);

    // Yarn adjustment: weaver returned 2kg unused yarn, so yarn given is updated to 8kg (8 * 120 = 960)
    // Net payable becomes 2450 - 960 = 1490
    const yarnAdjustedPayable = computeNetPayable(
      [{ grossFabricValue: 2500, deductionAmount: 50 }],
      [{ quantity: 8, unitPrice: 120 }]
    );
    expect(yarnAdjustedPayable).toBe(1490);
  });
});
