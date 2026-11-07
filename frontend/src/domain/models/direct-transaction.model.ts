import type { Weaver, Merchant, FabricVariant, YarnVariant } from "./index";

export type DirectTransactionType =
  | "fabric_purchase_from_weaver"
  | "yarn_sale_to_weaver"
  | "fabric_sale_to_merchant";

export type CommercialTxnType =
  | "yarn_purchase"
  | "fabric_purchase"
  | "yarn_sale"
  | "fabric_sale"
  | "weaver_payout"
  | DirectTransactionType;

export type DirectTransactionStatus =
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "cancelled";

export type CommercialTxnStatus =
  | "pending"
  | "in_progress"
  | "awaiting_delivery"
  | "awaiting_payment"
  | "completed"
  | "cancelled"
  | DirectTransactionStatus;

export type PaymentTerms = "prepaid" | "on_delivery" | "installment";

export interface DirectTransactionItem {
  directTransactionItemId: number;
  lineId?: number;
  directTransactionId: number;
  fabricVariantId?: number | null;
  yarnVariantId?: number | null;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice?: number | string;
  deliveredQuantity?: string;
  description?: string | null;
  fabricVariant?: FabricVariant | null;
  yarnVariant?: YarnVariant | null;
}

export interface DirectPayment {
  directPaymentId: number;
  installmentId?: number;
  directTransactionId: number;
  amount: number | string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  recordedByUserId?: number;
}

export interface DirectTransaction {
  directTransactionId: number;
  transactionId?: string;
  transactionType: DirectTransactionType | CommercialTxnType;
  type?: CommercialTxnType;
  weaverId?: number | null;
  merchantId?: number | null;
  supplierId?: number | null;
  transactionDate: string;
  totalAmount: number | string;
  paidAmount: number | string;
  amountPaid?: number | string;
  balanceDue?: number | string;
  paymentStatus: DirectTransactionStatus | CommercialTxnStatus;
  status?: CommercialTxnStatus;
  paymentTerms?: PaymentTerms;
  deliveredAt?: string | null;
  notes?: string | null;
  linkedPaymentId?: number | null;
  createdAt: string;
  weaver?: Weaver | { firstName: string; lastName: string } | null;
  merchant?: Merchant | { companyName: string | null; contactPhone: string } | null;
  supplier?: { name: string } | null;
  items?: DirectTransactionItem[];
  lines?: DirectTransactionItem[];
  payments?: DirectPayment[];
}

export type CommercialTransaction = DirectTransaction;
