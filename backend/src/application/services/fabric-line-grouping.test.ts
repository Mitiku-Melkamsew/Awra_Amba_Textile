import { describe, expect, it } from "vitest";
import { groupReturnsByFabricType, type ReturnLine } from "./fabric-line-grouping.js";

function line(partial: Partial<ReturnLine> & Pick<ReturnLine, "returnId" | "quantityReturned" | "unitPrice">): ReturnLine {
  const deduction = partial.deductionPerPiece ?? 0;
  return {
    fabricVariantId: 7,
    fabricType: "f-01",
    totalWeight: partial.quantityReturned * 70,
    deductionPerPiece: deduction,
    lineSubtotal: Math.round((partial.unitPrice - deduction) * partial.quantityReturned),
    netCredit: Math.round((partial.unitPrice - deduction) * partial.quantityReturned),
    ...partial,
  };
}

describe("groupReturnsByFabricType", () => {
  it("merges the example: 15 x 1300 and 27 x 1380 become one line", () => {
    const [merged, ...rest] = groupReturnsByFabricType([
      line({ returnId: 1, quantityReturned: 15, unitPrice: 1300 }),
      line({ returnId: 2, quantityReturned: 27, unitPrice: 1380 }),
    ]);
    expect(rest).toHaveLength(0);
    expect(merged.quantityReturned).toBe(42);
    expect(merged.unitPrice).toBe(1351.43); // 56760 / 42 = 1351.4286
    expect(merged.lineSubtotal).toBe(56760); // 15*1300 + 27*1380, not 42 * 1351.43 (= 56760.06)
    expect(merged.returnIds).toEqual([1, 2]);
  });

  it("subtotal is the sum of the real subtotals even when an average price would be inexact", () => {
    const [merged] = groupReturnsByFabricType([
      line({ returnId: 1, quantityReturned: 15, unitPrice: 1300 }),
      line({ returnId: 2, quantityReturned: 27, unitPrice: 1380 }),
    ]);
    // average * quantity would give 56760.06 (the average is rounded); the subtotal is exact
    expect(merged.unitPrice * merged.quantityReturned).not.toBe(56760);
    expect(merged.lineSubtotal).toBe(56760);
  });

  it("applies one deduction for the merged line and keeps adjusted price consistent", () => {
    const [merged] = groupReturnsByFabricType([
      line({ returnId: 1, quantityReturned: 15, unitPrice: 1300, deductionPerPiece: 10 }),
      line({ returnId: 2, quantityReturned: 27, unitPrice: 1380, deductionPerPiece: 10 }),
    ]);
    expect(merged.deductionPerPiece).toBe(10);
    expect(merged.adjustedPrice).toBe(1341.43);
    expect(merged.lineSubtotal).toBe(19350 + 36990);
  });

  it("merged average weight is total weight / total pieces, whole units", () => {
    const [merged] = groupReturnsByFabricType([
      line({ returnId: 1, quantityReturned: 15, unitPrice: 1300, totalWeight: 900 }),
      line({ returnId: 2, quantityReturned: 27, unitPrice: 1380, totalWeight: 1782 }),
    ]);
    expect(merged.avgWeight).toBe(63); // 2682 / 42 = 63.86
  });

  it("keeps different fabrics apart and preserves first-seen order", () => {
    const grouped = groupReturnsByFabricType([
      line({ returnId: 1, quantityReturned: 5, unitPrice: 1300 }),
      line({ returnId: 2, quantityReturned: 4, unitPrice: 950, fabricVariantId: 9, fabricType: "f-06" }),
      line({ returnId: 3, quantityReturned: 6, unitPrice: 1300 }),
    ]);
    expect(grouped.map((g) => [g.fabricType, g.quantityReturned])).toEqual([
      ["f-01", 11],
      ["f-06", 4],
    ]);
  });

  it("falls back to the fabric label for older snapshots without a variant id", () => {
    const grouped = groupReturnsByFabricType([
      line({ returnId: 1, quantityReturned: 5, unitPrice: 1300, fabricVariantId: undefined }),
      line({ returnId: 2, quantityReturned: 6, unitPrice: 1300, fabricVariantId: undefined }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].quantityReturned).toBe(11);
  });

  it("returns nothing for no returns", () => {
    expect(groupReturnsByFabricType([])).toEqual([]);
  });
});
