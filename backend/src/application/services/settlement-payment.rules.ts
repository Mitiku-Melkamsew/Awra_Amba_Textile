export interface SettlementBalance {
  settlementId: number;
  balance: number;
}

export interface SettlementPaymentAllocation {
  settlementId: number;
  amount: number;
}

export function allocateBatchPayment(
  balances: SettlementBalance[],
  requestedAmount: number,
): SettlementPaymentAllocation[] {
  let remaining = Math.max(0, requestedAmount);
  const allocations: SettlementPaymentAllocation[] = [];

  for (const settlement of balances) {
    if (remaining <= 0.005) break;
    const balance = Math.max(0, settlement.balance);
    if (balance <= 0.005) continue;

    const amount = Math.min(balance, remaining);
    allocations.push({ settlementId: settlement.settlementId, amount });
    remaining = Number((remaining - amount).toFixed(2));
  }

  return allocations;
}
