import { serializeFabricVariant, serializeYarnVariant } from "./catalog.serializer.js";
import { project, type AnyRecord } from "./project.js";

const AVAILABLE_FABRIC_KEYS = [
  "fabricVariantId",
  "sku",
  "fabricId",
  "fabricName",
  "standardLengthCm",
  "standardWidthCm",
  "standardWeightG",
  "design",
  "warpColor",
  "weftColor",
  "sellingPrice",
  "weaverRate",
] as const;

export function serializeAvailableFabric(item: AnyRecord): AnyRecord {
  const out = project(item, AVAILABLE_FABRIC_KEYS);
  if (out.weaverRate === undefined) {
    delete out.weaverRate;
  }
  return out;
}

export function serializeStockSummary(summary: AnyRecord) {
  return {
    totalYarnStockPieces: Number(summary.totalYarnStockPieces ?? 0),
    totalFabricStockPieces: Number(summary.totalFabricStockPieces ?? 0),
    yarns: (summary.yarns ?? []).map(serializeYarnVariant),
    fabrics: (summary.fabrics ?? []).map(serializeFabricVariant),
  };
}
