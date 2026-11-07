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
} from "../../domain/models";

export const catalogService = {
  async getLookup(): Promise<CatalogLookupBundle> {
    return request<CatalogLookupBundle>("/catalog/lookup");
  },

  // Fabrics
  async listFabrics(): Promise<Fabric[]> {
    return request<Fabric[]>("/catalog/fabrics");
  },
  async createFabric(data: {
    name: string;
    standardLengthCm?: number | null;
    standardWidthCm?: number | null;
    standardWeightG?: number | null;
    weaverUnitPrice?: number;
    sellingUnitPrice?: number;
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
      standardLengthCm?: number | null;
      standardWidthCm?: number | null;
      standardWeightG?: number | null;
    }
  ): Promise<Fabric> {
    return request<Fabric>(`/catalog/fabrics/${id}`, {
      method: "PUT",
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
  async createYarn(data: { materialName: string }): Promise<Yarn> {
    return request<Yarn>("/catalog/yarns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateYarn(id: number, data: { materialName: string }): Promise<Yarn> {
    return request<Yarn>(`/catalog/yarns/${id}`, {
      method: "PUT",
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
  async createColor(data: { name: string; colorCode?: string }): Promise<Color> {
    return request<Color>("/catalog/colors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateColor(id: number, data: { name: string; colorCode?: string }): Promise<Color> {
    return request<Color>(`/catalog/colors/${id}`, {
      method: "PUT",
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
  async createDesign(data: { name: string; description?: string }): Promise<Design> {
    return request<Design>("/catalog/designs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateDesign(id: number, data: { name: string; description?: string }): Promise<Design> {
    return request<Design>(`/catalog/designs/${id}`, {
      method: "PUT",
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
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
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
      contactName?: string;
      phone?: string;
      email?: string;
      address?: string;
    }
  ): Promise<Supplier> {
    return request<Supplier>(`/catalog/suppliers/${id}`, {
      method: "PUT",
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
    warpColorId?: number | null;
    weftColorId?: number | null;
    designId?: number | null;
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
    colorId?: number | null;
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
  async listFabricPrices(fabricId?: number): Promise<FabricPrice[]> {
    const qs = fabricId ? `?fabricId=${fabricId}` : "";
    const rows = await request<any[]>(`/catalog/fabric-prices${qs}`);
    return rows.map((row) => ({
      ...row,
      weaverUnitPrice: row.weaverUnitPrice ?? row.weaverRate ?? 0,
      sellingUnitPrice: row.sellingUnitPrice ?? row.sellingPrice ?? 0,
    }));
  },
  async createFabricPrice(data: {
    fabricId: number;
    weaverUnitPrice?: number;
    weaverRate?: number;
    sellingUnitPrice?: number;
    sellingPrice?: number;
    effectiveFrom?: string;
  }): Promise<FabricPrice> {
    const payload = {
      ...data,
      weaverRate: data.weaverRate ?? data.weaverUnitPrice,
      weaverUnitPrice: data.weaverUnitPrice ?? data.weaverRate,
      sellingPrice: data.sellingPrice ?? data.sellingUnitPrice,
      sellingUnitPrice: data.sellingUnitPrice ?? data.sellingPrice,
    };
    return request<FabricPrice>("/catalog/fabric-prices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listYarnPrices(): Promise<YarnPrice[]> {
    const rows = await request<any[]>("/catalog/yarn-prices");
    return rows.map((row) => ({
      ...row,
      costPerKg: row.costPerKg ?? row.purchasePrice ?? 0,
      sellingPricePerKg: row.sellingPricePerKg ?? row.sellingPrice ?? 0,
    }));
  },
  async createYarnPrice(data: {
    yarnId: number;
    supplierId: number;
    costPerKg?: number;
    purchasePrice?: number;
    sellingPricePerKg?: number;
    sellingPrice?: number;
    effectiveFrom?: string;
  }): Promise<YarnPrice> {
    const payload = {
      ...data,
      purchasePrice: data.purchasePrice ?? data.costPerKg,
      costPerKg: data.costPerKg ?? data.purchasePrice,
      sellingPrice: data.sellingPrice ?? data.sellingPricePerKg,
      sellingPricePerKg: data.sellingPricePerKg ?? data.sellingPrice,
    };
    return request<YarnPrice>("/catalog/yarn-prices", {
      method: "POST",
      body: JSON.stringify(payload),
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
    notes?: string;
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
      notes?: string;
    }
  ): Promise<QualityRule> {
    return request<QualityRule>(`/catalog/quality-rules/${id}`, {
      method: "PUT",
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
