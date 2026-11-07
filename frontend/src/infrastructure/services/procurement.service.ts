import { request } from "../http/api-client";
import type { YarnPurchase } from "../../domain/models";

export interface CreateYarnPurchaseDto {
  supplierId: number;
  purchaseDate?: string;
  invoiceNumber?: string;
  notes?: string;
  lines: Array<{
    yarnVariantId: number;
    quantityKg?: number;
    quantity?: number;
    unitCost?: number;
    unitPrice?: number;
  }>;
}

export const procurementService = {
  async listPurchases(): Promise<YarnPurchase[]> {
    const res = await request<YarnPurchase[] | { purchases: YarnPurchase[]; total: number }>(
      "/procurement/yarn-purchases",
    );
    return Array.isArray(res) ? res : (res.purchases ?? []);
  },

  async getPurchase(id: string | number): Promise<YarnPurchase> {
    return request<YarnPurchase>(`/procurement/yarn-purchases/${id}`);
  },

  async recordPurchase(data: CreateYarnPurchaseDto): Promise<YarnPurchase> {
    const body = {
      ...data,
      lines: data.lines.map((l) => ({
        yarnVariantId: l.yarnVariantId,
        quantity: l.quantity ?? l.quantityKg ?? 0,
        unitPrice: l.unitPrice ?? l.unitCost ?? 0,
        quantityKg: l.quantityKg ?? l.quantity ?? 0,
        unitCost: l.unitCost ?? l.unitPrice ?? 0,
      })),
    };
    return request<YarnPurchase>("/procurement/yarn-purchases", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
