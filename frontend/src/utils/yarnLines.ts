/**
 * Yarn line drafts aligned with the Prisma schema.
 * Every line references an existing `yarnVariantId` (YarnPurchaseLine,
 * YarnGiven, DirectTransactionLine). There is no yarnType/color/supplier
 * fallback: those are properties of the variant.
 */

export interface YarnCatalogLookup {
  colors: Array<{ colorId: number; name: string }>;
  suppliers: Array<{ supplierId: number; name: string }>;
  yarns: Array<{ yarnId: number; name: string }>;
}

export interface YarnVariantOption {
  yarnVariantId: number;
  sku: string;
  yarnId?: number;
  colorId?: number;
  supplierId?: number;
  yarn?: { yarnId?: number; name: string };
  supplier?: { supplierId?: number; name: string };
  color?: { colorId?: number; name: string };
  basePrice?: string | number | null;
  sellingPrice?: number;
  purchasePrice?: number;
  stockSnapshot?: string | number;
  isActive?: boolean;
}

export interface YarnLineDraft {
  id: string;
  yarnVariantId: string;
  quantity: string;
  unitPrice: string;
}

export interface YarnLinePayload {
  yarnVariantId: number;
  quantity: number;
  unitPrice: number;
}

export function createYarnLineDraft(defaultQuantity = "1"): YarnLineDraft {
  return {
    id: `yarn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    yarnVariantId: "",
    quantity: defaultQuantity,
    unitPrice: "",
  };
}

export function applyYarnVariantToLine(
  line: YarnLineDraft,
  variant: YarnVariantOption,
): YarnLineDraft {
  return {
    ...line,
    yarnVariantId: String(variant.yarnVariantId),
    unitPrice: variant.basePrice ? String(variant.basePrice) : line.unitPrice,
  };
}

export function yarnRowToLineDraft(row: {
  yarnGivenId: number;
  quantity: string | number;
  unitPrice: string | number;
  yarnVariant: YarnVariantOption;
}): YarnLineDraft {
  return {
    ...applyYarnVariantToLine(createYarnLineDraft(String(row.quantity)), row.yarnVariant),
    id: `yarn-edit-${row.yarnGivenId}`,
    unitPrice: String(row.unitPrice),
  };
}

export function parseYarnLines(lines: YarnLineDraft[]): YarnLinePayload[] {
  return lines
    .filter(
      (line) =>
        Boolean(line.yarnVariantId) &&
        Number.isFinite(Number(line.quantity)) &&
        Number(line.quantity) > 0 &&
        Number(line.unitPrice) >= 0,
    )
    .map((line) => ({
      yarnVariantId: Number(line.yarnVariantId),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
}
