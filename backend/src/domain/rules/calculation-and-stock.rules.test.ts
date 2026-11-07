import { describe, it, expect } from "vitest";
import { DirectTxnType } from "@prisma/client";
import {
  calculatePieceDeduction,
  calculateFabricLineCredit,
} from "./calculation.rules.js";
import { getDirectTxnStockImpact, assertSufficientStock } from "./stock.rules.js";
import { isPriceEffective, resolveEffectivePrice } from "./pricing.rules.js";

describe("Calculation Rules", () => {
  it("calculates zero deduction when average weight meets or exceeds standard", () => {
    const res = calculatePieceDeduction({
      avgWeight: 520,
      standardWeight: 500,
      deductionRatePerUnit: 10,
    });
    expect(res.deductionPerPiece).toBe(0);
    expect(res.ruleApplied).toBe("meets_threshold");
  });

  it("calculates 10 Birr deduction per unit deficit below standard", () => {
    const res = calculatePieceDeduction({
      avgWeight: 495.8, // floor is 495, deficit is 5
      standardWeight: 500,
      deductionRatePerUnit: 10,
    });
    expect(res.deficit).toBe(5);
    expect(res.deductionPerPiece).toBe(50);
    expect(res.ruleApplied).toBe("below_threshold");
  });

  it("calculates fabric line credit with adjusted unit price", () => {
    const credit = calculateFabricLineCredit({
      totalQuantity: 10,
      unitPrice: 200,
      deductionPerPiece: 20,
    });
    expect(credit.grossCredit).toBe(2000);
    expect(credit.deductionAmount).toBe(200);
    expect(credit.adjustedUnitPrice).toBe(180);
    expect(credit.netCredit).toBe(1800);
  });
});

describe("Stock Rules", () => {
  it("computes positive delta for fabric purchase from weaver", () => {
    const impact = getDirectTxnStockImpact(DirectTxnType.fabric_purchase_from_weaver, 15);
    expect(impact.itemType).toBe("fabric");
    expect(impact.direction).toBe("in");
    expect(impact.delta).toBe(15);
  });

  it("computes negative delta for fabric sale to merchant", () => {
    const impact = getDirectTxnStockImpact(DirectTxnType.fabric_sale_to_merchant, 10);
    expect(impact.itemType).toBe("fabric");
    expect(impact.direction).toBe("out");
    expect(impact.delta).toBe(-10);
  });

  it("computes negative delta for yarn sale to weaver", () => {
    const impact = getDirectTxnStockImpact(DirectTxnType.yarn_sale_to_weaver, 25);
    expect(impact.itemType).toBe("yarn");
    expect(impact.direction).toBe("out");
    expect(impact.delta).toBe(-25);
  });

  it("checks stock sufficiency", () => {
    expect(assertSufficientStock(100, 50)).toBe(true);
    expect(assertSufficientStock(20, 50)).toBe(false);
  });
});

describe("Pricing Rules", () => {
  it("resolves active price within effective window", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const p1 = {
      fabricPriceId: 1,
      sellingPrice: 100,
      effectiveFrom: new Date("2026-01-01T00:00:00Z"),
      effectiveTo: new Date("2026-05-01T00:00:00Z"),
      isActive: true,
    };
    const p2 = {
      fabricPriceId: 2,
      sellingPrice: 120,
      effectiveFrom: new Date("2026-05-01T00:00:00Z"),
      effectiveTo: null,
      isActive: true,
    };

    expect(isPriceEffective(p1, now)).toBe(false);
    expect(isPriceEffective(p2, now)).toBe(true);
    expect(resolveEffectivePrice([p1, p2], now)?.fabricPriceId).toBe(2);
  });
});
