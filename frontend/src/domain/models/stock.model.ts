import type { FabricVariant, YarnVariant } from "./index";

export interface StockSummary {
  totalYarnStockPieces?: number;
  totalFabricStockPieces?: number;
  fabrics:
    | Array<FabricVariant & { stockSnapshot?: string | number; currentStock?: number }>
    | {
        totalPieces: number;
        variants: Array<FabricVariant & { currentStock: number; stockSnapshot?: string | number }>;
      };
  yarns:
    | Array<YarnVariant & { stockSnapshot?: string | number; currentStockPieces?: number }>
    | {
        totalPieces?: number;
        variants: Array<YarnVariant & { currentStockPieces?: number; stockSnapshot?: string | number }>;
      };
}
