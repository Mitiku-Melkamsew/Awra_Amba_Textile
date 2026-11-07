export interface YarnCatalogLookup {
  colors: Array<{ colorId: number; name: string }>;
  suppliers: Array<{ supplierId: number; name: string }>;
  yarnTypes: Array<{ yarnTypeId: number; materialName: string }>;
}

export interface YarnVariantOption {
  yarnVariantId: number;
  sku: string;
  yarnTypeId?: number;
  colorId?: number;
  supplierId?: number;
  yarnType?: { yarnTypeId?: number; materialName: string };
  supplier?: { supplierId?: number; name: string };
  color?: { colorId?: number; name: string };
  basePrice?: string | number | null;
}

export type LineEntryMode = "variant" | "catalog";

export interface YarnLineDraft {
  id: string;
  entryMode: LineEntryMode;
  yarnVariantId: string;
  yarnTypeId: string;
  colorId: string;
  supplierId: string;
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

export function createYarnLineDraft(
  lookup?: YarnCatalogLookup,
  defaultQuantity = "1",
  entryMode: "variant" | "catalog" = "variant",
): YarnLineDraft {
  return {
    id: `yarn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entryMode,
    yarnVariantId: "",
    yarnTypeId: String(lookup?.yarnTypes[0]?.yarnTypeId ?? ""),
    colorId: String(lookup?.colors[0]?.colorId ?? ""),
    supplierId: String(lookup?.suppliers[0]?.supplierId ?? ""),
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
    quantity: string | number;
    unitPrice: string | number;
    yarnVariant: YarnVariantOption;
  },
  lookup?: YarnCatalogLookup,
): YarnLineDraft {
  const variant = row.yarnVariant;
  return {
    ...applyYarnVariantToLine(createYarnLineDraft(lookup, String(row.quantity), "variant"), variant),
    id: `yarn-edit-${row.yarnGivenId}`,
    unitPrice: String(row.unitPrice),
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
        Number.isInteger(Number(line.quantity)) &&
        Number(line.quantity) > 0 &&
        Number(line.unitPrice) >= 0 &&
        (usesVariant(line) || Boolean(line.yarnTypeId)),
    )
    .map((line) => ({
      ...(usesVariant(line)
        ? { yarnVariantId: Number(line.yarnVariantId) }
        : {
            yarnTypeId: Number(line.yarnTypeId),
            colorId: line.colorId ? Number(line.colorId) : undefined,
            supplierId: line.supplierId ? Number(line.supplierId) : undefined,
          }),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
}
