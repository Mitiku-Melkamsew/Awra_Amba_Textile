import { request } from "../http/api-client";
import type {
  WeaverBalanceSummary,
  CommercialReportSummary,
  ProductionReportSummary,
} from "../../domain/models";

export const reportService = {
  async getWeaversBalance(): Promise<WeaverBalanceSummary[]> {
    return request<WeaverBalanceSummary[]>("/reports/weavers-balance");
  },

  async getCommercialSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CommercialReportSummary> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<CommercialReportSummary>(`/reports/commercial-summary${queryString}`);
  },

  async getProductionSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ProductionReportSummary> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<ProductionReportSummary>(`/reports/production-summary${queryString}`);
  },
};
