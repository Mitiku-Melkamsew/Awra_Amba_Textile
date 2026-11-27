import { request } from "../http/api-client";
import type {
  CatalogLookupBundle,
  Fabric,
  Yarn,
  Color,
  Design,
  Supplier,
  FabricVariant,
  YarnVariant,
  FabricPrice,
  YarnPrice,
  QualityRule,
  AvailableFabric,
} from "../../domain/models";

export const catalogService = {
  async getPublicCatalog(): Promise<AvailableFabric[]> {
    return request<AvailableFabric[]>("/catalog/public");
  },

  async getLookup(): Promise<CatalogLookupBundle> {
    return request<CatalogLookupBundle>("/catalog/lookup");
  },

  // Fabrics
  async listFabrics(): Promise<Fabric[]> {
    return request<Fabric[]>("/catalog/fabrics");
  },
  async createFabric(data: {
    name: string;
    standardLengthCm: number;
    standardWidthCm: number;
    standardWeightG: number;
  }): Promise<Fabric> {
    return request<Fabric>("/catalog/fabrics", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateFabric(
    id: number,
    data: {
      name?: string;
      standardLengthCm?: number;
      standardWidthCm?: number;
      standardWeightG?: number;
      isActive?: boolean;
    }
  ): Promise<Fabric> {
    return request<Fabric>(`/catalog/fabrics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async toggleFabricStatus(id: number, isActive: boolean): Promise<Fabric> {
    return request<Fabric>(`/catalog/fabrics/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },

  // Yarns
  async listYarns(): Promise<Yarn[]> {
    return request<Yarn[]>("/catalog/yarns");
  },
  async createYarn(data: { name: string }): Promise<Yarn> {
    return request<Yarn>("/catalog/yarns", {
      method: "POST",
      body: JSON.stringify({ name: data.name }),
    });
  },
  async updateYarn(id: number, data: { name?: string; isActive?: boolean }): Promise<Yarn> {
    return request<Yarn>(`/catalog/yarns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async toggleYarnStatus(id: number, isActive: boolean): Promise<Yarn> {
    return request<Yarn>(`/catalog/yarns/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },

  // Colors
  async listColors(): Promise<Color[]> {
    return request<Color[]>("/catalog/colors");
  },
  async createColor(data: { name: string }): Promise<Color> {
    return request<Color>("/catalog/colors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateColor(id: number, data: { name: string }): Promise<Color> {
    return request<Color>(`/catalog/colors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async deleteColor(id: number): Promise<void> {
    return request<void>(`/catalog/colors/${id}`, { method: "DELETE" });
  },

  // Designs
  async listDesigns(): Promise<Design[]> {
    return request<Design[]>("/catalog/designs");
  },
  async createDesign(data: { name: string }): Promise<Design> {
    return request<Design>("/catalog/designs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateDesign(id: number, data: { name: string }): Promise<Design> {
    return request<Design>(`/catalog/designs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async deleteDesign(id: number): Promise<void> {
    return request<void>(`/catalog/designs/${id}`, { method: "DELETE" });
  },

  // Suppliers
  async listSuppliers(): Promise<Supplier[]> {
    return request<Supplier[]>("/catalog/suppliers");
  },
  async createSupplier(data: {
    name: string;
    contactPhone?: string | null;
  }): Promise<Supplier> {
    return request<Supplier>("/catalog/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateSupplier(
    id: number,
    data: {
      name?: string;
      contactPhone?: string | null;
      isActive?: boolean;
    }
  ): Promise<Supplier> {
    return request<Supplier>(`/catalog/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async toggleSupplierStatus(id: number, isActive: boolean): Promise<Supplier> {
    return request<Supplier>(`/catalog/suppliers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },

  // Variants
  async listFabricVariants(): Promise<FabricVariant[]> {
    return request<FabricVariant[]>("/catalog/fabric-variants");
  },
  async createFabricVariant(data: {
    fabricId: number;
    warpColorId: number;
    weftColorId: number;
    designId: number;
    sku?: string;
  }): Promise<FabricVariant> {
    return request<FabricVariant>("/catalog/fabric-variants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async toggleFabricVariantStatus(id: number, isActive: boolean): Promise<FabricVariant> {
    return request<FabricVariant>(`/catalog/fabric-variants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },

  async listYarnVariants(): Promise<YarnVariant[]> {
    return request<YarnVariant[]>("/catalog/yarn-variants");
  },
  async createYarnVariant(data: {
    yarnId: number;
    supplierId: number;
    colorId: number;
    sku?: string;
  }): Promise<YarnVariant> {
    return request<YarnVariant>("/catalog/yarn-variants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async toggleYarnVariantStatus(id: number, isActive: boolean): Promise<YarnVariant> {
    return request<YarnVariant>(`/catalog/yarn-variants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },

  // Prices
  async listFabricPrices(params?: { fabricId?: number; activeOnly?: boolean } | number): Promise<FabricPrice[]> {
    const q = new URLSearchParams();
    if (typeof params === "number") {
      q.set("fabricId", String(params));
    } else if (params) {
      if (params.fabricId) q.set("fabricId", String(params.fabricId));
      if (params.activeOnly !== undefined) q.set("activeOnly", String(params.activeOnly));
    }
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request<FabricPrice[]>(`/catalog/fabric-prices${qs}`);
  },
  async createFabricPrice(data: {
    fabricId: number;
    weaverRate: number;
    sellingPrice: number;
    effectiveFrom?: string;
  }): Promise<FabricPrice> {
    return request<FabricPrice>("/catalog/fabric-prices", {
      method: "POST",
      body: JSON.stringify({
        fabricId: data.fabricId,
        weaverRate: data.weaverRate,
        sellingPrice: data.sellingPrice,
        effectiveFrom: data.effectiveFrom,
      }),
    });
  },

  async listYarnPrices(params?: { yarnId?: number; activeOnly?: boolean } | number): Promise<YarnPrice[]> {
    const q = new URLSearchParams();
    if (typeof params === "number") {
      q.set("yarnId", String(params));
    } else if (params) {
      if (params.yarnId) q.set("yarnId", String(params.yarnId));
      if (params.activeOnly !== undefined) q.set("activeOnly", String(params.activeOnly));
    }
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request<YarnPrice[]>(`/catalog/yarn-prices${qs}`);
  },
  async createYarnPrice(data: {
    yarnId: number;
    supplierId: number;
    purchasePrice: number;
    sellingPrice: number;
    effectiveFrom?: string;
  }): Promise<YarnPrice> {
    return request<YarnPrice>("/catalog/yarn-prices", {
      method: "POST",
      body: JSON.stringify({
        yarnId: data.yarnId,
        supplierId: data.supplierId,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        effectiveFrom: data.effectiveFrom,
      }),
    });
  },

  // Quality Rules
  async listQualityRules(): Promise<QualityRule[]> {
    return request<QualityRule[]>("/catalog/quality-rules");
  },
  async createQualityRule(data: {
    factor: string;
    unit: string;
    deductionPerUnit: number;
  }): Promise<QualityRule> {
    return request<QualityRule>("/catalog/quality-rules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateQualityRule(
    id: number,
    data: {
      factor?: string;
      unit?: string;
      deductionPerUnit?: number;
      isActive?: boolean;
    }
  ): Promise<QualityRule> {
    return request<QualityRule>(`/catalog/quality-rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async toggleQualityRuleStatus(id: number, isActive: boolean): Promise<QualityRule> {
    return request<QualityRule>(`/catalog/quality-rules/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },
};
