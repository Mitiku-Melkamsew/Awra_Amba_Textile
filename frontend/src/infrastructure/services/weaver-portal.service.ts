import { request } from "../http/api-client";
import type {
  Weaver,
  WorkOrder,
  Settlement,
  DirectTransaction,
} from "../../domain/models";

export const weaverPortalService = {
  async getProfile(): Promise<Weaver> {
    return request<Weaver>("/weaver/profile");
  },

  async listWorkOrders(params?: { status?: string }): Promise<WorkOrder[]> {
    const qs = params?.status ? `?status=${params.status}` : "";
    const res = await request<WorkOrder[] | { workOrders: WorkOrder[]; total: number }>(
      `/weaver/work-orders${qs}`,
    );
    return Array.isArray(res) ? res : (res.workOrders ?? []);
  },

  async listSettlements(): Promise<Settlement[]> {
    const res = await request<Settlement[] | { settlements: Settlement[]; total: number }>(
      "/weaver/settlements",
    );
    return Array.isArray(res) ? res : (res.settlements ?? []);
  },

  async listDirectTransactions(): Promise<DirectTransaction[]> {
    const res = await request<DirectTransaction[] | { transactions: DirectTransaction[]; total: number }>(
      "/weaver/direct-transactions",
    );
    return Array.isArray(res) ? res : (res.transactions ?? []);
  },
};
