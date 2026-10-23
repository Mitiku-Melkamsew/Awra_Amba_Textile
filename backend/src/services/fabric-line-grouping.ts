/**
 * Merges returns of the same fabric type (within one zig) into a single line for the
 * settlement review and report. Pure display logic: the money is calculated elsewhere
 * (calculation.service.ts) and the per-return records are never changed.
 */

export interface ReturnLine {
  returnId: number;
  /** Present in snapshots made after grouping was introduced; older snapshots fall back to the label. */
  fabricVariantId?: number;
  fabricType: string;
  quantityReturned: number;
  totalWeight: number;
  unitPrice: number;
  deductionPerPiece: number;
  lineSubtotal: number;
  netCredit: number;
}

export interface GroupedFabricLine {
  returnIds: number[];
  returnCount: number;
  fabricVariantId?: number;
  fabricType: string;
  quantityReturned: number;
  totalWeight: number;
  /** Merged average weight (total weight / total pieces), whole units, as used for the deduction. */
  avgWeight: number;
  /** Weighted average base price: sum(qty * price) / sum(qty), 2 decimals. */
  unitPrice: number;
  /** Weighted average deduction per piece, 2 decimals (identical for every return unless overridden). */
  deductionPerPiece: number;
  /** unitPrice - deductionPerPiece, 2 decimals. */
  adjustedPrice: number;
  /** Sum of the real line subtotals, e.g. 15*1300 + 27*1380 - never average price * quantity. */
  lineSubtotal: number;
  netCredit: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function groupReturnsByFabricType(lines: ReturnLine[]): GroupedFabricLine[] {
  const groups = new Map<string, ReturnLine[]>();
  for (const line of lines) {
    const key =
      line.fabricVariantId !== undefined ? `v:${line.fabricVariantId}` : `t:${line.fabricType}`;
    const list = groups.get(key);
    if (list) list.push(line);
    else groups.set(key, [line]);
  }

  return [...groups.values()].map((rows) => {
    const quantity = rows.reduce((sum, r) => sum + r.quantityReturned, 0);
    const weight = rows.reduce((sum, r) => sum + Number(r.totalWeight), 0);
    const priceSum = rows.reduce((sum, r) => sum + r.quantityReturned * r.unitPrice, 0);
    const deductionSum = rows.reduce((sum, r) => sum + r.quantityReturned * r.deductionPerPiece, 0);

    const unitPrice = quantity > 0 ? round2(priceSum / quantity) : 0;
    const deductionPerPiece = quantity > 0 ? round2(deductionSum / quantity) : 0;

    return {
      returnIds: rows.map((r) => r.returnId),
      returnCount: rows.length,
      fabricVariantId: rows[0].fabricVariantId,
      fabricType: rows[0].fabricType,
      quantityReturned: quantity,
      totalWeight: weight,
      avgWeight: quantity > 0 ? Math.floor(weight / quantity) : 0,
      unitPrice,
      deductionPerPiece,
      adjustedPrice: round2(unitPrice - deductionPerPiece),
      lineSubtotal: rows.reduce((sum, r) => sum + r.lineSubtotal, 0),
      netCredit: rows.reduce((sum, r) => sum + r.netCredit, 0),
    };
  });
}
