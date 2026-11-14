/**
 * Catalog models strictly aligned with Prisma schema:
 * Fabric, Yarn, Color, Design, Supplier, FabricPrice, YarnPrice,
 * FabricVariant, YarnVariant, QualityRule.
 */

export interface Color {
  colorId: number;
  name: string;
}

export interface Design {
  designId: number;
  name: string;
}

export interface Supplier {
  supplierId: number;
  name: string;
  contactPhone: string | null;
  isActive: boolean;
}

export interface FabricPrice {
  fabricPriceId: number;
  fabricId: number;
  weaverRate: number | string;
  sellingPrice: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  fabric?: Fabric;
}

export type FabricPriceRow = FabricPrice;

export interface YarnPrice {
  yarnPriceId: number;
  yarnId: number;
  supplierId: number;
  purchasePrice: number | string;
  sellingPrice: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  yarn?: Yarn;
  supplier?: Supplier;
}

export type YarnPriceRow = YarnPrice;

export interface Fabric {
  fabricId: number;
  name: string;
  standardLengthCm: number | null;
  standardWidthCm: number | null;
  standardWeightG: number | null;
  isActive: boolean;
  prices?: FabricPrice[];
  currentPrice?: FabricPrice | null;
  fabricVariants?: FabricVariant[];
  _count?: {
    workOrders?: number;
    fabricVariants?: number;
  };
}

export interface Yarn {
  yarnId: number;
  name: string;
  isActive: boolean;
  prices?: YarnPrice[];
  currentPrice?: YarnPrice | null;
  yarnVariants?: YarnVariant[];
  _count?: {
    yarnVariants?: number;
    yarnGiven?: number;
  };
}

export interface FabricVariant {
  fabricVariantId: number;
  sku: string;
  fabricId: number;
  warpColorId: number;
  weftColorId: number;
  designId: number;
  stockSnapshot: number | string;
  isActive: boolean;
  fabric?: Fabric;
  basePrice?: string | number | null;
  warpColor?: Color | null;
  weftColor?: Color | null;
  design?: Design | null;
}

export interface YarnVariant {
  yarnVariantId: number;
  sku: string;
  yarnId: number;
  colorId: number;
  supplierId: number;
  stockSnapshot: number | string;
  isActive: boolean;
  yarn?: Yarn;
  color?: Color | null;
  supplier?: Supplier;
}

export interface QualityRule {
  qualityRuleId: number;
  factor: string;
  unit: string;
  deductionPerUnit: number | string;
  isActive: boolean;
}

export type QualityRuleRow = QualityRule;

export interface AvailableFabric {
  fabricVariantId: number;
  sku: string;
  fabricId: number;
  fabricName: string;
  standardLengthCm: number;
  standardWidthCm: number;
  standardWeightG: number;
  design: string;
  warpColor: string;
  weftColor: string;
  sellingPrice: number;
}

export interface CatalogLookupBundle {
  fabrics: Fabric[];
  yarns: Yarn[];
  colors: Color[];
  designs: Design[];
  suppliers: Supplier[];
  fabricVariants: FabricVariant[];
  yarnVariants: YarnVariant[];
  qualityRules: QualityRule[];
}
