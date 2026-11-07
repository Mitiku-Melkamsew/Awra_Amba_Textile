export interface Product {
  productId: number;
  name: string;
  category: string;
  basePrice: string | number;
  standardLengthCm?: string | number | null;
  standardWidthCm?: string | number | null;
}

export interface Color {
  colorId: number;
  name: string;
  colorCode: string | null;
}

export interface Design {
  designId: number;
  name: string;
  description: string | null;
}

export interface Supplier {
  supplierId: number;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  contactPhone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface FabricPrice {
  fabricPriceId: number;
  fabricId: number;
  weaverUnitPrice: number | string;
  sellingUnitPrice: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  fabric?: {
    fabricId: number;
    name: string;
    standardLengthCm?: number | null;
    standardWidthCm?: number | null;
    standardWeightG?: number | null;
  };
}

export type FabricPriceRow = FabricPrice & {
  weaverRate?: number | string;
  sellingPrice?: number | string;
};

export interface YarnPrice {
  yarnPriceId: number;
  yarnId: number;
  supplierId: number;
  costPerKg: number | string;
  sellingPricePerKg: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  yarn?: {
    yarnId: number;
    materialName?: string;
    name?: string;
  };
  supplier?: {
    supplierId: number;
    name: string;
  };
}

export type YarnPriceRow = YarnPrice & {
  purchasePrice?: number | string;
  sellingPrice?: number | string;
};

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
  materialName: string;
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
  warpColorId: number | null;
  weftColorId: number | null;
  designId: number | null;
  stockSnapshot: number | string;
  isActive: boolean;
  fabric?: Fabric;
  product?: Product;
  basePrice?: string | number | null;
  warpColor?: Color | null;
  weftColor?: Color | null;
  design?: Design | null;
}

export interface YarnVariant {
  yarnVariantId: number;
  sku: string;
  yarnId: number;
  colorId: number | null;
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
  notes?: string | null;
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
