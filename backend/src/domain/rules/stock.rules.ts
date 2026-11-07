import { DirectTxnType } from "@prisma/client";

export type StockDirection = "in" | "out" | "none";

export interface StockImpact {
  itemType: "fabric" | "yarn";
  direction: StockDirection;
  delta: number;
}

/**
 * Pure domain rule resolving stock impact from direct transactions
 */
export function getDirectTxnStockImpact(
  txnType: DirectTxnType,
  quantity: number,
): StockImpact {
  switch (txnType) {
    case DirectTxnType.fabric_purchase_from_weaver:
      return { itemType: "fabric", direction: "in", delta: Math.abs(quantity) };
    case DirectTxnType.fabric_sale_to_merchant:
      return { itemType: "fabric", direction: "out", delta: -Math.abs(quantity) };
    case DirectTxnType.yarn_sale_to_weaver:
      return { itemType: "yarn", direction: "out", delta: -Math.abs(quantity) };
    default:
      return { itemType: "fabric", direction: "none", delta: 0 };
  }
}

/**
 * Validates whether sufficient stock exists for an outflow transaction
 */
export function assertSufficientStock(currentStock: number, requestedOutflow: number): boolean {
  return currentStock >= Math.abs(requestedOutflow);
}
