import type { Weaver, Merchant, FabricVariant, YarnVariant, Supplier } from "./index";

/** Mirrors the Prisma `DirectTxnType` enum. */
export type DirectTransactionType =
  | "fabric_purchase_from_weaver"
  | "yarn_sale_to_weaver"
  | "fabric_sale_to_merchant";

/**
 * Direct transactions plus `yarn_purchase`, which routes to
 * YarnPurchase / YarnPurchaseLine procurement flow.
 */
export type CommercialTxnType = "yarn_purchase" | DirectTransactionType;

/** Mirrors the Prisma `DirectTxnStatus` enum. */
export type DirectTransactionStatus =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "cancelled";

export interface DirectTransactionItem {
  lineId: number;
  transactionId: number;
  fabricVariantId?: number | null;
  yarnVariantId?: number | null;
  quantity: number | string;
  unitPrice: number | string;
  lineTotal?: number | string;
  description?: string | null;
  fabricVariant?: FabricVariant | null;
  yarnVariant?: YarnVariant | null;
}

export interface DirectPayment {
  paymentId: number;
  transactionId: number;
  amount: number | string;
  paymentDate: string;
  paymentMethod?: string | null;
  notes?: string | null;
  recordedByUserId?: number;
}

export interface DirectTransaction {
  transactionId: number | string;
  type: CommercialTxnType;
  status: DirectTransactionStatus;
  weaverUserId?: number | null;
  merchantUserId?: number | null;
  transactionDate: string;
  totalAmount: number | string;
  amountPaid: number | string;
  notes?: string | null;
  createdAt: string;
  weaver?: Weaver | null;
  merchant?: Merchant | null;
  supplier?: Supplier | null;
  lines?: DirectTransactionItem[];
  payments?: DirectPayment[];
}

export type CommercialTransaction = DirectTransaction;
