import type { CommercialTxnType } from "../api";

export function txnTypeFromRoute(
  direction: string,
  goods: string,
): CommercialTxnType | null {
  if (direction === "buy" && goods === "yarn") return "yarn_purchase";
  if (direction === "buy" && goods === "fabric") return "fabric_purchase";
  if (direction === "sell" && goods === "yarn") return "yarn_sale";
  if (direction === "sell" && goods === "fabric") return "fabric_sale";
  return null;
}

export const TXN_STATUS_LABELS: Record<string, string> = {
  // Backend DirectTxnStatus enum values
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  cancelled: "Cancelled",
  // Legacy / UI alias keys (kept for backward compatibility)
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_delivery: "Paid — Awaiting Delivery",
  awaiting_payment: "Delivered — Awaiting Payment",
  completed: "Completed",
};

export const TXN_TYPE_LABELS: Record<string, string> = {
  yarn_purchase: "Yarn Purchase",
  fabric_purchase: "Fabric Purchase",
  yarn_sale: "Yarn Sale",
  fabric_sale: "Fabric Sale",
  weaver_payout: "Weaver Payout",
  fabric_purchase_from_weaver: "Fabric Purchase from Weaver",
  yarn_sale_to_weaver: "Yarn Sale to Weaver",
  fabric_sale_to_merchant: "Fabric Sale to Merchant",
};

export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  prepaid: "Prepaid",
  on_delivery: "On Delivery",
  installment: "Installment",
};