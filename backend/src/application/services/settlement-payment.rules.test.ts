import { describe, expect, it } from "vitest";
import { allocateBatchPayment } from "./settlement-payment.rules.js";

describe("allocateBatchPayment", () => {
  it("distributes one requested amount across outstanding settlements", () => {
    expect(
      allocateBatchPayment(
        [
          { settlementId: 1, balance: 70 },
          { settlementId: 2, balance: 80 },
        ],
        120,
      ),
    ).toEqual([
      { settlementId: 1, amount: 70 },
      { settlementId: 2, amount: 50 },
    ]);
  });

  it("never allocates more than outstanding balances", () => {
    expect(
      allocateBatchPayment(
        [
          { settlementId: 1, balance: 0 },
          { settlementId: 2, balance: 25 },
        ],
        100,
      ),
    ).toEqual([{ settlementId: 2, amount: 25 }]);
  });
});
