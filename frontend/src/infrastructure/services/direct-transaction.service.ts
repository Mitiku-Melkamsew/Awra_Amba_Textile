import { request } from "../http/api-client";
import type {
  CommercialTxnType,
  DirectTransaction,
  DirectTransactionStatus,
  DirectPayment,
} from "../../domain/models";

/** Payload matching the canonical backend CreateDirectTransactionSchema. */
export interface CreateDirectTransactionDto {
  type: CommercialTxnType;
  supplierId?: number | null;
  weaverUserId?: number | null;
  merchantUserId?: number | null;
  notes?: string | null;
  lines: Array<{
    fabricVariantId?: number | null;
    yarnVariantId?: number | null;
    quantity: number;
    unitPrice: number;
    description?: string | null;
  }>;
}

export const directTransactionService = {
  async listTransactions(params?: {
    type?: CommercialTxnType;
    status?: DirectTransactionStatus;
    weaverUserId?: number;
    merchantUserId?: number;
    limit?: number;
    offset?: number;
  }): Promise<DirectTransaction[]> {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    if (params?.status) query.append("status", params.status);
    if (params?.weaverUserId) query.append("weaverUserId", params.weaverUserId.toString());
    if (params?.merchantUserId) query.append("merchantUserId", params.merchantUserId.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.offset) query.append("offset", params.offset.toString());
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await request<DirectTransaction[] | { transactions: DirectTransaction[]; total: number }>(
      `/direct-transactions${queryString}`,
    );
    return Array.isArray(res) ? res : (res.transactions ?? []);
  },

  async getTransaction(id: string | number): Promise<DirectTransaction> {
    return request<DirectTransaction>(`/direct-transactions/${id}`);
  },

  async createTransaction(data: CreateDirectTransactionDto): Promise<DirectTransaction> {
    return request<DirectTransaction>("/direct-transactions", {
      method: "POST",
      body: JSON.stringify({
        type: data.type,
        supplierId: data.supplierId ?? undefined,
        weaverUserId: data.weaverUserId ?? undefined,
        merchantUserId: data.merchantUserId ?? undefined,
        notes: data.notes,
        lines: data.lines.map((l) => ({
          fabricVariantId: l.fabricVariantId ?? null,
          yarnVariantId: l.yarnVariantId ?? null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          ...(l.description ? { description: l.description } : {}),
        })),
      }),
    });
  },

  async recordPayment(
    id: string | number,
    data: {
      amount: number;
      paymentMethod: string;
      paymentDate?: string;
      notes?: string;
    }
  ): Promise<DirectPayment> {
    return request<DirectPayment>(`/direct-transactions/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async cancelTransaction(id: string | number, reason?: string): Promise<DirectTransaction> {
    return request<DirectTransaction>(`/direct-transactions/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
};