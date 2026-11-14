import { request } from "../http/api-client";
import type {
  SettlementBatch,
  SettlementBatchPreview,
  Settlement,
  HisabReport,
} from "../../domain/models";

export const settlementService = {
  async listBatches(): Promise<SettlementBatch[]> {
    const res = await request<SettlementBatch[] | { batches: SettlementBatch[]; total: number }>(
      "/settlements/batches",
    );
    return Array.isArray(res) ? res : (res.batches ?? []);
  },

  async previewSettlements(data: {
    periodStart?: string;
    periodEnd?: string;
    cutoffDate?: string;
    weaverIds?: number[];
  }): Promise<SettlementBatchPreview> {
    const cutoff = data.cutoffDate ?? data.periodEnd;
    return request<SettlementBatchPreview>("/settlements/preview", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        periodEnd: cutoff,
        cutoffDate: cutoff,
      }),
    });
  },

  async commitBatch(data: {
    batchId: number;
    notes?: string;
    paymentMethod?: string;
    overrides?: Array<{
      returnId: number;
      calculatedDeduction: number;
      remark?: string;
    }>;
  }): Promise<Record<string, any>> {
    return request<Record<string, any>>("/settlements/batches", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getBatch(id: string | number): Promise<SettlementBatch> {
    return request<SettlementBatch>(`/settlements/batches/${id}`);
  },

  async payBatch(
    id: string | number,
    data?: { amount?: number; paymentMethod?: string; notes?: string }
  ): Promise<any> {
    return request(`/settlements/batches/${id}/pay`, {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    });
  },

  async getSettlement(id: string | number): Promise<Settlement> {
    return request<Settlement>(`/settlements/${id}`);
  },

  async getHisabStatement(settlementId: string | number): Promise<HisabReport> {
    return request<HisabReport>(`/settlements/${settlementId}/hisab-statement`);
  },
};
