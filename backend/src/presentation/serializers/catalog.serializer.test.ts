import { describe, it, expect } from "vitest";
import {
  serializeCatalogLookup,
  serializeFabric,
  serializeFabricVariant,
  serializeQualityRule,
  serializeYarn,
  serializeYarnVariant,
} from "./catalog.serializer.js";

describe("catalog serializers", () => {
  it("projects fabric fields and strips unknown DB columns", () => {
    const result = serializeFabric({
      fabricId: 1,
      name: "gabi",
      standardLengthCm: 250,
      standardWidthCm: 140,
      standardWeightG: 64,
      isActive: true,
      secretInternalCol: "should-not-leak",
      prices: [
        {
          fabricPriceId: 10,
          fabricId: 1,
          weaverRate: 400,
          sellingPrice: 900,
          isActive: true,
          extraField: "hidden",
        },
      ],
    });

    expect(result).toEqual({
      fabricId: 1,
      name: "gabi",
      standardLengthCm: 250,
      standardWidthCm: 140,
      standardWeightG: 64,
      isActive: true,
      prices: [
        {
          fabricPriceId: 10,
          fabricId: 1,
          weaverRate: 400,
          sellingPrice: 900,
          isActive: true,
        },
      ],
    });
    expect("secretInternalCol" in result).toBe(false);
    expect("extraField" in result.prices[0]).toBe(false);
  });

  it("preserves yarnPrices and prices on serializeYarn while dropping unknown keys", () => {
    const result = serializeYarn({
      yarnId: 2,
      name: "cotton",
      isActive: true,
      internalCode: "drop",
      yarnPrices: [
        { yarnPriceId: 3, yarnId: 2, supplierId: 1, purchasePrice: 100, sellingPrice: 120, isActive: true },
      ],
    });

    expect(result.yarnId).toBe(2);
    expect(result.yarnPrices).toHaveLength(1);
    expect("internalCode" in result).toBe(false);
  });

  it("serializes fabric and yarn variants and catalog lookup cleanly", () => {
    const fv = serializeFabricVariant({
      fabricVariantId: 5,
      fabricId: 1,
      designId: 2,
      warpColorId: 3,
      weftColorId: 4,
      sku: "FAB-1",
      stockSnapshot: 12,
      isActive: true,
      fabric: { fabricId: 1, name: "gabi", standardLengthCm: 200, standardWidthCm: 100, standardWeightG: 60, isActive: true },
      warpColor: { colorId: 3, name: "white", secret: 1 },
    });

    expect(fv.sku).toBe("FAB-1");
    expect("secret" in fv.warpColor).toBe(false);

    const yv = serializeYarnVariant({
      yarnVariantId: 7,
      yarnId: 2,
      colorId: 3,
      supplierId: 4,
      sku: "YRN-1",
      stockSnapshot: 40,
      isActive: true,
    });
    expect(yv.sku).toBe("YRN-1");

    const lookup = serializeCatalogLookup({
      fabrics: [{ fabricId: 1, name: "gabi", standardLengthCm: 200, standardWidthCm: 100, standardWeightG: 60, isActive: true }],
      yarns: [],
      colors: [{ colorId: 1, name: "white", extra: "x" }],
      designs: [{ designId: 1, name: "plain" }],
      suppliers: [{ supplierId: 1, name: "coop", contactPhone: null, isActive: true }],
      qualityRules: [serializeQualityRule({ qualityRuleId: 1, factor: "weight", unit: "g", deductionPerUnit: 10, isActive: true })],
    });

    expect(lookup.colors[0]).toEqual({ colorId: 1, name: "white" });
    expect(lookup.qualityRules[0].factor).toBe("weight");
  });
});
