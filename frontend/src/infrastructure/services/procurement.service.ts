import { request } from "../http/api-client";
import type { YarnPurchase } from "../../domain/models";

/** Payload matching backend CreateProcurementSchema. */
export interface CreateYarnPurchaseDto {
  supplierId: number;
  purchaseDate?: string;
  notes?: string | null;
  lines: Array<{
    yarnVariantId: number;
    quantity: number;
    unitPrice: number;
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
    return request<YarnPurchase>("/procurement/yarn-purchases", {
      method: "POST",
      body: JSON.stringify({
        supplierId: data.supplierId,
        purchaseDate: data.purchaseDate,
        notes: data.notes ?? null,
        lines: data.lines.map((l) => ({
          yarnVariantId: l.yarnVariantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      }),
    });
  },
};
