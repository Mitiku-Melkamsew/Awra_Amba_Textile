import { request } from "../http/api-client";
import type { StockSummary, FabricVariant, YarnVariant } from "../../domain/models";

export const stockService = {
  async getStockSummary(): Promise<StockSummary> {
    return request<StockSummary>("/stock/summary");
  },

  async getFabricStock(activeOnly = true): Promise<FabricVariant[]> {
    return request<FabricVariant[]>(`/stock/fabrics?activeOnly=${activeOnly}`);
  },

  async getYarnStock(activeOnly = true): Promise<YarnVariant[]> {
    return request<YarnVariant[]>(`/stock/yarns?activeOnly=${activeOnly}`);
  },
};
