import { describe, it, expect, vi } from "vitest";
import { CatalogService } from "./catalog.service.js";
import { prisma } from "../../lib/prisma.js";
import { ConflictError } from "../../domain/errors/domain-errors.js";

vi.mock("../../lib/prisma.js", () => {
  return {
    prisma: {
      color: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      design: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      fabric: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      yarn: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      supplier: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      qualityRule: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
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

describe("CatalogService - Case-Insensitive Uniqueness & Cleaning", () => {
  describe("createColor", () => {
    it("throws ConflictError if color already exists with different casing", async () => {
      vi.mocked(prisma.color.findFirst).mockResolvedValueOnce({
        colorId: 1,
        name: "green",
      } as any);

      await expect(
        CatalogService.createColor({ name: "  Green  " }, 1),
      ).rejects.toThrow(ConflictError);

      expect(prisma.color.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: "green", mode: "insensitive" } },
      });
    });

    it("cleans and saves lowercase name on creation", async () => {
      vi.mocked(prisma.color.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.color.create).mockResolvedValueOnce({
        colorId: 2,
        name: "blue",
      } as any);

      const result = await CatalogService.createColor({ name: "  BLUE  " }, 1);
      expect(prisma.color.create).toHaveBeenCalledWith({
        data: { name: "blue" },
      });
      expect(result.colorId).toBe(2);
    });
  });

  describe("createDesign", () => {
    it("throws ConflictError if design exists with different casing", async () => {
      vi.mocked(prisma.design.findFirst).mockResolvedValueOnce({
        designId: 1,
        name: "tibeb",
      } as any);

      await expect(
        CatalogService.createDesign({ name: "Tibeb" }, 1),
      ).rejects.toThrow(ConflictError);
    });

    it("cleans and stores lowercase design name", async () => {
      vi.mocked(prisma.design.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.design.create).mockResolvedValueOnce({
        designId: 2,
        name: "plain stripe",
      } as any);

      await CatalogService.createDesign({ name: " Plain Stripe " }, 1);
      expect(prisma.design.create).toHaveBeenCalledWith({
        data: { name: "plain stripe" },
      });
    });
  });

  describe("createFabric", () => {
    it("throws ConflictError if fabric exists case-insensitively", async () => {
      vi.mocked(prisma.fabric.findFirst).mockResolvedValueOnce({
        fabricId: 1,
        name: "gabi",
      } as any);

      await expect(
        CatalogService.createFabric(
          { name: "  GABI  ", standardLengthCm: 250, standardWidthCm: 150, standardWeightG: 500 },
          1,
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("createYarn", () => {
    it("throws ConflictError if yarn exists case-insensitively", async () => {
      vi.mocked(prisma.yarn.findFirst).mockResolvedValueOnce({
        yarnId: 1,
        name: "cotton 40/1",
      } as any);

      await expect(
        CatalogService.createYarn({ name: "COTTON 40/1" }, 1),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("createSupplier", () => {
    it("throws ConflictError if supplier exists case-insensitively", async () => {
      vi.mocked(prisma.supplier.findFirst).mockResolvedValueOnce({
        supplierId: 1,
        name: "bahir dar textile",
      } as any);

      await expect(
        CatalogService.createSupplier({ name: "Bahir Dar Textile" }, 1),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("createQualityRule", () => {
    it("throws ConflictError if rule exists case-insensitively for factor & unit", async () => {
      vi.mocked(prisma.qualityRule.findFirst).mockResolvedValueOnce({
        qualityRuleId: 1,
        factor: "weight",
        unit: "gram",
        deductionPerUnit: 5,
      } as any);

      await expect(
        CatalogService.createQualityRule(
          { factor: "Weight", unit: "GRAM", deductionPerUnit: 5 },
          1,
        ),
      ).rejects.toThrow(ConflictError);
    });
  });
});
