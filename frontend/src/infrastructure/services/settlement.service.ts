import { request } from "../http/api-client";
import type {
  SettlementBatch,
  SettlementBatchPreview,
  Settlement,
  SettlementDeduction,
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

  async markBatchPaid(id: string | number): Promise<SettlementBatch> {
    return request<SettlementBatch>(`/settlements/batches/${id}/pay`, {
      method: "POST",
    });
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

  async addDeduction(
    settlementId: string | number,
    data: { reason: string; amount: number }
  ): Promise<SettlementDeduction> {
    return request<SettlementDeduction>(`/settlements/${settlementId}/deductions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getHisabStatement(settlementId: string | number): Promise<{
    settlementId: number;
    weaver: {
      weaverId: number;
      fullName: string;
      phone: string | null;
      bankAccountNumber: string | null;
    };
    periodStart: string;
    periodEnd: string;
    fabricReturns: Array<{
      fabricReturnId: number;
      workOrderId: number;
      fabricName: string;
      returnDate: string;
      quantity: number;
      actualWeightG: number;
      unitPrice: number;
      totalCredit: number;
    }>;
    yarnDebits: Array<{
      yarnGivenId: number;
      yarnName: string;
      quantityKg: number;
      unitPrice: number;
      totalCost: number;
    }>;
    qualityDeductions: Array<{
      reason: string;
      amount: number;
    }>;
    otherDeductions: Array<{
      reason: string;
      amount: number;
    }>;
    totals: {
      fabricPieces: number;
      grossFabricCredit: number;
      totalYarnDebits: number;
      totalDeductions: number;
      netPayout: number;
      amountInWordsAmharic?: string;
    };
  }> {
    return request(`/settlements/${settlementId}/hisab-statement`);
  },
};
