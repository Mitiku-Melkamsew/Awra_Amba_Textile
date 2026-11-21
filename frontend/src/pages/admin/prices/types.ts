export interface EarlierPrice {
  weaverRate?: number;
  sellingPrice?: number;
  purchasePrice?: number;
  period: string;
}

export interface FabricPriceItem {
  id: number;
  fabricId?: number;
  name: string;
  weaverRate: number;
  sellingPrice: number;
  inEffectSince: string;
  isCurrent: boolean;
  earlierPrice?: EarlierPrice;
}

export interface YarnPriceItem {
  id: number;
  yarnId?: number;
  supplierId?: number;
  yarnName: string;
  supplierName: string;
  purchasePrice: number;
  sellingPrice: number;
  inEffectSince: string;
  isCurrent: boolean;
  earlierPrice?: EarlierPrice;
}
