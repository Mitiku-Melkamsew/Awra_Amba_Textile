import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import {
  serializeMerchantProfile,
  serializeUserBalance,
  serializeUserList,
  serializeUserSummary,
  serializeWeaverProfile,
} from "./user.serializer.js";
import { serializeAvailableFabric, serializeStockSummary } from "./stock.serializer.js";
import { serializeAuditList, serializeAuditLog } from "./audit.serializer.js";
import {
  serializeFabricReturn,
  serializeWorkOrder,
  serializeWorkOrderList,
  serializeYarnGiven,
} from "./work-order.serializer.js";
import {
  serializeBatchCommitResult,
  serializeBatchPayResult,
  serializePendingSummary,
  serializeSettlement,
  serializeSettlementBatch,
  serializeSettlementPayment,
  serializeSettlementPreview,
  serializeZigsLedgerRow,
} from "./settlement.serializer.js";
import {
  serializeDirectTransaction,
  serializeDirectTransactionList,
  serializeDirectTxnPaymentResult,
  serializeYarnPurchase,
  serializeYarnPurchaseList,
} from "./direct-transaction.serializer.js";
import {
  serializeFinancialSummary,
  serializeHisabReport,
  serializeMerchantBalanceItem,
  serializeProductionSummary,
  serializeSettlementPaymentReportItem,
  serializeWeaverBalanceItem,
  serializeWeaverPaymentItem,
} from "./report.serializer.js";

describe("user.serializer", () => {
  it("strips credentials and maps roles while preserving initialPassword only when present", () => {
    const plain = serializeUserSummary({
      userId: 10,
      username: "abebe",
      firstName: "Abebe",
      lastName: "Bikila",
      fullName: "Abebe Bikila",
      phone: "0911111111",
      email: null,
      isActive: true,
      roles: [{ role: UserRole.weaver }],
      passwordHash: "secret-hash",
      tokenVersion: 9,
      internalFlag: "leak",
    });

    expect(plain.roles).toEqual([UserRole.weaver]);
    expect("passwordHash" in plain).toBe(false);
    expect("tokenVersion" in plain).toBe(false);
    expect("internalFlag" in plain).toBe(false);
    expect("initialPassword" in plain).toBe(false);

    const created = serializeUserSummary({
      userId: 11,
      username: "newweaver",
      firstName: "New",
      lastName: "Weaver",
      fullName: "New Weaver",
      phone: null,
      email: null,
      isActive: true,
      roles: [UserRole.weaver],
      initialPassword: "temp-password-123",
      passwordHash: "secret-hash",
    });
    expect(created.initialPassword).toBe("temp-password-123");
    expect("passwordHash" in created).toBe(false);
  });

  it("serializes user list, balance, weaver profile, and merchant profile", () => {
    const list = serializeUserList({
      users: [
        {
          userId: 1,
          username: "u1",
          firstName: "U",
          lastName: "1",
          fullName: "U 1",
          phone: null,
          email: null,
          isActive: true,
          roles: [{ role: UserRole.merchant }],
          passwordHash: "hash",
        },
      ],
      total: 1,
    });
    expect(list.total).toBe(1);
    expect("passwordHash" in list.users[0]).toBe(false);

    const balance = serializeUserBalance({
      userId: 1,
      roles: [UserRole.weaver],
      weaverBalance: { directPurchasePayable: "120", unsettledReturnedZigsCount: "3", secret: 1 },
      extra: "ignore",
    });
    expect(balance).toEqual({
      userId: 1,
      roles: [UserRole.weaver],
      weaverBalance: { directPurchasePayable: 120, unsettledReturnedZigsCount: 3 },
    });

    const weaverProfile = serializeWeaverProfile({
      userId: 2,
      username: "w2",
      firstName: "W",
      lastName: "2",
      fullName: "W 2",
      phone: null,
      email: null,
      isActive: true,
      roles: [UserRole.weaver],
      activeOrdersCount: 4,
      passwordHash: "hash",
    });
    expect(weaverProfile.activeOrdersCount).toBe(4);
    expect("passwordHash" in weaverProfile).toBe(false);

    const merchantProfile = serializeMerchantProfile({
      userId: 3,
      username: "m3",
      firstName: "M",
      lastName: "3",
      fullName: "M 3",
      phone: null,
      email: null,
      isActive: true,
      roles: [UserRole.merchant],
      passwordHash: "hash",
    });
    expect("passwordHash" in merchantProfile).toBe(false);
  });
});

describe("stock.serializer", () => {
  it("omits undefined weaverRate and unknown fields on available fabrics", () => {
    const masked = serializeAvailableFabric({
      fabricVariantId: 5,
      sku: "FAB-01",
      fabricId: 1,
      fabricName: "Shemma",
      standardLengthCm: 250,
      standardWidthCm: 80,
      standardWeightG: 400,
      design: "Plain",
      warpColor: "White",
      weftColor: "Blue",
      sellingPrice: 1200,
      weaverRate: undefined,
      secretMargin: 99,
    });
    expect("weaverRate" in masked).toBe(false);
    expect("secretMargin" in masked).toBe(false);

    const unmasked = serializeAvailableFabric({
      fabricVariantId: 5,
      sku: "FAB-01",
      weaverRate: 450,
      secretMargin: 99,
    });
    expect(unmasked.weaverRate).toBe(450);
    expect("secretMargin" in unmasked).toBe(false);
  });

  it("projects stock summary variants", () => {
    const summary = serializeStockSummary({
      totalYarnStockPieces: 40,
      totalFabricStockPieces: 12,
      yarns: [{ yarnVariantId: 1, yarnId: 1, sku: "Y1", extraColumn: "x" }],
      fabrics: [{ fabricVariantId: 2, fabricId: 1, sku: "F1", extraColumn: "y" }],
      secretTotal: 999,
    });
    expect("secretTotal" in summary).toBe(false);
    expect("extraColumn" in summary.yarns[0]).toBe(false);
    expect("extraColumn" in summary.fabrics[0]).toBe(false);
  });
});

describe("audit.serializer", () => {
  it("projects audit logs and strips actor credentials", () => {
    const log = serializeAuditLog({
      auditLogId: 9,
      actorUserId: 1,
      action: "CREATE",
      entityType: "WorkOrder",
      entityId: "100",
      details: { ok: true },
      createdAt: "2026-11-28T00:00:00Z",
      actor: {
        userId: 1,
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        fullName: "Admin User",
        passwordHash: "hash",
      },
      ipAddress: "127.0.0.1",
    });
    expect("ipAddress" in log).toBe(false);
    expect("passwordHash" in log.actor).toBe(false);

    const list = serializeAuditList({ logs: [log], total: 1 });
    expect(list.total).toBe(1);
    expect(list.logs).toHaveLength(1);
  });
});

describe("work-order.serializer", () => {
  it("projects work order and strips credentials and unknown fields", () => {
    const row = serializeWorkOrder({
      zigId: 201,
      weaverUserId: 7,
      fabricVariantId: 3,
      status: "issued",
      dateIssued: "2026-11-28T00:00:00Z",
      dateReturned: null,
      issuedByUserId: 1,
      netPayable: 500,
      settlementId: null,
      settlementBatchId: null,
      weaver: {
        userId: 7,
        firstName: "Demo",
        lastName: "Weaver",
        fullName: "Demo Weaver",
        passwordHash: "secret",
        tokenVersion: 2,
      },
      yarnGiven: [
        serializeYarnGiven({
          yarnGivenId: 1,
          zigId: 201,
          yarnVariantId: 2,
          quantity: 10,
          unitPrice: 50,
          secretCol: "no",
        }),
      ],
      fabricReturns: [
        serializeFabricReturn({
          returnId: 1,
          zigId: 201,
          fabricVariantId: 3,
          quantityReturned: 2,
          totalWeight: 800,
          lengthCm: 250,
          widthCm: 80,
          unitPrice: 300,
          grossFabricValue: 600,
          deductionAmount: 0,
          deductions: null,
          secretCol: "no",
        }),
      ],
      extraDbCol: "hidden",
    });

    expect("extraDbCol" in row).toBe(false);
    expect("passwordHash" in row.weaver).toBe(false);
    expect("tokenVersion" in row.weaver).toBe(false);
    expect("secretCol" in row.yarnGiven[0]).toBe(false);
    expect("secretCol" in row.fabricReturns[0]).toBe(false);

    const list = serializeWorkOrderList({ workOrders: [row], total: 1 });
    expect(list.total).toBe(1);
    expect(list.workOrders).toHaveLength(1);
  });
});

describe("settlement.serializer", () => {
  it("projects settlements, batches, previews, results, summary, and zigs ledger", () => {
    const payment = serializeSettlementPayment({
      settlementPaymentId: 1,
      settlementId: 2,
      amount: 300,
      paymentMethod: "Cash",
      paymentDate: "2026-11-28",
      recordedByUserId: 1,
      notes: null,
      batch: { totalAmount: 600, amountPaid: 300, status: "partial", internal: 1 },
      extra: "strip",
    });
    expect("extra" in payment).toBe(false);
    expect("internal" in payment.batch).toBe(false);

    const settlement = serializeSettlement({
      settlementId: 2,
      batchId: 10,
      weaverUserId: 7,
      status: "committed",
      grossFabricValue: 1000,
      totalDeductions: 50,
      totalYarnCost: 200,
      netAmount: 750,
      weaver: { userId: 7, firstName: "W", lastName: "1", fullName: "W 1", passwordHash: "x" },
      extra: "strip",
    });
    expect("extra" in settlement).toBe(false);
    expect("passwordHash" in settlement.weaver).toBe(false);

    const batch = serializeSettlementBatch({
      batchId: 10,
      status: "committed",
      cutoffDate: "2026-11-28",
      exceptionZigIds: [],
      totalAmount: 750,
      amountPaid: 0,
      settlements: [settlement],
      extra: "strip",
    });
    expect("extra" in batch).toBe(false);
    expect(batch.settlements).toHaveLength(1);

    const preview = serializeSettlementPreview({
      bundles: [
        {
          weaverUserId: 7,
          weaverName: "W 1",
          zigIds: [1],
          returnIds: [2],
          yarnGivenIds: [3],
          grossFabricValue: 500,
          totalDeductions: 0,
          totalYarnCost: 100,
          netSettlement: 400,
          isBlocked: false,
          blockReasons: [],
          fabricLines: [{ returnId: 2, zigId: 1, secret: true }],
          yarnLines: [{ yarnGivenId: 3, zigId: 1, secret: true }],
          secret: true,
        },
      ],
      grandTotal: 400,
      outOfCutoffZigs: [{ zigId: 99, weaverUserId: 7, weaverName: "W 1", firstReturnDate: "2026-11-29", secret: true }],
      secret: true,
    });
    expect("secret" in preview).toBe(false);
    expect("secret" in preview.bundles[0]).toBe(false);
    expect("secret" in preview.bundles[0].fabricLines[0]).toBe(false);
    expect("secret" in preview.bundles[0].yarnLines[0]).toBe(false);
    expect("secret" in preview.outOfCutoffZigs[0]).toBe(false);

    expect(serializeBatchCommitResult({ batchId: 10, status: "committed", grandTotal: 400, settlements: [] }).batchId).toBe(10);
    expect(serializeBatchPayResult({ batchId: 10, status: "paid", amountPaid: 400, totalAmount: 400, payments: [], settlements: [{ settlementId: 2, status: "paid", secret: 1 }] }).settlements[0]).toEqual({ settlementId: 2, status: "paid" });
    expect(serializePendingSummary({ pendingLiability: 400, unsettledZigCount: 2, weaverCount: 1, extra: 1 })).toEqual({
      pendingLiability: 400,
      unsettledZigCount: 2,
      weaverCount: 1,
    });

    const zigsRow = serializeZigsLedgerRow({
      zigId: 1,
      weaverUserId: 7,
      weaverName: "W 1",
      status: "returned",
      dateIssued: "2026-11-28",
      fabricName: "Shemma",
      standardWeightG: 400,
      warpColor: "White",
      weftColor: "Blue",
      design: "Plain",
      netPayable: 400,
      yarn: { issuedQuantity: 2, returnedQuantity: 0, netQuantity: 2, totalCost: 100, extra: 1 },
      fabric: { receivedQuantity: 2, defectiveQuantity: 0, billableQuantity: 2, totalWeight: 800, averageWeight: 400, grossFabricValue: 500, deductionAmount: 0, netFabricValue: 500, extra: 1 },
      settlement: null,
      isSettled: false,
      extra: 1,
    });
    expect("extra" in zigsRow).toBe(false);
    expect("extra" in zigsRow.yarn).toBe(false);
    expect("extra" in zigsRow.fabric).toBe(false);
  });
});

describe("direct-transaction.serializer", () => {
  it("projects direct transactions, payment results, and yarn purchases without credential leaks", () => {
    const txn = serializeDirectTransaction({
      transactionId: 15,
      type: "fabric_sale",
      status: "unpaid",
      totalAmount: 1000,
      amountPaid: 0,
      merchant: { userId: 3, firstName: "M", lastName: "1", fullName: "M 1", passwordHash: "hash" },
      lines: [{ lineId: 1, transactionId: 15, quantity: 2, unitPrice: 500, lineTotal: 1000, secret: 1 }],
      payments: [{ paymentId: 1, transactionId: 15, amount: 200, recordedBy: { userId: 1, passwordHash: "hash" }, secret: 1 }],
      secret: "drop",
    });
    expect("secret" in txn).toBe(false);
    expect("passwordHash" in txn.merchant).toBe(false);
    expect("secret" in txn.lines[0]).toBe(false);
    expect("secret" in txn.payments[0]).toBe(false);
    expect("passwordHash" in txn.payments[0].recordedBy).toBe(false);

    expect(serializeDirectTransactionList({ transactions: [txn], total: 1 }).total).toBe(1);
    const payRes = serializeDirectTxnPaymentResult({
      payment: { paymentId: 1, transactionId: 15, amount: 200, secret: 1 },
      transaction: txn,
    });
    expect("secret" in payRes.payment).toBe(false);

    const purchase = serializeYarnPurchase({
      purchaseId: 22,
      supplierId: 4,
      purchaseDate: "2026-11-28",
      createdByUserId: 1,
      supplier: { supplierId: 4, name: "Sup", extra: "x" },
      lines: [{ lineId: 1, purchaseId: 22, yarnVariantId: 5, quantity: 10, unitPrice: 40, extra: "x" }],
      extra: "x",
    });
    expect("extra" in purchase).toBe(false);
    expect("extra" in purchase.supplier).toBe(false);
    expect("extra" in purchase.lines[0]).toBe(false);
    expect(serializeYarnPurchaseList({ purchases: [purchase], total: 1 }).total).toBe(1);
  });
});

describe("report.serializer", () => {
  it("projects financial, production, balances, payments, and hisab reports", () => {
    const financial = serializeFinancialSummary({
      revenue: { merchantFabricSalesTotal: 1000 },
      expenses: { totalExpenses: 400 },
      profitability: { netOperatingProfit: 600 },
      fabricSalesRevenue: 1000,
      extra: "strip",
    });
    expect("extra" in financial).toBe(false);
    expect(financial.revenue.merchantFabricSalesTotal).toBe(1000);

    const production = serializeProductionSummary({
      workOrdersAssigned: 5,
      workOrdersReturned: 3,
      extra: "strip",
    });
    expect("extra" in production).toBe(false);

    expect("extra" in serializeWeaverBalanceItem({ weaverUserId: 7, netPayableBalance: 200, extra: 1 })).toBe(false);
    expect("extra" in serializeMerchantBalanceItem({ merchantUserId: 3, outstandingReceivable: 500, extra: 1 })).toBe(false);

    const paymentItem = serializeSettlementPaymentReportItem({
      paymentId: 1,
      settlementId: 2,
      amount: 300,
      paymentDate: "2026-11-28",
      weaver: { userId: 7, firstName: "W", lastName: "1", fullName: "W 1", passwordHash: "hash" },
      extra: "strip",
    });
    expect("extra" in paymentItem).toBe(false);
    expect("passwordHash" in paymentItem.weaver!).toBe(false);

    expect("extra" in serializeWeaverPaymentItem({ paymentId: 1, settlementId: 2, batchId: 10, amount: 300, paymentDate: "2026-11-28", settlementStatus: "paid", extra: 1 })).toBe(false);

    const hisab = serializeHisabReport({
      settlementId: 2,
      paymentDate: "2026-11-28",
      weaver: { userId: 7, firstName: "W", lastName: "1", fullName: "W 1", passwordHash: "hash" },
      amount: 300,
      amharicAmountInWords: "ሶስት መቶ ብር",
      rows: [{ zigId: 1, netProfit: 300, extra: "strip" }],
      isPaid: true,
      status: "paid",
      extra: "strip",
    });
    expect("extra" in hisab).toBe(false);
    expect("passwordHash" in hisab.weaver!).toBe(false);
    expect("extra" in hisab.rows[0]).toBe(false);
  });
});
