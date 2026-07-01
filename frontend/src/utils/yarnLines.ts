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

export function parseYarnLines(lines: YarnLineDraft[]): YarnLinePayload[] {
  return lines
    .filter(
      (line) =>
        Number(line.quantity) > 0 &&
        line.unitPrice &&
        (line.entryMode === "variant"
          ? line.yarnVariantId
          : line.yarnTypeId && line.colorId && line.supplierId),
    )
    .map((line) => ({
      ...(line.entryMode === "variant" && line.yarnVariantId
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