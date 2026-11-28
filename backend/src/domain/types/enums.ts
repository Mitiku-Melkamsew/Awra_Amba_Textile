export const UserRole = {
  admin: "admin",
  weaver: "weaver",
  merchant: "merchant",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const WorkOrderStatus = {
  assigned: "assigned",
  in_progress: "in_progress",
  returned: "returned",
  reconciled: "reconciled",
  cancelled: "cancelled",
} as const;
export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

export const SettlementStatus = {
  draft: "draft",
  committed: "committed",
  paid: "paid",
  cancelled: "cancelled",
} as const;
export type SettlementStatus = (typeof SettlementStatus)[keyof typeof SettlementStatus];

export const DirectTxnType = {
  fabric_purchase_from_weaver: "fabric_purchase_from_weaver",
  yarn_sale_to_weaver: "yarn_sale_to_weaver",
  fabric_sale_to_merchant: "fabric_sale_to_merchant",
} as const;
export type DirectTxnType = (typeof DirectTxnType)[keyof typeof DirectTxnType];

export const DirectTxnStatus = {
  unpaid: "unpaid",
  partially_paid: "partially_paid",
  paid: "paid",
  cancelled: "cancelled",
} as const;
export type DirectTxnStatus = (typeof DirectTxnStatus)[keyof typeof DirectTxnStatus];

export const SettlementBatchStatus = {
  draft: "draft",
  committed: "committed",
  paid: "paid",
  cancelled: "cancelled",
} as const;
export type SettlementBatchStatus =
  (typeof SettlementBatchStatus)[keyof typeof SettlementBatchStatus];
