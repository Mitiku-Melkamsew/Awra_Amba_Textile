import type { FabricVariant } from "../api";
import type { LineEntryMode } from "./yarnLines";

/**
 * Fabric line drafts aligned with Prisma schema:
 * WorkOrder / FabricReturn / DirectTransactionLine use fabricVariantId.
 * No productId.
 */

export interface FabricCatalogLookup {
  colors: Array<{ colorId: number; colorCode?: string; name: string }>;
  designs: Array<{ designId: number; name: string }>;
  /** @deprecated kept optional for older callers; prefer fabricVariants */
  products?: Array<{ productId?: number; fabricId?: number; name?: string; basePrice?: number; category?: string }>;
}

export interface FabricLineDraft {
  id: string;
  entryMode: LineEntryMode;
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

export function createFabricLineDraft(
  _lookup?: FabricCatalogLookup,
  entryMode: LineEntryMode = "variant",
): FabricLineDraft {
  return {
    id: `fabric-line-${++nextId}`,
    entryMode,
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
    entryMode: "variant",
    fabricVariantId: String(variant.fabricVariantId),
    unitPrice: price ? String(price) : line.unitPrice,
  };
}

/** Clear variant selection when user switches mode or clears search. */
export const DETAILS_EDITED = { entryMode: "variant" as const, fabricVariantId: "" };

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
