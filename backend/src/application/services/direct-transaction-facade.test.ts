import { describe, it, expect, vi } from "vitest";
import {
  DirectTransactionService,
  normalizeYarnPurchase,
} from "./direct-transaction.service.js";
import { prisma } from "../../lib/prisma.js";

vi.mock("../../lib/prisma.js", () => {
  return {
    prisma: {
      directTransaction: {
        findUnique: vi.fn(),
      },
      yarnPurchase: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      yarnVariant: {
        update: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    },
  };
});

vi.mock("./audit.service.js", () => ({
  AuditService: {
    record: vi.fn().mockResolvedValue({}),
  },
}));

describe("DirectTransactionService & Procurement Facade", () => {
  describe("normalizeYarnPurchase", () => {
    it("generates prefixed transactionId 'yp-<purchaseId>' to prevent collisions with direct transactions", () => {
      const mockPurchase = {
        purchaseId: 1,
        supplierId: 4,
        purchaseDate: new Date("2026-11-20T10:00:00Z"),
        notes: "First batch",
        createdByUserId: 1,
        supplier: { supplierId: 4, name: "Arba Minch Cotton" },
        createdBy: { userId: 1, username: "admin", fullName: "Admin User" },
        lines: [
          {
            lineId: 101,
            yarnVariantId: 5,
            quantity: 20,
            unitPrice: 150,
            yarnVariant: {
              yarn: { name: "Nech Kır" },
              color: { name: "White" },
            },
          },
        ],
      };

      const normalized = normalizeYarnPurchase(mockPurchase);
      expect(normalized.transactionId).toBe("yp-1");
      expect(normalized.type).toBe("yarn_purchase");
      expect(normalized.status).toBe("paid");
      expect(normalized.totalAmount).toBe(3000);
      expect(normalized.amountPaid).toBe(3000);
      expect(normalized.supplier?.name).toBe("Arba Minch Cotton");
      expect(normalized.lines[0].transactionId).toBe("yp-1");
      expect(normalized.payments[0].paymentMethod).toBe("Supplier Invoice");
    });

    it("reflects cancelled status when notes contain [CANCELLED]", () => {
      const mockPurchase = {
        purchaseId: 2,
        supplierId: 4,
        purchaseDate: new Date("2026-11-20T10:00:00Z"),
        notes: "Some notes [CANCELLED]",
        createdByUserId: 1,
        lines: [],
      };

      const normalized = normalizeYarnPurchase(mockPurchase);
      expect(normalized.transactionId).toBe("yp-2");
      expect(normalized.status).toBe("cancelled");
      expect(normalized.amountPaid).toBe(0);
      expect(normalized.payments).toHaveLength(0);
    });
  });

  describe("getTransaction resolution without ID collision", () => {
    it("resolves 'yp-1' directly to yarn purchase, even if direct transaction with ID 1 exists", async () => {
      vi.mocked(prisma.directTransaction.findUnique).mockResolvedValueOnce({
        transactionId: 1,
        type: "fabric_sale_to_merchant",
      } as any);

      vi.mocked(prisma.yarnPurchase.findUnique).mockResolvedValueOnce({
        purchaseId: 1,
        supplierId: 4,
        purchaseDate: new Date("2026-11-20T10:00:00Z"),
        lines: [],
      } as any);

      const res = await DirectTransactionService.getTransaction("yp-1");
      expect(res.transactionId).toBe("yp-1");
      expect(res.type).toBe("yarn_purchase");
      expect(prisma.directTransaction.findUnique).not.toHaveBeenCalled();
      expect(prisma.yarnPurchase.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { purchaseId: 1 },
        }),
      );
    });

    it("resolves numeric ID 1 to direct transaction when requested", async () => {
      vi.mocked(prisma.directTransaction.findUnique).mockResolvedValueOnce({
        transactionId: 1,
        type: "fabric_sale_to_merchant",
      } as any);

      const res = await DirectTransactionService.getTransaction(1);
      expect(res.transactionId).toBe(1);
      expect(res.type).toBe("fabric_sale_to_merchant");
    });
  });
});
