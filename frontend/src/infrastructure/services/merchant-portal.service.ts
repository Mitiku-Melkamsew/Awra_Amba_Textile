import { request } from "../http/api-client";
import type {
  Merchant,
  FabricVariant,
  DirectTransaction,
} from "../../domain/models";

export const merchantPortalService = {
  async getProfile(): Promise<Merchant> {
    return request<Merchant>("/merchant/profile");
  },

  async getCatalog(): Promise<FabricVariant[]> {
    return request<FabricVariant[]>("/merchant/catalog");
  },

  async listTransactions(): Promise<DirectTransaction[]> {
    const res = await request<DirectTransaction[] | { transactions: DirectTransaction[]; total: number }>(
      "/merchant/transactions",
    );
    return Array.isArray(res) ? res : (res.transactions ?? []);
  },

  async getTransaction(id: string | number): Promise<DirectTransaction> {
    return request<DirectTransaction>(`/merchant/transactions/${id}`);
  },
};
