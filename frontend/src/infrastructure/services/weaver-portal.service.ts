import { request, getToken } from "../http/api-client";
import type {
  Weaver,
  WorkOrder,
  Settlement,
  DirectTransaction,
} from "../../domain/models";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export interface WeaverPaymentRecord {
  paymentId: number;
  settlementId: number;
  batchId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  settlementStatus: string;
}

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

  async listPayments(): Promise<WeaverPaymentRecord[]> {
    const res = await request<WeaverPaymentRecord[] | { payments: WeaverPaymentRecord[] }>(
      "/weaver/payments",
    );
    return Array.isArray(res) ? res : (res.payments ?? []);
  },

  async downloadPaymentReceiptCsv(paymentId: number): Promise<void> {
    const token = getToken();
    const response = await fetch(
      `${API_BASE}/weaver/payments/${paymentId}/statement?format=csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!response.ok) {
      throw new Error("Failed to download payment receipt");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HISAB-PAYMENT-${paymentId}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  async listDirectTransactions(): Promise<DirectTransaction[]> {
    const res = await request<DirectTransaction[] | { transactions: DirectTransaction[]; total: number }>(
      "/weaver/direct-transactions",
    );
    return Array.isArray(res) ? res : (res.transactions ?? []);
  },
};
