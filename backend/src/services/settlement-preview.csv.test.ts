import { describe, expect, it, vi } from "vitest";

// snapshotToCsv is pure, but its module also imports the database client; stub that out.
vi.mock("../lib/prisma.js", () => ({ prisma: {} }));

import { snapshotToCsv } from "./settlement-preview.service.js";

type Snapshot = Parameters<typeof snapshotToCsv>[0];

function row(returnId: number, qty: number, price: number, deduction: number, weight: number) {
  return {
    returnId,
    fabricVariantId: 7,
    fabricType: "f-01",
    quantityReturned: qty,
    totalWeight: weight,
    avgWeight: Math.floor(weight / qty),
    unitPrice: price,
    deductionPerPiece: deduction,
    adjustedPrice: price - deduction,
    lineSubtotal: (price - deduction) * qty,
    bonusAmount: 0,
    netCredit: (price - deduction) * qty,
  };
}

describe("snapshotToCsv", () => {
  it("prints the same fabric type of a zig as ONE line", () => {
    const snapshot = {
      weavers: [
        {
          weaverId: 1,
          weaverName: "Demo Weaver",
          netSettlement: 56760,
          zigDetails: [
            {
              zigId: "zig-1",
              returns: [row(1, 15, 1300, 0, 1050), row(2, 27, 1380, 0, 1890)],
              yarnQty: 0, yarnTotal: 0, yarnAvgPrice: 0, fabricTotal: 56760, netProfit: 56760,
            },
          ],
        },
      ],
      weaverCount: 1,
      grandTotal: 56760,
      cutoffDate: null,
    } as unknown as Snapshot;

    const csv = snapshotToCsv(snapshot);
    const lines = csv.split("\n");
    const dataLines = lines.filter((l) => l.includes("f-01"));

    expect(dataLines).toHaveLength(1); // one line, not two
    // weaver_id,weaver_name,zig_id,fabric_type,fabric_qty,avg_weight,base_price,deduction,adjusted_price,line_subtotal,...
    const cells = dataLines[0].split(",");
    expect(cells[3]).toBe("f-01");
    expect(cells[4]).toBe("42"); // quantity
    expect(cells[5]).toBe("70"); // merged avg weight 2940/42
    expect(cells[6]).toBe("1351.43"); // average base price
    expect(cells[9]).toBe("56760"); // 15*1300 + 27*1380
  });

  it("works for older snapshots (no variant id) and for zigs without returns", () => {
    const old = row(1, 5, 1300, 0, 350) as Record<string, unknown>;
    delete old.fabricVariantId;
    const snapshot = {
      weavers: [
        {
          weaverId: 1, weaverName: "W", netSettlement: 0,
          zigDetails: [
            { zigId: "zig-1", returns: [old, { ...old, returnId: 2 }], yarnQty: 0, yarnTotal: 0, yarnAvgPrice: 0, fabricTotal: 0, netProfit: 0 },
            { zigId: "zig-2", returns: [], yarnQty: 0, yarnTotal: 0, yarnAvgPrice: 0, fabricTotal: 0, netProfit: 0 },
          ],
        },
      ],
      weaverCount: 1, grandTotal: 0, cutoffDate: null,
    } as unknown as Snapshot;

    const csv = snapshotToCsv(snapshot);
    expect(csv.split("\n").filter((l) => l.includes("f-01"))).toHaveLength(1);
    expect(csv).toContain("zig-2");
  });
});
