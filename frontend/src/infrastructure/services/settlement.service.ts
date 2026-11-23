import { request } from "../http/api-client";
import type {
  SettlementBatch,
  SettlementBatchPreview,
  PendingSettlementsSummary,
  ZigLedgerItem,
} from "../../domain/models";

export const settlementService = {
  async listBatches(): Promise<SettlementBatch[]> {
    const res = await request<SettlementBatch[] | { batches: SettlementBatch[]; total: number }>(
      "/settlements/batches",
    );
    return Array.isArray(res) ? res : (res.batches ?? []);
  },

  async previewSettlements(data: {
    cutoffDate?: string;
    includeZigIds?: string[];
  }): Promise<SettlementBatchPreview> {
    return request<SettlementBatchPreview>("/settlements/preview", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async commitBatch(data: {
    cutoffDate?: string;
    includeZigIds?: string[];
    notes?: string;
    paymentMethod?: string;
    autoPay?: boolean;
    expectedNetSettlement?: number;
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

  async cancelSettlement(id: string | number, reason: string): Promise<any> {
    return request(`/settlements/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async cancelBatch(id: string | number, reason: string): Promise<any> {
    return request(`/settlements/batches/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async getPendingSummary(): Promise<PendingSettlementsSummary> {
    return request<PendingSettlementsSummary>("/settlements/pending-summary");
  },

  async getZigsLedger(status?: string): Promise<ZigLedgerItem[]> {
    const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    return request<ZigLedgerItem[]>(`/settlements/zigs-ledger${query}`);
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
};
