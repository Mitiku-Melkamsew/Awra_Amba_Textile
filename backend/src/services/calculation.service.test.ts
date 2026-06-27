import { describe, expect, it } from "vitest";
import { calculateBonus, calculateDeduction } from "./calculation.service.js";

describe("calculateDeduction", () => {
  it("matches Python rule for f-04 below threshold", () => {
    const result = calculateDeduction({
      avgWeight: 81,
      unitPrice: 1707,
      quantity: 33,
      minWeightThreshold: 84,
      deductionRatePerUnit: 10,
    });

    expect(result.deductionPerPiece).toBe(30);
    expect(result.adjustedUnitPrice).toBe(1677);
    expect(result.lineCredit).toBe(55341);
  });

  it("applies no deduction when weight meets threshold", () => {
    const result = calculateDeduction({
      avgWeight: 64,
      unitPrice: 1300,
      quantity: 40,
      minWeightThreshold: 64,
      deductionRatePerUnit: 10,
    });

    expect(result.deductionPerPiece).toBe(0);
    expect(result.lineCredit).toBe(52000);
  });

  it("applies no deduction for f-05 at threshold", () => {
    const result = calculateDeduction({
      avgWeight: 85,
      unitPrice: 1860,
      quantity: 33,
      minWeightThreshold: 90,
      deductionRatePerUnit: 10,
    });

    expect(result.deductionPerPiece).toBe(50);
    expect(result.adjustedUnitPrice).toBe(1810);
    expect(result.lineCredit).toBe(59730);
  });
});

describe("calculateBonus", () => {
  it("awards bonus when weight exceeds threshold", () => {
    const result = calculateBonus({
      avgWeight: 93,
      unitPrice: 1635,
      quantity: 30,
      minWeightThreshold: 90,
      bonusRatePerUnit: 10,
      maxBonusPerPiece: 100,
    });

    expect(result.bonusPerPiece).toBe(30);
    expect(result.totalBonus).toBe(900);
  });

  it("caps bonus per piece when max is set", () => {
    const result = calculateBonus({
      avgWeight: 100,
      unitPrice: 1300,
      quantity: 10,
      minWeightThreshold: 64,
      bonusRatePerUnit: 10,
      maxBonusPerPiece: 50,
    });

    expect(result.bonusPerPiece).toBe(50);
    expect(result.totalBonus).toBe(500);
  });
});