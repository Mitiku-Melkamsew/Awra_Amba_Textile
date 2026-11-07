import type { Supplier, YarnVariant } from "./index";

export interface YarnPurchaseLine {
  yarnPurchaseLineId: number;
  yarnPurchaseId: number;
  yarnVariantId: number;
  quantityKg: number | string;
  unitCost: number | string;
  lineTotal: number | string;
  yarnVariant?: YarnVariant;
}

export interface YarnPurchase {
  yarnPurchaseId: number;
  purchaseId?: number;
  supplierId: number;
  purchaseDate: string;
  invoiceNumber?: string | null;
  totalCost: number | string;
  notes?: string | null;
  createdAt: string;
  supplier?: Supplier;
  lines?: YarnPurchaseLine[];
}
