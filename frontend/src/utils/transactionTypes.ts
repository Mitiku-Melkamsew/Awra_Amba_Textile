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
  pending: "Pending",
  in_progress: "In Progress",
  awaiting_delivery: "Paid — Awaiting Delivery",
  awaiting_payment: "Delivered — Awaiting Payment",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TXN_TYPE_LABELS: Record<CommercialTxnType, string> = {
  yarn_purchase: "Yarn Purchase",
  fabric_purchase: "Fabric Purchase",
  yarn_sale: "Yarn Sale",
  fabric_sale: "Fabric Sale",
  weaver_payout: "Weaver Payout",
};

export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  prepaid: "Prepaid",
  on_delivery: "On Delivery",
  installment: "Installment",
};