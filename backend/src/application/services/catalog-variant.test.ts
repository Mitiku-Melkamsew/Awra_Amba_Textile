import { describe, it, expect, vi } from "vitest";
import { CatalogService } from "./catalog.service.js";
import { prisma } from "../../lib/prisma.js";
import { ConflictError } from "../../domain/errors/domain-errors.js";

vi.mock("../../lib/prisma.js", () => {
  return {
    prisma: {
      fabricVariant: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      yarnVariant: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
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

describe("CatalogService - Variant Deduplication & Validation", () => {
  describe("createFabricVariant", () => {
    it("throws ConflictError if active fabric variant combination already exists", async () => {
      vi.mocked(prisma.fabricVariant.findFirst).mockResolvedValueOnce({
        fabricVariantId: 10,
        sku: "FV-1-1-2-3",
        isActive: true,
      } as any);

      await expect(
        CatalogService.createFabricVariant(
          { fabricId: 1, designId: 1, warpColorId: 2, weftColorId: 3 },
          1,
        ),
      ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError if inactive fabric variant combination exists", async () => {
      vi.mocked(prisma.fabricVariant.findFirst).mockResolvedValueOnce({
        fabricVariantId: 10,
        sku: "FV-1-1-2-3",
        isActive: false,
      } as any);

      await expect(
        CatalogService.createFabricVariant(
          { fabricId: 1, designId: 1, warpColorId: 2, weftColorId: 3 },
          1,
        ),
      ).rejects.toThrow("currently deactivated");
    });

    it("throws ConflictError if custom SKU already exists", async () => {
      vi.mocked(prisma.fabricVariant.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.fabricVariant.findUnique).mockResolvedValueOnce({
        fabricVariantId: 12,
        sku: "CUSTOM-SKU",
      } as any);

      await expect(
        CatalogService.createFabricVariant(
          { fabricId: 1, designId: 1, warpColorId: 2, weftColorId: 3, sku: "CUSTOM-SKU" },
          1,
        ),
      ).rejects.toThrow("already exists");
    });
  });

  describe("createYarnVariant", () => {
    it("throws ConflictError if active yarn variant combination already exists", async () => {
      vi.mocked(prisma.yarnVariant.findFirst).mockResolvedValueOnce({
        yarnVariantId: 20,
        sku: "YV-1-2-3",
        isActive: true,
      } as any);

      await expect(
        CatalogService.createYarnVariant(
          { yarnId: 1, supplierId: 2, colorId: 3 },
          1,
        ),
      ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError if inactive yarn variant combination exists", async () => {
      vi.mocked(prisma.yarnVariant.findFirst).mockResolvedValueOnce({
        yarnVariantId: 20,
        sku: "YV-1-2-3",
        isActive: false,
      } as any);

      await expect(
        CatalogService.createYarnVariant(
          { yarnId: 1, supplierId: 2, colorId: 3 },
          1,
        ),
      ).rejects.toThrow("currently deactivated");
    });

    it("throws ConflictError if yarn SKU already exists", async () => {
      vi.mocked(prisma.yarnVariant.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.yarnVariant.findUnique).mockResolvedValueOnce({
        yarnVariantId: 22,
        sku: "CUSTOM-YARN-SKU",
      } as any);

      await expect(
        CatalogService.createYarnVariant(
          { yarnId: 1, supplierId: 2, colorId: 3, sku: "CUSTOM-YARN-SKU" },
          1,
        ),
      ).rejects.toThrow("already exists");
    });
  });
});
