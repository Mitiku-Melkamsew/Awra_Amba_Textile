import type { FabricVariant, Product } from "../api";
import type { LineEntryMode } from "./yarnLines";
import { findZigZagDesignId } from "./defaultDesign";

export interface FabricCatalogLookup {
  colors: Array<{ colorId: number; colorCode: string; name: string }>;
  designs: Array<{ designId: number; name: string }>;
  products: Product[];
}

export interface FabricLineDraft {
  id: string;
  entryMode: LineEntryMode;
  fabricVariantId: string;
  productId: string;
  warpColorId: string;
  weftColorId: string;
  designId: string;
  quantity: string;
  unitPrice: string;
}

export interface FabricLinePayload {
  fabricVariantId?: number;
  productId?: number;
  warpColorId?: number;
  weftColorId?: number;
  designId?: number | null;
  quantity: number;
  unitPrice: number;
}

let nextId = 0;

export function createFabricLineDraft(
  lookup?: FabricCatalogLookup,
  entryMode: LineEntryMode = "catalog",
): FabricLineDraft {
  const fabricProducts = lookup?.products.filter((p) => p.category === "fabric") ?? [];
  const zigZagId = lookup ? findZigZagDesignId(lookup.designs) : null;
  return {
    id: `fabric-line-${++nextId}`,
    entryMode,
    fabricVariantId: "",
    productId: fabricProducts[0] ? String(fabricProducts[0].productId) : "",
    warpColorId: lookup?.colors[0] ? String(lookup.colors[0].colorId) : "",
    weftColorId: lookup?.colors[0] ? String(lookup.colors[0].colorId) : "",
    designId: zigZagId ? String(zigZagId) : "",
    quantity: "",
    unitPrice: fabricProducts[0] ? String(fabricProducts[0].basePrice) : "",
  };
}

export function applyFabricVariantToLine(
  line: FabricLineDraft,
  variant: FabricVariant,
): FabricLineDraft {
  return {
    ...line,
    entryMode: "variant",
    fabricVariantId: String(variant.fabricVariantId),
    productId: String(variant.product.productId),
    warpColorId: variant.warpColor ? String(variant.warpColor.colorId) : line.warpColorId,
    weftColorId: variant.weftColor ? String(variant.weftColor.colorId) : line.weftColorId,
    designId: variant.design ? String(variant.design.designId) : "",
    unitPrice: variant.basePrice
      ? String(variant.basePrice)
      : variant.product.basePrice
        ? String(variant.product.basePrice)
        : line.unitPrice,
  };
}

/** A line uses an existing variant only when one is actually chosen; otherwise it saves from the typed details. */
const usesVariant = (line: FabricLineDraft) =>
  line.entryMode === "variant" && Boolean(line.fabricVariantId);

/** Editing any detail field means the line no longer refers to the chosen variant. */
export const DETAILS_EDITED = { entryMode: "catalog", fabricVariantId: "" } as const;

export function parseFabricLines(lines: FabricLineDraft[]): FabricLinePayload[] {
  return lines
    .filter((line) => Number(line.quantity) > 0 && line.unitPrice)
    .filter((line) => usesVariant(line) || (line.productId && line.warpColorId && line.weftColorId))
    .map((line) => ({
      ...(usesVariant(line)
        ? { fabricVariantId: Number(line.fabricVariantId) }
        : {
            productId: Number(line.productId),
            warpColorId: Number(line.warpColorId),
            weftColorId: Number(line.weftColorId),
            designId: line.designId ? Number(line.designId) : null,
          }),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
}
