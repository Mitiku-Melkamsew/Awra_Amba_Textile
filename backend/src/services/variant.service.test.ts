import { describe, it, expect, vi } from "vitest";
import { resolveFabricVariant, resolveYarnVariant } from "./variant.service.js";

describe("Variant Resolution (Auto-resolve & deduplication)", () => {
  describe("resolveFabricVariant", () => {
    it("returns existing active variant when combination already exists", async () => {
      const mockTx = {
        design: {
          findFirst: vi.fn().mockResolvedValue({ designId: 1 }),
        },
        fabricVariant: {
          findFirst: vi.fn().mockResolvedValue({
            fabricVariantId: 42,
            sku: "FV-1-1-2-3",
            isActive: true,
          }),
          update: vi.fn(),
          create: vi.fn(),
        },
      } as any;

      const result = await resolveFabricVariant(
        { fabricId: 1, warpColorId: 2, weftColorId: 3, designId: 1 },
        mockTx,
      );

      expect(result).toEqual({
        variantId: 42,
        created: false,
        sku: "FV-1-1-2-3",
      });
      expect(mockTx.fabricVariant.findFirst).toHaveBeenCalledWith({
        where: {
          fabricId: 1,
          warpColorId: 2,
          weftColorId: 3,
          designId: 1,
        },
      });
      expect(mockTx.fabricVariant.create).not.toHaveBeenCalled();
      expect(mockTx.fabricVariant.update).not.toHaveBeenCalled();
    });

    it("reactivates and returns existing variant when combination exists but was inactive", async () => {
      const mockTx = {
        design: {
          findFirst: vi.fn().mockResolvedValue({ designId: 1 }),
        },
        fabricVariant: {
          findFirst: vi.fn().mockResolvedValue({
            fabricVariantId: 42,
            sku: "FV-1-1-2-3",
            isActive: false,
          }),
          update: vi.fn().mockResolvedValue({}),
          create: vi.fn(),
        },
      } as any;

      const result = await resolveFabricVariant(
        { fabricId: 1, warpColorId: 2, weftColorId: 3, designId: 1 },
        mockTx,
      );

      expect(result).toEqual({
        variantId: 42,
        created: false,
        sku: "FV-1-1-2-3",
      });
      expect(mockTx.fabricVariant.update).toHaveBeenCalledWith({
        where: { fabricVariantId: 42 },
        data: { isActive: true },
      });
      expect(mockTx.fabricVariant.create).not.toHaveBeenCalled();
    });

    it("creates a new variant with deterministic SKU when combination does not exist", async () => {
      const mockTx = {
        design: {
          findFirst: vi.fn().mockResolvedValue({ designId: 1 }),
          findUniqueOrThrow: vi.fn().mockResolvedValue({ designId: 1 }),
        },
        fabric: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ fabricId: 10 }),
        },
        color: {
          findUniqueOrThrow: vi
            .fn()
            .mockImplementation(({ where }: { where: { colorId: number } }) =>
              Promise.resolve({ colorId: where.colorId }),
            ),
        },
        fabricVariant: {
          findFirst: vi.fn().mockResolvedValue(null),
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            fabricVariantId: 99,
            sku: "FV-10-1-2-3",
          }),
        },
      } as any;

      const result = await resolveFabricVariant(
        { fabricId: 10, warpColorId: 2, weftColorId: 3, designId: 1 },
        mockTx,
      );

      expect(result).toEqual({
        variantId: 99,
        created: true,
        sku: "FV-10-1-2-3",
      });
      expect(mockTx.fabricVariant.create).toHaveBeenCalledWith({
        data: {
          fabricId: 10,
          designId: 1,
          warpColorId: 2,
          weftColorId: 3,
          sku: "FV-10-1-2-3",
          stockSnapshot: 0,
          isActive: true,
        },
      });
    });
  });

  describe("resolveYarnVariant", () => {
    it("returns existing variant when yarn combination exists", async () => {
      const mockTx = {
        yarnVariant: {
          findFirst: vi.fn().mockResolvedValue({
            yarnVariantId: 55,
            sku: "YV-2-4-3",
            isActive: true,
          }),
          update: vi.fn(),
          create: vi.fn(),
        },
      } as any;

      const result = await resolveYarnVariant(
        { yarnId: 2, colorId: 3, supplierId: 4 },
        mockTx,
      );

      expect(result).toEqual({
        variantId: 55,
        created: false,
        sku: "YV-2-4-3",
      });
      expect(mockTx.yarnVariant.create).not.toHaveBeenCalled();
    });

    it("reactivates and returns existing yarn variant when combination exists but was inactive", async () => {
      const mockTx = {
        yarnVariant: {
          findFirst: vi.fn().mockResolvedValue({
            yarnVariantId: 55,
            sku: "YV-2-4-3",
            isActive: false,
          }),
          update: vi.fn().mockResolvedValue({}),
          create: vi.fn(),
        },
      } as any;

      const result = await resolveYarnVariant(
        { yarnId: 2, colorId: 3, supplierId: 4 },
        mockTx,
      );

      expect(result).toEqual({
        variantId: 55,
        created: false,
        sku: "YV-2-4-3",
      });
      expect(mockTx.yarnVariant.update).toHaveBeenCalledWith({
        where: { yarnVariantId: 55 },
        data: { isActive: true },
      });
    });

    it("creates a new yarn variant with deterministic SKU when combination does not exist", async () => {
      const mockTx = {
        yarn: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ yarnId: 2 }),
        },
        color: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ colorId: 3 }),
        },
        supplier: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ supplierId: 4 }),
        },
        yarnVariant: {
          findFirst: vi.fn().mockResolvedValue(null),
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            yarnVariantId: 77,
            sku: "YV-2-4-3",
          }),
        },
      } as any;

      const result = await resolveYarnVariant(
        { yarnId: 2, colorId: 3, supplierId: 4 },
        mockTx,
      );

      expect(result).toEqual({
        variantId: 77,
        created: true,
        sku: "YV-2-4-3",
      });
      expect(mockTx.yarnVariant.create).toHaveBeenCalledWith({
        data: {
          yarnId: 2,
          colorId: 3,
          supplierId: 4,
          sku: "YV-2-4-3",
          stockSnapshot: 0,
          isActive: true,
        },
      });
    });
  });
});
