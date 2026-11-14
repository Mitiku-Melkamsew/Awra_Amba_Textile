import type { Supplier, YarnVariant } from "./index";

/** Mirrors Prisma `YarnPurchaseLine` (yarn_purchase_lines). */
export interface YarnPurchaseLine {
  lineId: number;
  purchaseId: number;
  yarnVariantId: number;
  quantity: number | string;
  unitPrice: number | string;
  yarnVariant?: YarnVariant;
}

/** Mirrors Prisma `YarnPurchase` (yarn_purchases). */
export interface YarnPurchase {
  purchaseId: number;
  supplierId: number;
  purchaseDate: string;
  createdByUserId: number;
  notes?: string | null;
  supplier?: Supplier;
  lines?: YarnPurchaseLine[];
}