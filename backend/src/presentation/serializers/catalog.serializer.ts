/**
 * Catalog serializers.
 *
 * Every response field is listed explicitly, so a new database column cannot
 * appear in the API by accident. Keys are only copied when present on the
 * source object, which keeps the shape of list vs. detail responses intact.
 */

import { project, type AnyRecord } from "./project.js";

const COLOR_KEYS = ["colorId", "name"] as const;
const DESIGN_KEYS = ["designId", "name"] as const;

const SUPPLIER_KEYS = ["supplierId", "name", "contactPhone", "isActive"] as const;

const FABRIC_KEYS = [
  "fabricId",
  "name",
  "standardLengthCm",
  "standardWidthCm",
  "standardWeightG",
  "isActive",
  "createdAt",
  "updatedAt",
] as const;

const YARN_KEYS = ["yarnId", "name", "isActive"] as const;

const FABRIC_VARIANT_KEYS = [
  "fabricVariantId",
  "fabricId",
  "designId",
  "warpColorId",
  "weftColorId",
  "sku",
  "stockSnapshot",
  "isActive",
] as const;

const YARN_VARIANT_KEYS = [
  "yarnVariantId",
  "yarnId",
  "colorId",
  "supplierId",
  "sku",
  "stockSnapshot",
  "isActive",
] as const;

const FABRIC_PRICE_KEYS = [
  "fabricPriceId",
  "fabricId",
  "weaverRate",
  "sellingPrice",
  "effectiveFrom",
  "effectiveTo",
  "isActive",
  "createdAt",
] as const;

const YARN_PRICE_KEYS = [
  "yarnPriceId",
  "yarnId",
  "supplierId",
  "purchasePrice",
  "sellingPrice",
  "effectiveFrom",
  "effectiveTo",
  "isActive",
  "createdAt",
] as const;

const QUALITY_RULE_KEYS = [
  "qualityRuleId",
  "factor",
  "unit",
  "deductionPerUnit",
  "isActive",
] as const;

export function serializeColor(color: AnyRecord): AnyRecord {
  return project(color, COLOR_KEYS);
}

export function serializeDesign(design: AnyRecord): AnyRecord {
  return project(design, DESIGN_KEYS);
}

export function serializeSupplier(supplier: AnyRecord): AnyRecord {
  return project(supplier, SUPPLIER_KEYS);
}

export function serializeQualityRule(rule: AnyRecord): AnyRecord {
  return project(rule, QUALITY_RULE_KEYS);
}

export function serializeFabric(fabric: AnyRecord): AnyRecord {
  const out = project(fabric, FABRIC_KEYS);

  if (Array.isArray(fabric.prices)) {
    out.prices = fabric.prices.map(serializeFabricPrice);
  }
  if (fabric.currentPrice) out.currentPrice = serializeFabricPrice(fabric.currentPrice);
  if (Array.isArray(fabric.variants)) {
    out.variants = fabric.variants.map(serializeFabricVariant);
  }
  if (Array.isArray(fabric.fabricVariants)) {
    out.fabricVariants = fabric.fabricVariants.map(serializeFabricVariant);
  }
  if (fabric._count) out._count = { ...fabric._count };

  return out;
}

export function serializeYarn(yarn: AnyRecord): AnyRecord {
  const out = project(yarn, YARN_KEYS);

  // `prices` is what the frontend reads; `yarnPrices` is the Prisma relation.
  if (Array.isArray(yarn.prices)) out.prices = yarn.prices.map(serializeYarnPrice);
  if (Array.isArray(yarn.yarnPrices)) {
    out.yarnPrices = yarn.yarnPrices.map(serializeYarnPrice);
  }
  if (yarn.currentPrice) out.currentPrice = serializeYarnPrice(yarn.currentPrice);
  if (Array.isArray(yarn.yarnVariants)) {
    out.yarnVariants = yarn.yarnVariants.map(serializeYarnVariant);
  }
  if (yarn._count) out._count = { ...yarn._count };

  return out;
}

export function serializeFabricPrice(price: AnyRecord): AnyRecord {
  const out = project(price, FABRIC_PRICE_KEYS);
  if (price.fabric) out.fabric = serializeFabric(price.fabric);
  return out;
}

export function serializeYarnPrice(price: AnyRecord): AnyRecord {
  const out = project(price, YARN_PRICE_KEYS);
  if (price.yarn) out.yarn = serializeYarn(price.yarn);
  if (price.supplier) out.supplier = serializeSupplier(price.supplier);
  return out;
}

export function serializeFabricVariant(variant: AnyRecord): AnyRecord {
  const out = project(variant, FABRIC_VARIANT_KEYS);

  if (variant.fabric) out.fabric = serializeFabric(variant.fabric);
  if (variant.design) out.design = serializeDesign(variant.design);
  if (variant.warpColor) out.warpColor = serializeColor(variant.warpColor);
  if (variant.weftColor) out.weftColor = serializeColor(variant.weftColor);

  // Derived price fields used by the UI pickers.
  if (variant.basePrice !== undefined) out.basePrice = variant.basePrice;
  if (Array.isArray(variant.prices)) out.prices = variant.prices.map(serializeFabricPrice);
  if (variant.currentPrice) out.currentPrice = serializeFabricPrice(variant.currentPrice);

  return out;
}

export function serializeYarnVariant(variant: AnyRecord): AnyRecord {
  const out = project(variant, YARN_VARIANT_KEYS);

  if (variant.yarn) out.yarn = serializeYarn(variant.yarn);
  if (variant.color) out.color = serializeColor(variant.color);
  if (variant.supplier) out.supplier = serializeSupplier(variant.supplier);

  if (Array.isArray(variant.prices)) out.prices = variant.prices.map(serializeYarnPrice);
  if (variant.currentPrice) out.currentPrice = serializeYarnPrice(variant.currentPrice);

  return out;
}

export function serializeCatalogLookup(bundle: AnyRecord): AnyRecord {
  return {
    fabrics: (bundle.fabrics ?? []).map(serializeFabric),
    yarns: (bundle.yarns ?? []).map(serializeYarn),
    colors: (bundle.colors ?? []).map(serializeColor),
    designs: (bundle.designs ?? []).map(serializeDesign),
    suppliers: (bundle.suppliers ?? []).map(serializeSupplier),
    qualityRules: (bundle.qualityRules ?? []).map(serializeQualityRule),
  };
}
