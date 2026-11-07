import type { FabricVariant, YarnVariant } from "./index";

export interface StockSummary {
  totalYarnStockKg?: number;
  totalFabricStockPieces?: number;
  fabrics:
    | Array<FabricVariant & { stockSnapshot?: string | number; currentStock?: number }>
    | {
        totalPieces: number;
        variants: Array<FabricVariant & { currentStock: number; stockSnapshot?: string | number }>;
      };
  yarns:
    | Array<YarnVariant & { stockSnapshot?: string | number; currentStockKg?: number }>
    | {
        totalKg: number;
        variants: Array<YarnVariant & { currentStockKg: number; stockSnapshot?: string | number }>;
      };
}
