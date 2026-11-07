import { request } from "../http/api-client";
import type {
  DirectTransaction,
  DirectTransactionType,
  DirectTransactionStatus,
  DirectPayment,
} from "../../domain/models";

export interface CreateDirectTransactionDto {
  transactionType?: DirectTransactionType;
  type?: DirectTransactionType;
  supplierId?: number | null;
  weaverId?: number | null;
  weaverUserId?: number | null;
  merchantId?: number | null;
  merchantUserId?: number | null;
  transactionDate?: string;
  notes?: string | null;
  items?: Array<{
    fabricVariantId?: number | null;
    yarnVariantId?: number | null;
    quantity: number;
    unitPrice: number;
    description?: string;
  }>;
  lines?: Array<{
    fabricVariantId?: number | null;
    yarnVariantId?: number | null;
    quantity: number;
    unitPrice: number;
    description?: string;
  }>;
  initialPaymentAmount?: number;
  paymentMethod?: string;
  initialPayment?: {
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  };
}

export const directTransactionService = {
  async listTransactions(params?: {
    type?: DirectTransactionType;
    status?: DirectTransactionStatus;
    counterpartyId?: number;
    weaverUserId?: number;
    merchantUserId?: number;
    limit?: number;
    offset?: number;
  }): Promise<DirectTransaction[]> {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    if (params?.status) query.append("status", params.status);
    if (params?.counterpartyId) query.append("counterpartyId", params.counterpartyId.toString());
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
    const payload = {
      ...data,
      type: data.type ?? data.transactionType,
      transactionType: data.transactionType ?? data.type,
      supplierId: data.supplierId,
      weaverUserId: data.weaverUserId ?? data.weaverId,
      weaverId: data.weaverId ?? data.weaverUserId,
      merchantUserId: data.merchantUserId ?? data.merchantId,
      merchantId: data.merchantId ?? data.merchantUserId,
      lines: data.lines ?? data.items ?? [],
      items: data.items ?? data.lines ?? [],
    };
    return request<DirectTransaction>("/direct-transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async recordPayment(
    id: string | number,
    data: {
      amount: number;
      paymentMethod: string;
      paymentDate?: string;
      referenceNumber?: string;
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
