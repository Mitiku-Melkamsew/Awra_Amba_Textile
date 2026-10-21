import { describe, expect, it } from "vitest";
import { calculateBonus, calculateDeduction, calculateNetCredit } from "./calculation.service.js";

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

describe("calculateBonus — always zero (disabled)", () => {
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