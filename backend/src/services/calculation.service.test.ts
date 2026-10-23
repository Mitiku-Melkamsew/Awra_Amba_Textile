import { describe, expect, it } from "vitest";
import {
  buildSettlementPreview,
  calculateBonus,
  calculateDeduction,
  calculateNetCredit,
  DEDUCTION_RATE_PER_UNIT,
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

describe("buildSettlementPreview - deduction on the merged average weight", () => {
  const f01 = { minWeightThreshold: 64 };
  // Two returns of the same fabric (f-01) in the same zig, on different days.
  // A: 15 pcs, weight 900  (avg 60)  at 1300      B: 27 pcs, weight 1782 (avg 66) at 1380
  const returns = [
    { returnId: 1, zigId: "zig-1", fabricVariantId: 7, quantityReturned: 15, totalWeight: 900, unitPrice: 1300, qualityRule: f01 },
    { returnId: 2, zigId: "zig-1", fabricVariantId: 7, quantityReturned: 27, totalWeight: 1782, unitPrice: 1380, qualityRule: f01 },
  ];

  it("uses (total weight / total pieces) for every return of the merged group", () => {
    const preview = buildSettlementPreview({ returns, yarnGiven: [], sales: [] });
    // merged avg = 2682 / 42 = 63.86 -> floor 63 -> (64 - 63) * 10 = 10 per piece, for BOTH returns
    expect(preview.lineItems.map((l) => l.deductionPerPiece)).toEqual([10, 10]);
    expect(preview.lineItems[0].deductionBasisAvgWeight).toBeCloseTo(63.857, 3);
    expect(preview.lineItems[0].remark).toContain("merged average of 2 returns");
    // (1300-10)*15 + (1380-10)*27 = 19350 + 36990
    expect(preview.lineItems.map((l) => l.netCredit)).toEqual([19350, 36990]);
    expect(preview.netSettlement).toBe(56340);
  });

  it("differs from judging each return on its own (which would deduct 600 on A and 0 on B)", () => {
    const alone = returns.map((r) => buildSettlementPreview({ returns: [r], yarnGiven: [], sales: [] }));
    expect(alone[0].lineItems[0].deductionPerPiece).toBe(40);
    expect(alone[1].lineItems[0].deductionPerPiece).toBe(0);
  });

  it("does not merge different fabrics or different zigs", () => {
    const preview = buildSettlementPreview({
      returns: [
        returns[0],
        { ...returns[1], fabricVariantId: 8 },
        { ...returns[1], returnId: 3, zigId: "zig-2" },
      ],
      yarnGiven: [],
      sales: [],
    });
    expect(preview.lineItems[0].deductionPerPiece).toBe(40); // A alone: avg 60
    expect(preview.lineItems[1].deductionPerPiece).toBe(0); // other fabric alone: avg 66
    expect(preview.lineItems[2].deductionPerPiece).toBe(0); // other zig alone: avg 66
  });

  it("no rule means no deduction", () => {
    const preview = buildSettlementPreview({
      returns: [{ ...returns[0], qualityRule: null }],
      yarnGiven: [],
      sales: [],
    });
    expect(preview.lineItems[0].deductionPerPiece).toBe(0);
  });
});

describe("buildSettlementPreview - overrides", () => {
  const returns = [
    { returnId: 1, zigId: "zig-1", fabricVariantId: 7, quantityReturned: 10, totalWeight: 600, unitPrice: 1300, qualityRule: { minWeightThreshold: 64 } },
    { returnId: 2, zigId: "zig-1", fabricVariantId: 9, quantityReturned: 5, totalWeight: 400, unitPrice: 1000, qualityRule: { minWeightThreshold: 64 } },
  ];
  const yarnGiven = [{ yarnGivenId: 1, zigId: "zig-1", quantity: 2, unitPrice: 600 }];
  const sales = [{ saleId: 1, movementType: "weaver_yarn_sale", quantity: 1, unitPrice: 300 }];

  it("an override changes the row AND the settlement total together", () => {
    const base = buildSettlementPreview({ returns, yarnGiven, sales });
    // return 1: avg 60 -> 40 per piece -> (1300-40)*10 = 12600; return 2: avg 80 -> 0 -> 5000
    expect(base.lineItems.map((l) => l.netCredit)).toEqual([12600, 5000]);
    expect(base.netSettlement).toBe(12600 + 5000 - 1200 - 300);

    const overridden = buildSettlementPreview({
      returns, yarnGiven, sales,
      overrides: [{ returnId: 1, calculatedDeduction: 0, remark: "Waived by admin" }],
    });
    expect(overridden.lineItems[0].deductionPerPiece).toBe(0);
    expect(overridden.lineItems[0].netCredit).toBe(13000);
    expect(overridden.lineItems[0].remark).toBe("Waived by admin");
    expect(overridden.netSettlement).toBe(13000 + 5000 - 1200 - 300);
  });

  it("the settlement total always equals the sum of its rows minus yarn plus sales", () => {
    const preview = buildSettlementPreview({
      returns, yarnGiven, sales,
      overrides: [{ returnId: 2, calculatedDeduction: 25 }],
    });
    const rows = preview.lineItems.reduce((sum, l) => sum + l.netCredit, 0);
    const yarn = preview.yarnDebits.reduce((sum, y) => sum + y.cost, 0);
    const adjustments = preview.saleAdjustments.reduce((sum, a) => sum + a.signedAmount, 0);
    expect(preview.netSettlement).toBe(rows - yarn + adjustments);
  });
});
