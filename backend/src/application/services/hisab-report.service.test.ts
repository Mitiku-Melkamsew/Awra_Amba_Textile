import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      settlementPayment: {
        findUnique: vi.fn(),
      },
      settlement: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("../../lib/prisma.js", () => ({ prisma: mockPrisma }));

import {
  buildHisabReport,
  buildHisabReportByPaymentId,
} from "./hisab-report.service.js";

function settlementFixture(overrides: Record<string, unknown> = {}) {
  return {
    settlementId: 42,
    weaverUserId: 10,
    status: "committed",
    createdAt: new Date("2026-11-16T10:00:00.000Z"),
    paidAt: null,
    netAmount: 1500,
    weaver: { userId: 10, firstName: "Kassahun", lastName: "Tadesse", phone: "0911000000" },
    workOrders: [
      {
        zigId: "ZIG-1",
        fabricReturns: [
          {
            returnId: 1,
            quantityReturned: 10,
            totalWeight: 4500,
            unitPrice: 150,
            grossFabricValue: 1500,
            deductionAmount: 0,
            fabricVariant: { fabric: { name: "Gabi" } },
          },
        ],
        yarnGiven: [],
      },
    ],
    payments: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildHisabReport (settlement ID space)", () => {
  it("builds an unpaid statement strictly from the settlement ID", async () => {
    mockPrisma.settlement.findUnique.mockResolvedValueOnce(settlementFixture());

    const report = await buildHisabReport(42);

    expect(mockPrisma.settlement.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { settlementId: 42 } }),
    );
    expect(report.settlementId).toBe(42);
    expect(report.paymentId).toBeNull();
    expect(report.isPaid).toBe(false);
    expect(report.status).toBe("committed");
    expect(report.amount).toBe(1500);
    expect(report.weaver.fullName).toBe("Kassahun Tadesse");
    expect(report.amharicAmountInWords).toContain("አንድ ሺህ");

    const lineRow = report.rows.find((row) => row.zigId === "ZIG-1");
    expect(lineRow).toBeTruthy();
    expect(lineRow?.fabricType).toBe("Gabi");
    expect(lineRow?.fabricQty).toBe(10);
    expect(lineRow?.basePrice).toBe(150);
  });

  it("throws when the settlement does not exist", async () => {
    mockPrisma.settlement.findUnique.mockResolvedValueOnce(null);

    await expect(buildHisabReport(9999)).rejects.toThrow(
      "CONFLICT:Settlement not found.",
    );
  });
});

describe("buildHisabReportByPaymentId (payment ID space)", () => {
  it("resolves a paid settlement through its payment record", async () => {
    const paymentDate = new Date("2026-11-16T12:00:00.000Z");
    mockPrisma.settlementPayment.findUnique.mockResolvedValueOnce({
      settlementPaymentId: 99,
      settlementId: 42,
      paymentDate,
      amount: 1500,
      settlement: { status: "paid" },
    });

    mockPrisma.settlement.findUnique.mockResolvedValueOnce(
      settlementFixture({
        status: "paid",
        paidAt: paymentDate,
        payments: [{ settlementPaymentId: 99, amount: 1500, paymentDate }],
      }),
    );

    const report = await buildHisabReportByPaymentId(99);

    expect(mockPrisma.settlementPayment.findUnique).toHaveBeenCalledWith({
      where: { settlementPaymentId: 99 },
      include: { settlement: { select: { status: true } } },
    });
    expect(report.settlementId).toBe(42);
    expect(report.paymentId).toBe(99);
    expect(report.isPaid).toBe(true);
    expect(report.amount).toBe(1500);
    expect(report.paymentDate).toEqual(paymentDate);
  });

  it("does not fall back to the settlement ID space", async () => {
    mockPrisma.settlementPayment.findUnique.mockResolvedValueOnce(null);

    await expect(buildHisabReportByPaymentId(42)).rejects.toThrow(
      "CONFLICT:Payment not found.",
    );
    expect(mockPrisma.settlement.findUnique).not.toHaveBeenCalled();
  });
});
