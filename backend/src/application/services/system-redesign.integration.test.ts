import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { SettlementService } from "./settlement.service.js";
import {
  createDirectTransaction,
  recordDirectTransactionPayment,
} from "./direct-transaction.service.js";
import { WorkOrderStatus, DirectTxnStatus } from "@prisma/client";

/**
 * End-to-end test that talks to a real PostgreSQL database and requires a
 * development database seeded with the `demo` weaver, `merchant` user and at
 * least one fabric/yarn variant (see backend/prisma/seed.ts and scripts/import-csv.ts).
 *
 * It is skipped by default so `npm test` stays green on a fresh checkout.
 * Run it explicitly against a disposable database:
 *
 *   RUN_INTEGRATION=1 npm test
 */
const runIntegrationTests = process.env.RUN_INTEGRATION === "1";

describe.skipIf(!runIntegrationTests)("System Redesign Integration - Production, Settlement & Direct Transactions", () => {
  let weaverUserId: number;
  let adminUserId: number;
  let merchantUserId: number;
  let fabricVariantId: number;
  let yarnVariantId: number;

  beforeAll(async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { username: "admin" } });
    const weaver = await prisma.user.findUniqueOrThrow({ where: { username: "demo" } });
    const merchant = await prisma.user.findUniqueOrThrow({ where: { username: "merchant" } });
    const fv = await prisma.fabricVariant.findFirstOrThrow({ orderBy: { fabricVariantId: "asc" } });
    const yv = await prisma.yarnVariant.findFirstOrThrow({ orderBy: { yarnVariantId: "asc" } });

    adminUserId = admin.userId;
    weaverUserId = weaver.userId;
    merchantUserId = merchant.userId;
    fabricVariantId = fv.fabricVariantId;
    yarnVariantId = yv.yarnVariantId;
  });

  it("completes full zig lifecycle: issue -> return -> yarn return -> settlement -> reconciled", async () => {
    const zigId = `z-test-${Date.now()}`;

    // 1. Create work order (assigned)
    const order = await prisma.workOrder.create({
      data: {
        zigId,
        weaverUserId,
        fabricVariantId,
        status: WorkOrderStatus.assigned,
        issuedByUserId: adminUserId,
      },
    });
    expect(order.status).toBe(WorkOrderStatus.assigned);

    // 2. Issue yarn (moves to in_progress)
    const yarnGiven = await prisma.yarnGiven.create({
      data: {
        zigId,
        yarnVariantId,
        quantity: 10,
        unitPrice: 400,
        recordedByUserId: adminUserId,
      },
    });

    await prisma.workOrder.update({
      where: { zigId },
      data: { status: WorkOrderStatus.in_progress },
    });

    // 3. Adjust yarn (weaver returned 2 cones unused, updated in place)
    const updatedYarn = await prisma.yarnGiven.update({
      where: { yarnGivenId: yarnGiven.yarnGivenId },
      data: {
        quantity: 8,
        remark: "Adjusted from 10 to 8: 2 cones returned unused",
      },
    });
    expect(Number(updatedYarn.quantity)).toBe(8);

    // 4. Return fabric (two returns of same fabric)
    // Return 1: 15 pieces, 900g (avg 60g)
    const return1 = await prisma.fabricReturn.create({
      data: {
        zigId,
        fabricVariantId,
        quantityReturned: 15,
        totalWeight: 900,
        unitPrice: 1300,
        grossFabricValue: 15 * 1300,
        deductionAmount: 15 * 20, // 2g deficit * 10 = 20 ETB/piece
        recordedByUserId: adminUserId,
      },
    });

    // Return 2: 25 pieces, 1600g (avg 64g)
    const return2 = await prisma.fabricReturn.create({
      data: {
        zigId,
        fabricVariantId,
        quantityReturned: 25,
        totalWeight: 1600,
        unitPrice: 1300,
        grossFabricValue: 25 * 1300,
        deductionAmount: 25 * 20,
        recordedByUserId: adminUserId,
      },
    });

    // Total: 40 pieces, 2500g -> average 62.5g -> floor 62g.
    // Standard weight is 64g. Deficit is 2g. Deduction = 2 * 10 = 20 ETB per piece.
    // Fabric gross: 40 * 1300 = 52,000 ETB.
    // Deduction: 40 * 20 = 800 ETB. Net fabric value = 51,200 ETB.
    // Net yarn: 8 cones * 400 ETB = 3,200 ETB.
    // Net settlement: 51,200 - 3,200 = 48,000 ETB.

    // Mark work order returned
    await prisma.workOrder.update({
      where: { zigId },
      data: { status: WorkOrderStatus.returned, dateReturned: new Date(), netPayable: 48000 },
    });

    // 5. Commit settlement
    const batchResult = await SettlementService.commitSingleSettlement({
      weaverUserId,
      returnIds: [return1.returnId, return2.returnId],
      yarnGivenIds: [yarnGiven.yarnGivenId],
      paymentMethod: "Bank Transfer",
      recordedByUserId: adminUserId,
      autoPay: true,
    });

    const settlementResult = batchResult.settlements[0];
    expect(Number(settlementResult.netAmount)).toBe(48000);

    // 6. Verify work order is now reconciled
    const updatedOrder = await prisma.workOrder.findUniqueOrThrow({ where: { zigId } });
    expect(updatedOrder.status).toBe(WorkOrderStatus.reconciled);

    // 7. Verify settlement audit records
    const settlement = await prisma.settlement.findUniqueOrThrow({
      where: { settlementId: settlementResult.settlementId },
      include: {
        workOrders: {
          include: { fabricReturns: true, yarnGiven: true },
        },
        payments: true,
      },
    });

    expect(settlement.status).toBe("paid");
    expect(settlement.workOrders.length).toBe(1);
    expect(settlement.workOrders[0].fabricReturns.length).toBe(2);
    expect(settlement.workOrders[0].yarnGiven.length).toBe(1);
    expect(Number(settlement.workOrders[0].yarnGiven[0].quantity)).toBe(8);
    expect(settlement.payments.length).toBe(1);
    expect(Number(settlement.payments[0].amount)).toBe(48000);
  });

  it("handles direct transactions and stock adjustments correctly", async () => {
    // 1. Fabric sale to merchant with partial payment
    const merchantSale = await createDirectTransaction({
      type: "fabric_sale_to_merchant",
      merchantUserId,
      createdByUserId: adminUserId,
      lines: [
        {
          fabricVariantId,
          quantity: 5,
          unitPrice: 1600, // Total: 8,000 ETB
        },
      ],
      initialPaymentAmount: 3000,
      paymentMethod: "Cash",
    });

    expect(Number(merchantSale.totalAmount)).toBe(8000);
    expect(Number(merchantSale.amountPaid)).toBe(3000);
    expect(merchantSale.status).toBe(DirectTxnStatus.partially_paid);
    expect(merchantSale.payments.length).toBe(1);

    // 2. Pay remaining balance
    const payResult = await recordDirectTransactionPayment({
      transactionId: merchantSale.transactionId,
      amount: 5000,
      paymentMethod: "CBE Birr",
      recordedByUserId: adminUserId,
    });

    expect(Number(payResult.transaction.amountPaid)).toBe(8000);
    expect(payResult.transaction.status).toBe(DirectTxnStatus.paid);

    // 3. Reject overpayment
    await expect(
      recordDirectTransactionPayment({
        transactionId: merchantSale.transactionId,
        amount: 100,
        recordedByUserId: adminUserId,
      }),
    ).rejects.toThrow(/exceeds remaining balance/);

    // 4. Yarn sale to weaver
    const yarnSale = await createDirectTransaction({
      type: "yarn_sale_to_weaver",
      weaverUserId,
      createdByUserId: adminUserId,
      lines: [
        {
          yarnVariantId,
          quantity: 2,
          unitPrice: 450, // 900 ETB
        },
      ],
    });

    expect(Number(yarnSale.totalAmount)).toBe(900);
    expect(yarnSale.status).toBe(DirectTxnStatus.unpaid);
  });
});
