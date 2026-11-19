import { describe, expect, it, vi } from "vitest";

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

import { buildHisabReportByPaymentId } from "./hisab-report.service.js";

describe("buildHisabReportByPaymentId", () => {
  it("resolves an unpaid committed settlement when payment does not exist yet", async () => {
    mockPrisma.settlementPayment.findUnique.mockResolvedValueOnce(null);

    const mockSettlement = {
      settlementId: 42,
      weaverUserId: 10,
      status: "committed",
      createdAt: new Date("2026-11-16T10:00:00.000Z"),
      paidAt: null,
      netAmount: 1500,
      weaver: { userId: 10, fullName: "Kassahun Tadesse", phone: "0911000000" },
      lines: [
        {
          settlementLineId: 1,
          zigId: "ZIG-1",
          fabricId: 1,
          quantity: 10,
          averageWeight: 450,
          basePrice: 150,
          deduction: 0,
          adjustedPrice: 150,
          subtotal: 1500,
          fabric: { fabricName: "Gabi" },
        },
      ],
      yarnLines: [],
      payments: [],
    };

    mockPrisma.settlement.findUnique.mockResolvedValue(mockSettlement);

    const report = await buildHisabReportByPaymentId(42);

    expect(report.settlementId).toBe(42);
    expect(report.paymentId).toBe(42);
    expect(report.isPaid).toBe(false);
    expect(report.status).toBe("committed");
    expect(report.amount).toBe(1500);
    expect(report.weaver.fullName).toBe("Kassahun Tadesse");
    expect(report.amharicAmountInWords).toContain("አንድ ሺህ");
  });

  it("resolves a paid settlement via settlementPayment record", async () => {
    const paymentDate = new Date("2026-11-16T12:00:00.000Z");
    mockPrisma.settlementPayment.findUnique.mockResolvedValueOnce({
      settlementPaymentId: 99,
      settlementId: 42,
      paymentDate,
      amount: 1500,
      settlement: { status: "paid" },
    });

    const mockSettlement = {
      settlementId: 42,
      weaverUserId: 10,
      status: "paid",
      createdAt: new Date("2026-11-16T10:00:00.000Z"),
      paidAt: paymentDate,
      netAmount: 1500,
      weaver: { userId: 10, fullName: "Kassahun Tadesse" },
      lines: [
        {
          settlementLineId: 1,
          zigId: "ZIG-1",
          fabricId: 1,
          quantity: 10,
          averageWeight: 450,
          basePrice: 150,
          deduction: 0,
          adjustedPrice: 150,
          subtotal: 1500,
          fabric: { fabricName: "Gabi" },
        },
      ],
      yarnLines: [],
      payments: [{ settlementPaymentId: 99, amount: 1500, paymentDate }],
    };

    mockPrisma.settlement.findUnique.mockResolvedValue(mockSettlement);

    const report = await buildHisabReportByPaymentId(99);

    expect(report.settlementId).toBe(42);
    expect(report.paymentId).toBe(99);
    expect(report.isPaid).toBe(true);
    expect(report.amount).toBe(1500);
    expect(report.paymentDate).toEqual(paymentDate);
  });

  it("throws CONFLICT error when neither payment nor settlement exists", async () => {
    mockPrisma.settlementPayment.findUnique.mockResolvedValueOnce(null);
    mockPrisma.settlement.findUnique.mockResolvedValueOnce(null);

    await expect(buildHisabReportByPaymentId(9999)).rejects.toThrow(
      "CONFLICT:Payment or settlement not found.",
    );
  });
});
