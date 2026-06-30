export interface YarnLineDraft {
  id: string;
  yarnTypeId: string;
  supplierId: string;
  colorId: string;
  quantity: string;
  unitPrice: string;
}

export interface YarnLinePayload {
  yarnTypeId: number;
  colorId: number;
  supplierId: number;
  quantity: number;
  unitPrice: number;
}

export interface YarnCatalogLookup {
  colors: Array<{ colorId: number; colorCode: string; name: string }>;
  suppliers: Array<{ supplierId: number; name: string }>;
  yarnTypes: Array<{ yarnTypeId: number; materialName: string }>;
}

let nextLineId = 0;

export function createYarnLineDraft(
  lookup?: YarnCatalogLookup,
  quantity = "",
): YarnLineDraft {
  return {
    id: `yarn-line-${++nextLineId}`,
    yarnTypeId: lookup?.yarnTypes[0] ? String(lookup.yarnTypes[0].yarnTypeId) : "",
    supplierId: lookup?.suppliers[0] ? String(lookup.suppliers[0].supplierId) : "",
    colorId: lookup?.colors[0] ? String(lookup.colors[0].colorId) : "",
    quantity,
    unitPrice: "",
  };
}

export function parseYarnLines(lines: YarnLineDraft[]): YarnLinePayload[] {
  return lines
    .filter(
      (line) =>
        Number(line.quantity) > 0 &&
        line.yarnTypeId &&
        line.colorId &&
        line.supplierId &&
        line.unitPrice,
    )
    .map((line) => ({
      yarnTypeId: Number(line.yarnTypeId),
      colorId: Number(line.colorId),
      supplierId: Number(line.supplierId),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
}