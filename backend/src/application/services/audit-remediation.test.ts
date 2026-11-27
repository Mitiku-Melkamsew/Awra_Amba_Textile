import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { signToken } from "../../utils/jwt.js";
import {
  DirectTxnIdParamSchema,
  NumericIdParamSchema,
} from "../../presentation/dtos/common.dto.js";
import { AddYarnGivenSchema, UpdateYarnGivenSchema } from "../../presentation/dtos/work-order.dto.js";
import { CreateProcurementSchema } from "../../presentation/dtos/procurement.dto.js";
import { CreateDirectTransactionSchema } from "../../presentation/dtos/direct-transaction.dto.js";
import { calculateQualityDeductions } from "./calculation.service.js";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    directTransaction: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    yarnPurchase: {
      findMany: vi.fn(),
    },
    settlementPayment: {
      aggregate: vi.fn(),
    },
    settlement: {
      findMany: vi.fn(),
    },
    workOrder: {
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    yarnVariant: {
      findMany: vi.fn(),
    },
    fabricVariant: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../lib/prisma.js", () => ({ prisma: mockPrisma }));

import { authenticate } from "../../presentation/middleware/authenticate.js";
import { ReportService } from "./report.service.js";
import { AuditService } from "./audit.service.js";
import { StockService } from "./stock.service.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("C2 — authenticate middleware revocation & fresh roles", () => {
  it("rejects deactivated users even with a valid JWT", async () => {
    const token = signToken({
      userId: 5,
      username: "weaver1",
      roles: [UserRole.weaver],
      tokenVersion: 0,
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      userId: 5,
      username: "weaver1",
      isActive: false,
      tokenVersion: 0,
      roles: [{ role: UserRole.weaver }],
    });

    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const next = vi.fn();
    await authenticate(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("rejects tokens whose tokenVersion does not match DB", async () => {
    const token = signToken({
      userId: 5,
      username: "weaver1",
      roles: [UserRole.admin],
      tokenVersion: 1,
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      userId: 5,
      username: "weaver1",
      isActive: true,
      tokenVersion: 2,
      roles: [{ role: UserRole.weaver }],
    });

    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const next = vi.fn();
    await authenticate(req, {} as any, next);

    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("attaches fresh roles from DB when active and tokenVersion matches", async () => {
    const token = signToken({
      userId: 5,
      username: "weaver1",
      roles: [UserRole.weaver],
      tokenVersion: 3,
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      userId: 5,
      username: "weaver1",
      isActive: true,
      tokenVersion: 3,
      roles: [{ role: UserRole.weaver }, { role: UserRole.merchant }],
    });

    const req = { headers: { authorization: `Bearer ${token}` } } as any;
    const next = vi.fn();
    await authenticate(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user.roles).toEqual([UserRole.weaver, UserRole.merchant]);
  });
});

describe("H6 — Route parameter validation", () => {
  it("rejects non-numeric settlement IDs like 'unsettled' and 'abc'", () => {
    expect(NumericIdParamSchema.safeParse({ id: "unsettled" }).success).toBe(false);
    expect(NumericIdParamSchema.safeParse({ id: "abc" }).success).toBe(false);
    expect(NumericIdParamSchema.safeParse({ id: "0" }).success).toBe(false);
    expect(NumericIdParamSchema.safeParse({ id: "42" }).success).toBe(true);
  });

  it("validates direct-transaction IDs allowing numeric or yp-<id>", () => {
    expect(DirectTxnIdParamSchema.safeParse({ id: "12" }).success).toBe(true);
    expect(DirectTxnIdParamSchema.safeParse({ id: "yp-7" }).success).toBe(true);
    expect(DirectTxnIdParamSchema.safeParse({ id: "abc" }).success).toBe(false);
  });
});

describe("H2 & H8 — ReportService accuracy & UI field alignment", () => {
  it("counts partial settlement payouts via SettlementPayment in getFinancialSummary", async () => {
    mockPrisma.directTransaction.aggregate
      .mockResolvedValueOnce({ _sum: { totalAmount: 10000, amountPaid: 8000 } })
      .mockResolvedValueOnce({ _sum: { totalAmount: 2000, amountPaid: 2000 } })
      .mockResolvedValueOnce({ _sum: { totalAmount: 1500, amountPaid: 1500 } });
    mockPrisma.yarnPurchase.findMany.mockResolvedValueOnce([]);
    mockPrisma.settlementPayment.aggregate.mockResolvedValueOnce({
      _sum: { amount: 2500 },
    });

    const summary = await ReportService.getFinancialSummary();
    expect(summary.expenses.weaverSettlementPayouts).toBe(2500);
    expect(summary.weaverSettlementsExpense).toBe(2500);
    expect(summary.expenses.totalExpenses).toBe(4000);
    expect(summary.profitability.netOperatingProfit).toBe(8000);
  });

  it("includes unsettled work-order netPayable, committed unpaid settlements, and UI fields in getWeaversBalanceReport", async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([
      { userId: 7, firstName: "Abebe", lastName: "Bikila", username: "abebe", phone: "0911" },
    ]);
    mockPrisma.directTransaction.findMany.mockResolvedValueOnce([
      { weaverUserId: 7, totalAmount: 1000, amountPaid: 400 }, // 600 remaining
    ]);
    mockPrisma.workOrder.findMany
      .mockResolvedValueOnce([{ weaverUserId: 7, netPayable: 2500 }]) // returned unsettled
      .mockResolvedValueOnce([{ weaverUserId: 7, netPayable: 300 }]); // active WIP
    mockPrisma.settlement.findMany.mockResolvedValueOnce([
      { weaverUserId: 7, netAmount: 1200, payments: [{ amount: 500 }] }, // 700 remaining
    ]);

    const report = await ReportService.getWeaversBalanceReport();
    expect(report).toHaveLength(1);
    expect(report[0]).toMatchObject({
      weaverUserId: 7,
      directPurchasePayable: 600,
      unsettledReturnedZigsCount: 1,
      unsettledPiecesCount: 1,
      activeWorkOrdersCount: 1,
      estimatedPendingPayout: 2800,
      committedSettlementPayable: 700,
      netPayableBalance: 3800,
    });
  });

  it("returns totalReceivableBalance and unpaidSalesCount in getMerchantsBalanceReport", async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([
      { userId: 9, firstName: "Selam", lastName: "Trade", username: "selam", phone: "0922" },
    ]);
    mockPrisma.directTransaction.findMany.mockResolvedValueOnce([
      { merchantUserId: 9, totalAmount: 5000, amountPaid: 2000 },
      { merchantUserId: 9, totalAmount: 1000, amountPaid: 1000 },
    ]);

    const report = await ReportService.getMerchantsBalanceReport();
    expect(report[0]).toMatchObject({
      merchantUserId: 9,
      outstandingReceivable: 3000,
      totalReceivableBalance: 3000,
      unpaidSalesCount: 1,
    });
  });
});

describe("Audit action filter, integer yarn & no kg, quality deduction resolution", () => {
  it("applies case-insensitive action filter in AuditService.query", async () => {
    mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);
    mockPrisma.auditLog.count.mockResolvedValueOnce(0);

    await AuditService.query({ action: "user.create" });
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          action: { contains: "user.create", mode: "insensitive" },
        }),
      }),
    );
  });

  it("omits totalYarnStockKg and returns integer totalYarnStockPieces in StockService.getSummary", async () => {
    mockPrisma.yarnVariant.findMany.mockResolvedValueOnce([
      { yarnVariantId: 1, stockSnapshot: 15 },
      { yarnVariantId: 2, stockSnapshot: 20 },
    ]);
    mockPrisma.fabricVariant.findMany.mockResolvedValueOnce([
      { fabricVariantId: 1, stockSnapshot: 10 },
    ]);

    const summary = await StockService.getSummary();
    expect(summary.totalYarnStockPieces).toBe(35);
    expect("totalYarnStockKg" in summary).toBe(false);
  });

  it("rejects decimal yarn quantities in DTOs while accepting integer pieces", () => {
    expect(
      AddYarnGivenSchema.safeParse({ yarnVariantId: 1, quantity: 2.5 }).success,
    ).toBe(false);
    expect(
      AddYarnGivenSchema.safeParse({ yarnVariantId: 1, quantity: 3 }).success,
    ).toBe(true);
    expect(
      UpdateYarnGivenSchema.safeParse({ quantity: 1.5 }).success,
    ).toBe(false);
    expect(
      CreateProcurementSchema.safeParse({
        supplierId: 1,
        lines: [{ yarnVariantId: 1, quantity: 4.2, unitPrice: 100 }],
      }).success,
    ).toBe(false);
    expect(
      CreateDirectTransactionSchema.safeParse({
        type: "yarn_sale_to_weaver",
        weaverUserId: 2,
        lines: [{ yarnVariantId: 1, quantity: 2.5, unitPrice: 100 }],
      }).success,
    ).toBe(false);
  });

  it("stacks weight + length + width quality deductions and resolves units deterministically", () => {
    const deductions = calculateQualityDeductions({
      quantity: 10,
      totalWeight: 600, // avg 60g vs 64g -> 4 deficit
      lengthCm: 195, // vs 200cm -> 5 deficit
      widthCm: 98, // vs 100cm -> 2 deficit
      standardWeightG: 64,
      standardLengthCm: 200,
      standardWidthCm: 100,
      qualityRules: [
        { factor: "weight", unit: "piece", deductionPerUnit: 99 },
        { factor: "weight", unit: "g", deductionPerUnit: 10 },
        { factor: "length", unit: "cm", deductionPerUnit: 5 },
        { factor: "width", unit: "cm", deductionPerUnit: 5 },
      ],
    });

    expect(deductions).toHaveLength(3);
    expect(deductions.find((d) => d.factor === "weight")?.perPiece).toBe(40);
    expect(deductions.find((d) => d.factor === "length")?.perPiece).toBe(25);
    expect(deductions.find((d) => d.factor === "width")?.perPiece).toBe(10);
  });
});
