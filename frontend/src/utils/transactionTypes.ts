import type { CommercialTxnType } from "../api";

/**
 * Route -> canonical transaction type.
 * Direct transaction types mirror the Prisma `DirectTxnType` enum.
 * `yarn_purchase` is a procurement (YarnPurchase) facade, not a DirectTxnType.
 */
export function txnTypeFromRoute(
  direction: string,
  goods: string,
): CommercialTxnType | null {
  if (direction === "buy" && goods === "yarn") return "yarn_purchase";
  if (direction === "buy" && goods === "fabric") return "fabric_purchase_from_weaver";
  if (direction === "sell" && goods === "yarn") return "yarn_sale_to_weaver";
  if (direction === "sell" && goods === "fabric") return "fabric_sale_to_merchant";
  return null;
}

export const TXN_STATUS_LABELS: Record<string, string> = {
  // Prisma DirectTxnStatus values
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const TXN_TYPE_LABELS: Record<string, string> = {
  yarn_purchase: "Yarn Purchase",
  fabric_purchase_from_weaver: "Fabric Purchase from Weaver",
  yarn_sale_to_weaver: "Yarn Sale to Weaver",
  fabric_sale_to_merchant: "Fabric Sale to Merchant",
};

export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  prepaid: "Prepaid",
  on_delivery: "On Delivery",
  installment: "Installment",
};