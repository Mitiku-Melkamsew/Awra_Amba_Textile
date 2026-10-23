export type LineEntryMode = "catalog" | "variant";

export interface YarnLineDraft {
  id: string;
  entryMode: LineEntryMode;
  yarnVariantId: string;
  yarnTypeId: string;
  supplierId: string;
  colorId: string;
  quantity: string;
  unitPrice: string;
}

export interface YarnLinePayload {
  yarnVariantId?: number;
  yarnTypeId?: number;
  colorId?: number;
  supplierId?: number;
  quantity: number;
  unitPrice: number;
}

export interface YarnCatalogLookup {
  colors: Array<{ colorId: number; colorCode: string; name: string }>;
  suppliers: Array<{ supplierId: number; name: string }>;
  yarnTypes: Array<{ yarnTypeId: number; materialName: string }>;
}

export interface YarnVariantOption {
  yarnVariantId: number;
  sku: string;
  basePrice?: string | null;
  yarnTypeId?: number;
  colorId?: number;
  supplierId?: number;
  yarnType?: { materialName: string; yarnTypeId?: number };
  color?: { name: string; colorId?: number };
  supplier?: { name: string; supplierId?: number };
}

let nextLineId = 0;

export function createYarnLineDraft(
  lookup?: YarnCatalogLookup,
  quantity = "",
  entryMode: LineEntryMode = "catalog",
): YarnLineDraft {
  return {
    id: `yarn-line-${++nextLineId}`,
    entryMode,
    yarnVariantId: "",
    yarnTypeId: lookup?.yarnTypes[0] ? String(lookup.yarnTypes[0].yarnTypeId) : "",
    supplierId: lookup?.suppliers[0] ? String(lookup.suppliers[0].supplierId) : "",
    colorId: lookup?.colors[0] ? String(lookup.colors[0].colorId) : "",
    quantity,
    unitPrice: "",
  };
}

export function applyYarnVariantToLine(
  line: YarnLineDraft,
  variant: YarnVariantOption,
): YarnLineDraft {
  return {
    ...line,
    entryMode: "variant",
    yarnVariantId: String(variant.yarnVariantId),
    yarnTypeId: String(variant.yarnTypeId ?? variant.yarnType?.yarnTypeId ?? ""),
    supplierId: String(variant.supplierId ?? variant.supplier?.supplierId ?? ""),
    colorId: String(variant.colorId ?? variant.color?.colorId ?? ""),
    unitPrice: variant.basePrice ? String(variant.basePrice) : line.unitPrice,
  };
}

export function yarnRowToLineDraft(
  row: {
    yarnGivenId: number;
    quantity: string;
    unitPrice: string;
    yarnVariant: YarnVariantOption;
  },
  lookup?: YarnCatalogLookup,
): YarnLineDraft {
  const variant = row.yarnVariant;
  return {
    ...applyYarnVariantToLine(createYarnLineDraft(lookup, row.quantity, "variant"), variant),
    id: `yarn-edit-${row.yarnGivenId}`,
    unitPrice: row.unitPrice,
  };
}

/** A line uses an existing variant only when one is actually chosen; otherwise it saves from the typed details. */
const usesVariant = (line: YarnLineDraft) => line.entryMode === "variant" && Boolean(line.yarnVariantId);

/** Editing any detail field means the line no longer refers to the chosen variant. */
export const YARN_DETAILS_EDITED = { entryMode: "catalog", yarnVariantId: "" } as const;

export function parseYarnLines(lines: YarnLineDraft[]): YarnLinePayload[] {
  return lines
    .filter(
      (line) =>
        Number(line.quantity) > 0 &&
        line.unitPrice &&
        (usesVariant(line) || (line.yarnTypeId && line.colorId && line.supplierId)),
    )
    .map((line) => ({
      ...(usesVariant(line)
        ? { yarnVariantId: Number(line.yarnVariantId) }
        : {
            yarnTypeId: Number(line.yarnTypeId),
            colorId: Number(line.colorId),
            supplierId: Number(line.supplierId),
          }),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
}
