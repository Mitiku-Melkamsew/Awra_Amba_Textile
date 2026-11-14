import type { FabricVariant } from "../api";

/**
 * Fabric line drafts aligned with Prisma schema:
 * WorkOrder / FabricReturn / DirectTransactionLine use fabricVariantId.
 * No productId.
 */

export interface FabricCatalogLookup {
  colors: Array<{ colorId: number; colorCode?: string; name: string }>;
  designs: Array<{ designId: number; name: string }>;
  /** @deprecated kept optional for older callers; prefer fabricVariants */
  products?: Array<{ productId?: number; fabricId?: number; name?: string; basePrice?: number | string; category?: string }>;
}

export interface FabricLineDraft {
  id: string;
  fabricVariantId: string;
  quantity: string;
  unitPrice: string;
}

export interface FabricLinePayload {
  fabricVariantId: number;
  quantity: number;
  unitPrice: number;
}

let nextId = 0;

export function createFabricLineDraft(): FabricLineDraft {
  return {
    id: `fabric-line-${++nextId}`,
    fabricVariantId: "",
    quantity: "",
    unitPrice: "",
  };
}

export function applyFabricVariantToLine(
  line: FabricLineDraft,
  variant: FabricVariant,
): FabricLineDraft {
  const price =
    (variant as any).basePrice ??
    (variant as any).fabric?.prices?.[0]?.weaverRate ??
    (variant as any).fabric?.prices?.[0]?.sellingPrice ??
    line.unitPrice;

  return {
    ...line,
    fabricVariantId: String(variant.fabricVariantId),
    unitPrice: price ? String(price) : line.unitPrice,
  };
}

export function parseFabricLines(lines: FabricLineDraft[]): FabricLinePayload[] {
  return lines
    .filter(
      (line) =>
        Boolean(line.fabricVariantId) &&
        Number.isFinite(Number(line.quantity)) &&
        Number(line.quantity) > 0 &&
        Number(line.unitPrice) >= 0,
    )
    .map((line) => ({
      fabricVariantId: Number(line.fabricVariantId),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
}