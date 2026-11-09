import { request, getToken } from "./infrastructure/http/api-client";
import {
  authService,
  userService,
  catalogService,
  workOrderService,
  settlementService,
  directTransactionService,
  stockService,
  weaverPortalService,
  merchantPortalService,
} from "./infrastructure/services";

export * from "./domain/models";
export * from "./infrastructure/http/api-client";
export * from "./infrastructure/services";

export { authService as authApi };

export async function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}

export const weaversApi = {
  list: async (params?: { search?: string; sort?: "name" | "id"; active?: boolean }) => {
    const weavers = await userService.listWeavers();
    let result = weavers;
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (w) =>
          w.firstName.toLowerCase().includes(q) ||
          w.lastName.toLowerCase().includes(q) ||
          (w.phone && w.phone.includes(q))
      );
    }
    if (params?.sort === "name") {
      result.sort((a, b) => a.firstName.localeCompare(b.firstName));
    }
    return result;
  },
  get: async (id: number) => {
    try {
      const user = await userService.getUser(id);
      const parts = user.fullName.split(" ");
      return {
        weaverId: user.weaverProfile?.weaverId ?? user.userId,
        userId: user.userId,
        firstName: parts[0] || user.fullName,
        lastName: parts.slice(1).join(" ") || "",
        fullName: user.fullName,
        phone: user.phone,
        email: user.weaverProfile?.email ?? null,
        bankAccountNumber: user.weaverProfile?.bankAccountNumber ?? null,
        user: {
          userId: user.userId,
          username: user.username,
          isActive: user.isActive,
        },
      };
    } catch {
      return {
        weaverId: id,
        firstName: `Weaver`,
        lastName: `#${id}`,
        phone: null,
        email: null,
        bankAccountNumber: null,
      };
    }
  },
  create: async (data: any) => {
    return userService.createUser({
      username: data.phone || `weaver_${Date.now()}`,
      fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim() || "New Weaver",
      phone: data.phone,
      roles: ["weaver"],
    });
  },
  unsettled: async (_id: number) => {
    return { returns: [], yarnGiven: [], sales: [] };
  },
};

export const merchantsApi = {
  list: async () => {
    const users = await userService.listUsers("merchant");
    return users.map((u) => ({
      merchantId: u.merchantProfile?.merchantId ?? u.userId,
      companyName: u.merchantProfile?.companyName ?? u.fullName,
      contactPhone: u.phone ?? "",
      contactEmail: null,
    }));
  },
  create: async (data: { companyName?: string; contactPhone: string; contactEmail?: string }) => {
    const u = await userService.createUser({
      username: data.contactPhone || `merchant_${Date.now()}`,
      fullName: data.companyName || "New Merchant",
      phone: data.contactPhone,
      roles: ["merchant"],
      companyName: data.companyName,
    });
    return {
      merchantId: u.merchantProfile?.merchantId ?? u.userId,
      companyName: data.companyName ?? null,
      contactPhone: data.contactPhone,
    };
  },
};

export const catalogApi = {
  lookup: async () => {
    const bundle = await catalogService.getLookup();
    const fabricsWithRates = bundle.fabrics.map((f: any) => {
      const p = (f.prices && f.prices[0]) || f.currentPrice;
      const weaverRate = p ? Number(p.weaverRate ?? p.weaverUnitPrice ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? p.sellingUnitPrice ?? 0) : 0;
      return {
        fabricId: f.fabricId,
        productId: f.fabricId,
        name: f.name,
        standardLengthCm: f.standardLengthCm ?? 200,
        standardWidthCm: f.standardWidthCm ?? 100,
        standardWeightG: f.standardWeightG ?? 500,
        isActive: f.isActive,
        weaverRate,
        sellingPrice,
        basePrice: weaverRate || sellingPrice,
      };
    });

    const products = fabricsWithRates.map((f) => ({
      productId: f.fabricId,
      name: f.name,
      category: "fabric",
      basePrice: String(f.weaverRate || f.sellingPrice || 0),
      weaverRate: f.weaverRate,
      sellingPrice: f.sellingPrice,
      standardLengthCm: String(f.standardLengthCm),
      standardWidthCm: String(f.standardWidthCm),
      standardWeightG: f.standardWeightG,
    }));

    const yarnsWithRates = bundle.yarns.map((y: any) => {
      const p = (y.yarnPrices && y.yarnPrices[0]) || y.prices?.[0];
      const purchasePrice = p ? Number(p.purchasePrice ?? p.costPerKg ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? p.sellingPricePerKg ?? 0) : 0;
      return {
        yarnId: y.yarnId,
        yarnTypeId: y.yarnId,
        name: y.name ?? y.materialName,
        materialName: y.name ?? y.materialName,
        purchasePrice,
        sellingPrice,
        basePrice: String(sellingPrice || purchasePrice || 0),
        isActive: y.isActive,
      };
    });

    const yarnTypes = yarnsWithRates.map((y) => ({
      yarnTypeId: y.yarnId,
      materialName: y.materialName,
      purchasePrice: y.purchasePrice,
      sellingPrice: y.sellingPrice,
      basePrice: y.basePrice,
    }));

    return {
      ...bundle,
      fabrics: fabricsWithRates,
      products,
      yarnTypes,
      yarns: yarnsWithRates,
      colors: bundle.colors.map((c) => ({
        colorId: c.colorId,
        name: c.name,
        colorCode: c.colorCode ?? "#000000",
      })),
      suppliers: bundle.suppliers.map((s) => ({
        supplierId: s.supplierId,
        name: s.name,
        contactPhone: s.phone,
        isActive: s.isActive,
      })),
      qualityRules: bundle.qualityRules.map((q) => ({
        qualityRuleId: q.qualityRuleId,
        factor: q.factor,
        unit: q.unit,
        deductionPerUnit: q.deductionPerUnit,
        isActive: q.isActive,
      })),
    };
  },

  fabricVariants: async (_params?: { activeOnly?: boolean }) => {
    const list = await catalogService.listFabricVariants();
    return list.map((fv: any) => {
      const p = fv.fabric?.prices?.[0] || fv.prices?.[0];
      const weaverRate = p ? Number(p.weaverRate ?? p.weaverUnitPrice ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? p.sellingUnitPrice ?? 0) : 0;
      return {
        ...fv,
        fabric: fv.fabric,
        product: {
          productId: fv.fabricId ?? fv.fabric?.fabricId,
          name: fv.fabric?.name ?? "Fabric",
          category: "fabric",
          basePrice: weaverRate || sellingPrice,
          weaverRate,
          sellingPrice,
          standardLengthCm: fv.fabric?.standardLengthCm ? String(fv.fabric.standardLengthCm) : "200",
          standardWidthCm: fv.fabric?.standardWidthCm ? String(fv.fabric.standardWidthCm) : "100",
          standardWeightG: fv.fabric?.standardWeightG ? Number(fv.fabric.standardWeightG) : 500,
        },
        weaverRate,
        sellingPrice,
        basePrice: weaverRate || sellingPrice,
        stockSnapshot: String(fv.stockSnapshot ?? 0),
      };
    });
  },

  yarnVariants: async (_params?: { activeOnly?: boolean }) => {
    const list = await catalogService.listYarnVariants();
    return list.map((yv: any) => {
      const p = yv.yarn?.yarnPrices?.[0] ?? yv.yarnPrices?.[0];
      const purchasePrice = p ? Number(p.purchasePrice ?? p.costPerKg ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? p.sellingPricePerKg ?? 0) : 0;
      return {
        yarnVariantId: yv.yarnVariantId,
        sku: yv.sku,
        stockSnapshot: String(yv.stockSnapshot ?? 0),
        purchasePrice,
        sellingPrice,
        basePrice: String(sellingPrice || purchasePrice || 0),
        isActive: yv.isActive,
        yarnTypeId: yv.yarnId,
        supplierId: yv.supplierId,
        colorId: yv.colorId,
        yarnType: { yarnTypeId: yv.yarnId, materialName: yv.yarn?.name ?? yv.yarn?.materialName ?? "Standard Yarn" },
        yarn: { yarnId: yv.yarnId, name: yv.yarn?.name ?? yv.yarn?.materialName ?? "Standard Yarn" },
        color: { colorId: yv.colorId, name: yv.color?.name ?? "Standard" },
        supplier: { supplierId: yv.supplierId, name: yv.supplier?.name ?? "Cooperative" },
      };
    });
  },

  products: async () => {
    const fabrics = await catalogService.listFabrics();
    return fabrics.map((f) => ({
      productId: f.fabricId,
      name: f.name,
      category: "fabric",
      basePrice: String(f.prices?.[0]?.weaverUnitPrice ?? 0),
      standardLengthCm: f.standardLengthCm ? String(f.standardLengthCm) : null,
      standardWidthCm: f.standardWidthCm ? String(f.standardWidthCm) : null,
    }));
  },

  fabrics: async () => {
    return catalogService.listFabrics();
  },
  createFabric: catalogService.createFabric,
  updateFabric: async (id: number, data: any) => {
    if (data.isActive !== undefined) {
      return catalogService.toggleFabricStatus(id, data.isActive);
    }
    return catalogService.updateFabric(id, data);
  },
  deactivateFabric: (id: number) => catalogService.toggleFabricStatus(id, false),

  yarns: catalogService.listYarns,
  createYarn: catalogService.createYarn,
  updateYarn: async (id: number, data: any) => {
    if (data.isActive !== undefined) {
      return catalogService.toggleYarnStatus(id, data.isActive);
    }
    return catalogService.updateYarn(id, { materialName: data.name ?? data.materialName });
  },
  deactivateYarn: (id: number) => catalogService.toggleYarnStatus(id, false),

  colors: catalogService.listColors,
  createColor: catalogService.createColor,
  updateColor: catalogService.updateColor,
  deleteColor: catalogService.deleteColor,

  designs: catalogService.listDesigns,
  createDesign: catalogService.createDesign,
  updateDesign: catalogService.updateDesign,
  deleteDesign: catalogService.deleteDesign,

  suppliers: catalogService.listSuppliers,
  createSupplier: async (data: { name: string; contactPhone?: string }) => {
    return catalogService.createSupplier({
      name: data.name,
      phone: data.contactPhone,
    });
  },
  updateSupplier: async (id: number, data: any) => {
    if (data.isActive !== undefined) {
      return catalogService.toggleSupplierStatus(id, data.isActive);
    }
    return catalogService.updateSupplier(id, {
      name: data.name,
      phone: data.contactPhone,
    });
  },
  deactivateSupplier: (id: number) => catalogService.toggleSupplierStatus(id, false),

  yarnTypes: async () => {
    const yarns = await catalogService.listYarns();
    return yarns.map((y) => ({ yarnTypeId: y.yarnId, materialName: y.materialName }));
  },
  createProduct: async (data: any) => {
    return catalogService.createFabric({
      name: data.name,
      standardLengthCm: data.standardLengthCm,
      standardWidthCm: data.standardWidthCm,
      standardWeightG: data.standardWeightG,
      weaverUnitPrice: data.basePrice,
    });
  },
  createYarnType: async (data: { materialName: string }) => {
    return catalogService.createYarn({ materialName: data.materialName });
  },

  createFabricVariant: catalogService.createFabricVariant,
  updateFabricVariant: (id: number, data: { isActive: boolean }) =>
    catalogService.toggleFabricVariantStatus(id, data.isActive),
  deactivateFabricVariant: (id: number) => catalogService.toggleFabricVariantStatus(id, false),

  createYarnVariant: catalogService.createYarnVariant,
  updateYarnVariant: (id: number, data: { isActive: boolean }) =>
    catalogService.toggleYarnVariantStatus(id, data.isActive),
  deactivateYarnVariant: (id: number) => catalogService.toggleYarnVariantStatus(id, false),

  fabricPrices: async (_fabricId?: number) => {
    const list = await catalogService.listFabricPrices();
    return list.map((p) => ({
      fabricPriceId: p.fabricPriceId,
      fabricId: p.fabricId,
      weaverUnitPrice: p.weaverUnitPrice,
      sellingUnitPrice: p.sellingUnitPrice,
      weaverRate: p.weaverUnitPrice,
      sellingPrice: p.sellingUnitPrice,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo,
      isActive: p.isActive,
      fabric: p.fabric,
    }));
  },
  createFabricPrice: async (data: {
    fabricId: number;
    weaverRate: number;
    sellingPrice: number;
    effectiveFrom?: string;
  }) => {
    const created = await catalogService.createFabricPrice({
      fabricId: data.fabricId,
      weaverUnitPrice: data.weaverRate,
      sellingUnitPrice: data.sellingPrice,
      effectiveFrom: data.effectiveFrom,
    });
    return {
      fabricPriceId: created.fabricPriceId,
      fabricId: created.fabricId,
      weaverUnitPrice: created.weaverUnitPrice,
      sellingUnitPrice: created.sellingUnitPrice,
      weaverRate: created.weaverUnitPrice,
      sellingPrice: created.sellingUnitPrice,
      effectiveFrom: created.effectiveFrom,
      effectiveTo: created.effectiveTo,
      isActive: created.isActive,
      fabric: created.fabric,
    };
  },
  updateFabricPrice: async (_id: number, _data: any) => {},
  deactivateFabricPrice: async (_id: number) => {},

  yarnPrices: async () => {
    const list = await catalogService.listYarnPrices();
    return list.map((p) => ({
      yarnPriceId: p.yarnPriceId,
      yarnId: p.yarnId,
      supplierId: p.supplierId,
      costPerKg: p.costPerKg,
      sellingPricePerKg: p.sellingPricePerKg,
      purchasePrice: p.costPerKg,
      sellingPrice: p.sellingPricePerKg,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo,
      isActive: p.isActive,
      yarn: p.yarn ? { yarnId: p.yarn.yarnId, name: p.yarn.materialName } : undefined,
      supplier: p.supplier,
    }));
  },
  createYarnPrice: async (data: {
    yarnId: number;
    supplierId: number;
    purchasePrice: number;
    sellingPrice: number;
    effectiveFrom?: string;
  }) => {
    const created = await catalogService.createYarnPrice({
      yarnId: data.yarnId,
      supplierId: data.supplierId,
      costPerKg: data.purchasePrice,
      sellingPricePerKg: data.sellingPrice,
      effectiveFrom: data.effectiveFrom,
    });
    return {
      yarnPriceId: created.yarnPriceId,
      yarnId: created.yarnId,
      supplierId: created.supplierId,
      costPerKg: created.costPerKg,
      sellingPricePerKg: created.sellingPricePerKg,
      purchasePrice: created.costPerKg,
      sellingPrice: created.sellingPricePerKg,
      effectiveFrom: created.effectiveFrom,
      effectiveTo: created.effectiveTo,
      isActive: created.isActive,
    };
  },
  updateYarnPrice: async (_id: number, _data: any) => {},
  deactivateYarnPrice: async (_id: number) => {},

  qualityRules: async () => {
    const list = await catalogService.listQualityRules();
    return list.map((q) => ({
      qualityRuleId: q.qualityRuleId,
      factor: q.factor,
      unit: q.unit,
      deductionPerUnit: q.deductionPerUnit,
      isActive: q.isActive,
    }));
  },
  createQualityRule: catalogService.createQualityRule,
  updateQualityRule: catalogService.updateQualityRule,
  deactivateQualityRule: (id: number) => catalogService.toggleQualityRuleStatus(id, false),
};

export const workOrdersApi = {
  list: async (params?: { status?: string; weaverId?: number }) => {
    const list = await workOrderService.listWorkOrders(params as any);
    return list.map((wo: any) => {
      const zigId = String(wo.zigId ?? wo.workOrderId ?? "");
      const fv = wo.fabricVariant ?? {};
      const f = fv.fabric ?? wo.fabric ?? {};
      const weaverRaw = wo.weaver ?? {};
      const fullName = (weaverRaw.fullName ?? `${weaverRaw.firstName ?? ""} ${weaverRaw.lastName ?? ""}`.trim()) || "Weaver";
      const parts = fullName.split(" ");
      const weaver = {
        ...weaverRaw,
        weaverId: wo.weaverUserId ?? weaverRaw.userId ?? wo.weaverId,
        userId: weaverRaw.userId ?? wo.weaverUserId,
        fullName,
        firstName: weaverRaw.firstName ?? parts[0] ?? "Weaver",
        lastName: weaverRaw.lastName ?? parts.slice(1).join(" ") ?? "",
        phone: weaverRaw.phone ?? null,
      };
      return {
        ...wo,
        zigId,
        workOrderId: zigId,
        weaverId: weaver.weaverId,
        fabricVariantId: wo.fabricVariantId ?? wo.fabricId,
        status: wo.status,
        dateIssued: wo.dateIssued ?? wo.assignedDate,
        assignedDate: wo.dateIssued ?? wo.assignedDate,
        weaver,
        fabric: f,
        fabricVariant: {
          ...fv,
          fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId,
          sku: fv.sku ?? `FAB-${wo.fabricVariantId ?? ""}`,
          fabric: f,
          product: {
            productId: f.fabricId ?? fv.fabricId ?? wo.fabricVariantId,
            name: f.name ?? "Fabric",
            category: "fabric",
            basePrice: fv.currentPrice?.weaverUnitPrice ?? 0,
          },
        },
      };
    });
  },
  get: async (zigId: string) => {
    const wo: any = await workOrderService.getWorkOrder(zigId);
    const zId = String(wo.zigId ?? wo.workOrderId ?? zigId);
    const fv = wo.fabricVariant ?? {};
    const f = fv.fabric ?? wo.fabric ?? {};
    const product = fv.product ?? {
      productId: f.fabricId ?? fv.fabricId ?? wo.fabricVariantId,
      name: f.name ?? "Fabric",
      category: "fabric",
      basePrice: fv.currentPrice?.weaverUnitPrice ?? fv.basePrice ?? 0,
      standardLengthCm: f.standardLengthCm,
      standardWidthCm: f.standardWidthCm,
    };
    const weaverRaw = wo.weaver ?? {};
    const fullName = (weaverRaw.fullName ?? `${weaverRaw.firstName ?? ""} ${weaverRaw.lastName ?? ""}`.trim()) || "Weaver";
    const parts = fullName.split(" ");
    const weaver = {
      ...weaverRaw,
      weaverId: wo.weaverUserId ?? weaverRaw.userId ?? wo.weaverId,
      userId: weaverRaw.userId ?? wo.weaverUserId,
      fullName,
      firstName: weaverRaw.firstName ?? parts[0] ?? "Weaver",
      lastName: weaverRaw.lastName ?? parts.slice(1).join(" ") ?? "",
      phone: weaverRaw.phone ?? null,
    };

    return {
      ...wo,
      zigId: zId,
      workOrderId: zId,
      weaverId: weaver.weaverId,
      weaver,
      fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId,
      status: wo.status,
      dateIssued: wo.dateIssued ?? wo.assignedDate,
      assignedDate: wo.dateIssued ?? wo.assignedDate,
      fabric: f,
      fabricVariant: {
        ...fv,
        fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId,
        sku: fv.sku ?? `FAB-${wo.fabricVariantId}`,
        fabric: f,
        warpColor: fv.warpColor,
        weftColor: fv.weftColor,
        design: fv.design,
        basePrice: fv.currentPrice?.weaverUnitPrice ?? fv.basePrice ?? 0,
        product,
      },
      yarnGiven: (wo.yarnGiven ?? []).map((yg: any) => ({
        yarnGivenId: yg.yarnGivenId,
        quantity: yg.quantityKg ?? yg.quantity,
        unitPrice: yg.unitPrice,
        dateGiven: yg.dateGiven ?? wo.dateIssued ?? wo.assignedDate,
        paymentId: yg.settled ? 1 : null,
        yarnVariant: yg.yarnVariant ?? {
          yarnVariantId: yg.yarnVariantId ?? yg.yarnId,
          sku: yg.yarnVariant?.sku ?? `YRN-${yg.yarnId}`,
          yarnType: { materialName: yg.yarn?.materialName ?? yg.yarnVariant?.yarn?.name ?? "Yarn" },
          supplier: yg.supplier ?? yg.yarnVariant?.supplier ?? undefined,
        },
      })),
      fabricReturns: (wo.fabricReturns ?? []).map((fr: any) => ({
        returnId: fr.fabricReturnId ?? fr.returnId,
        fabricReturnId: fr.fabricReturnId ?? fr.returnId,
        quantityReturned: fr.quantityReturned,
        totalWeight: fr.totalWeight ?? fr.actualWeightG,
        actualWeightG: fr.totalWeight ?? fr.actualWeightG,
        lengthCm: fr.lengthCm ?? null,
        widthCm: fr.widthCm ?? null,
        unitPrice: fr.unitPrice,
        remark: fr.remark ?? fr.notes ?? null,
        dateReturned: fr.dateReturned ?? fr.returnDate,
        paymentId: fr.settlementLineReturns?.length || fr.settled ? 1 : null,
        fabricVariant: fr.fabricVariant ?? fv,
      })),
      yarnReturns: (wo.yarnReturns ?? []).map((yr: any) => ({
        yarnReturnId: yr.yarnReturnId,
        yarnVariantId: yr.yarnVariantId ?? yr.yarnId,
        quantity: yr.quantity ?? yr.quantityKg,
        dateReturned: yr.dateReturned ?? yr.returnDate,
        remark: yr.remark ?? null,
        yarnVariant: yr.yarnVariant ?? {
          yarnVariantId: yr.yarnVariantId ?? yr.yarnId,
          sku: `YRN-${yr.yarnVariantId ?? yr.yarnId}`,
          yarnType: { materialName: yr.yarnVariant?.yarn?.name ?? yr.yarn?.materialName ?? "Yarn" },
        },
      })),
      fabricReturnsToWeaver: (wo.fabricReturnsToWeaver ?? []).map((frw: any) => ({
        fabricReturnToWeaverId: frw.fabricReturnToWeaverId,
        fabricVariantId: frw.fabricVariantId ?? wo.fabricVariantId,
        quantity: frw.quantity,
        dateReturned: frw.dateReturned ?? frw.returnDate,
        remark: frw.remark ?? frw.reason ?? null,
        fabricVariant: frw.fabricVariant ?? fv,
      })),
    };
  },
  nextId: async () => ({ zigId: `WO-${Date.now().toString().slice(-6)}` }),
  create: async (data: any) => {
    const created: any = await workOrderService.createWorkOrder({
      weaverUserId: Number(data.weaverUserId ?? data.weaverId),
      fabricVariantId: Number(data.fabricVariantId),
      yarnLines: data.yarnLines?.map((yl: any) => ({
        yarnVariantId: Number(yl.yarnVariantId),
        quantity: Number(yl.quantity ?? yl.quantityKg ?? 0),
        unitPrice: Number(yl.unitPrice ?? 0),
      })),
    });
    const zId = String(created.zigId ?? created.workOrderId ?? "");
    const fv = created.fabricVariant ?? {};
    const f = fv.fabric ?? created.fabric ?? {};
    const weaverRaw = created.weaver ?? {};
    const fullName = (weaverRaw.fullName ?? `${weaverRaw.firstName ?? ""} ${weaverRaw.lastName ?? ""}`.trim()) || "Weaver";
    const parts = fullName.split(" ");
    const weaver = {
      ...weaverRaw,
      weaverId: created.weaverUserId ?? weaverRaw.userId ?? created.weaverId,
      userId: weaverRaw.userId ?? created.weaverUserId,
      fullName,
      firstName: weaverRaw.firstName ?? parts[0] ?? "Weaver",
      lastName: weaverRaw.lastName ?? parts.slice(1).join(" ") ?? "",
      phone: weaverRaw.phone ?? null,
    };
    return {
      ...created,
      zigId: zId,
      workOrderId: zId,
      weaverId: weaver.weaverId,
      fabricVariantId: created.fabricVariantId ?? created.fabricId,
      status: created.status,
      dateIssued: created.dateIssued ?? created.assignedDate,
      assignedDate: created.dateIssued ?? created.assignedDate,
      weaver,
      fabric: f,
      fabricVariant: {
        ...fv,
        fabricVariantId: created.fabricVariantId ?? fv.fabricVariantId,
        sku: fv.sku ?? `FAB-${created.fabricVariantId}`,
        fabric: f,
        warpColor: fv.warpColor,
        weftColor: fv.weftColor,
        design: fv.design,
        product: {
          productId: f.fabricId ?? fv.fabricId ?? created.fabricVariantId,
          name: f.name ?? "Fabric",
          category: "fabric",
          basePrice: fv.currentPrice?.weaverUnitPrice ?? 0,
        },
      },
    };
  },
  updateStatus: async (zigId: string, status: string) => {
    return workOrderService.updateStatus(zigId, status as any);
  },
  markReturned: async (zigId: string) => {
    return workOrderService.updateStatus(zigId, "returned");
  },
  cancel: async (zigId: string) => {
    return workOrderService.cancelWorkOrder(zigId);
  },
  recordYarnReturn: async (data: { zigId: string; yarnVariantId: number; quantity: number; remark?: string }) => {
    return workOrderService.addYarnReturn(data.zigId, {
      yarnId: data.yarnVariantId,
      quantityKg: data.quantity,
      returnDate: new Date().toISOString(),
    });
  },
  deleteYarnReturn: (id: number) => workOrderService.deleteYarnReturn(id),
  recordFabricReturnToWeaver: async (data: { zigId: string; fabricVariantId: number; quantity: number; remark?: string }) => {
    return workOrderService.addFabricReturnToWeaver(data.zigId, {
      quantity: data.quantity,
      returnDate: new Date().toISOString(),
      reason: data.remark,
    });
  },
  deleteFabricReturnToWeaver: (id: number) => workOrderService.deleteFabricReturnToWeaver(id),
};

export const yarnGivenApi = {
  create: async (data: {
    zigId: string;
    lines: Array<{
      yarnVariantId?: number;
      yarnTypeId?: number;
      colorId?: number;
      supplierId?: number;
      quantity: number;
      unitPrice: number;
    }>;
  }) => {
    const results = await Promise.all(
      data.lines.map((l) =>
        workOrderService.addYarnGiven(data.zigId, {
          yarnId: Number(l.yarnTypeId ?? l.yarnVariantId ?? 1),
          yarnVariantId: l.yarnVariantId,
          supplierId: l.supplierId,
          quantityKg: l.quantity,
          unitPrice: l.unitPrice,
        })
      )
    );
    return { rows: results, variantResolved: [] };
  },
  update: async (yarnGivenId: number, data: { quantity: number; unitPrice: number }) => {
    return workOrderService.updateYarnGiven(yarnGivenId, {
      quantityKg: data.quantity,
      unitPrice: data.unitPrice,
    });
  },
  delete: (yarnGivenId: number) => workOrderService.deleteYarnGiven(yarnGivenId),
};

export const fabricReturnsApi = {
  create: async (data: any) => {
    const zigId = String(data.zigId ?? data.workOrderId ?? "");
    return workOrderService.addFabricReturn(zigId, {
      returnDate: data.returnDate ?? new Date().toISOString(),
      fabricVariantId: data.fabricVariantId ? Number(data.fabricVariantId) : undefined,
      productId: data.productId ? Number(data.productId) : undefined,
      warpColorId: data.warpColorId ? Number(data.warpColorId) : undefined,
      weftColorId: data.weftColorId ? Number(data.weftColorId) : undefined,
      designId: data.designId ? Number(data.designId) : undefined,
      quantityReturned: Number(data.quantityReturned),
      totalWeight: Number(data.totalWeight ?? data.actualWeightG ?? 0),
      actualWeightG: Number(data.totalWeight ?? data.actualWeightG ?? 0),
      unitPrice: Number(data.unitPrice ?? 0),
      lengthCm: data.lengthCm ? Number(data.lengthCm) : undefined,
      widthCm: data.widthCm ? Number(data.widthCm) : undefined,
      notes: data.remark ?? data.notes,
      remark: data.remark ?? data.notes,
    });
  },
  update: async (returnId: number, data: any) => {
    return workOrderService.updateFabricReturn(returnId, {
      quantityReturned: data.quantityReturned,
      actualWeightG: data.totalWeight,
      unitPrice: data.unitPrice,
      notes: data.remark,
    });
  },
  delete: (returnId: number) => workOrderService.deleteFabricReturn(returnId),
};

export const transactionsApi = {
  nextId: async () => ({ transactionId: `TX-${Date.now().toString().slice(-6)}` }),
  list: async (params?: { type?: string; status?: string }) => {
    const txns = await directTransactionService.listTransactions(params as any);
    return txns.map((t: any) => {
      const transactionId = String(t.transactionId ?? t.directTransactionId ?? "");
      const lines = (t.lines ?? t.items ?? []).map((item: any) => ({
        ...item,
        lineId: item.lineId ?? item.directTransactionItemId ?? item.directTransactionLineId,
        directTransactionItemId: item.lineId ?? item.directTransactionItemId ?? item.directTransactionLineId,
        quantity: String(item.quantity ?? 0),
        unitPrice: String(item.unitPrice ?? 0),
        lineTotal: String(item.lineTotal ?? (Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0))),
        deliveredQuantity: String(item.quantity ?? 0),
      }));
      const payments = (t.payments ?? []).map((p: any) => ({
        ...p,
        paymentId: p.paymentId ?? p.directPaymentId,
        directPaymentId: p.paymentId ?? p.directPaymentId,
        installmentId: p.paymentId ?? p.directPaymentId,
        amount: String(p.amount ?? 0),
        paymentDate: p.paymentDate ?? p.createdAt ?? new Date().toISOString(),
      }));

      const weaver = t.weaver
        ? {
            ...t.weaver,
            weaverId: t.weaver.userId ?? t.weaver.weaverId,
            fullName: t.weaver.fullName,
            firstName: t.weaver.firstName ?? t.weaver.fullName?.split(" ")[0] ?? t.weaver.fullName,
            lastName: t.weaver.lastName ?? t.weaver.fullName?.split(" ").slice(1).join(" ") ?? "",
            phone: t.weaver.phone,
          }
        : undefined;

      const merchant = t.merchant
        ? {
            ...t.merchant,
            merchantId: t.merchant.userId ?? t.merchant.merchantId,
            companyName: t.merchant.companyName ?? t.merchant.fullName,
            fullName: t.merchant.fullName,
            contactPhone: t.merchant.contactPhone ?? t.merchant.phone,
            phone: t.merchant.phone,
          }
        : undefined;

      const totalAmount = String(t.totalAmount ?? 0);
      const amountPaid = String(t.amountPaid ?? t.paidAmount ?? 0);
      const date = t.transactionDate ?? t.createdAt ?? new Date().toISOString();

      return {
        ...t,
        transactionId,
        directTransactionId: Number(t.transactionId ?? t.directTransactionId ?? 0),
        type: t.type ?? t.transactionType,
        transactionType: t.type ?? t.transactionType,
        status: t.status ?? t.paymentStatus ?? "unpaid",
        paymentStatus: t.status ?? t.paymentStatus ?? "unpaid",
        paymentTerms: "prepaid" as const,
        totalAmount,
        amountPaid,
        paidAmount: Number(amountPaid),
        transactionDate: date,
        createdAt: date,
        deliveredAt: t.deliveredAt ?? date,
        weaver,
        merchant,
        lines,
        items: lines,
        payments,
      };
    });
  },
  get: async (id: string | number) => {
    const t: any = await directTransactionService.getTransaction(id);
    const transactionId = String(t.transactionId ?? t.directTransactionId ?? id);
    const lines = (t.lines ?? t.items ?? []).map((item: any) => ({
      ...item,
      lineId: item.lineId ?? item.directTransactionItemId ?? item.directTransactionLineId,
      directTransactionItemId: item.lineId ?? item.directTransactionItemId ?? item.directTransactionLineId,
      quantity: String(item.quantity ?? 0),
      unitPrice: String(item.unitPrice ?? 0),
      lineTotal: String(item.lineTotal ?? (Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0))),
      deliveredQuantity: String(item.quantity ?? 0),
    }));
    const payments = (t.payments ?? []).map((p: any) => ({
      ...p,
      paymentId: p.paymentId ?? p.directPaymentId,
      directPaymentId: p.paymentId ?? p.directPaymentId,
      installmentId: p.paymentId ?? p.directPaymentId,
      amount: String(p.amount ?? 0),
      paymentDate: p.paymentDate ?? p.createdAt ?? new Date().toISOString(),
    }));

    const weaver = t.weaver
      ? {
          ...t.weaver,
          weaverId: t.weaver.userId ?? t.weaver.weaverId,
          fullName: t.weaver.fullName,
          firstName: t.weaver.firstName ?? t.weaver.fullName?.split(" ")[0] ?? t.weaver.fullName,
          lastName: t.weaver.lastName ?? t.weaver.fullName?.split(" ").slice(1).join(" ") ?? "",
          phone: t.weaver.phone,
        }
      : undefined;

    const merchant = t.merchant
      ? {
          ...t.merchant,
          merchantId: t.merchant.userId ?? t.merchant.merchantId,
          companyName: t.merchant.companyName ?? t.merchant.fullName,
          fullName: t.merchant.fullName,
          contactPhone: t.merchant.contactPhone ?? t.merchant.phone,
          phone: t.merchant.phone,
        }
      : undefined;

    const totalAmount = String(t.totalAmount ?? 0);
    const amountPaid = String(t.amountPaid ?? t.paidAmount ?? 0);
    const date = t.transactionDate ?? t.createdAt ?? new Date().toISOString();

    return {
      ...t,
      transactionId,
      directTransactionId: Number(t.transactionId ?? t.directTransactionId ?? id),
      type: t.type ?? t.transactionType,
      transactionType: t.type ?? t.transactionType,
      status: t.status ?? t.paymentStatus ?? "unpaid",
      paymentStatus: t.status ?? t.paymentStatus ?? "unpaid",
      paymentTerms: "prepaid" as const,
      totalAmount,
      amountPaid,
      paidAmount: Number(amountPaid),
      transactionDate: date,
      createdAt: date,
      deliveredAt: t.deliveredAt ?? date,
      weaver,
      merchant,
      lines,
      items: lines,
      payments,
    };
  },
  create: async (data: any) => {
    const rawLines = data.lines ?? data.items ?? [];
    const items = rawLines.map((l: any) => ({
      fabricVariantId: l.fabricVariantId ? Number(l.fabricVariantId) : undefined,
      yarnVariantId: l.yarnVariantId ? Number(l.yarnVariantId) : undefined,
      productId: l.productId ? Number(l.productId) : undefined,
      fabricId: (l.fabricId ?? l.productId) ? Number(l.fabricId ?? l.productId) : undefined,
      warpColorId: l.warpColorId ? Number(l.warpColorId) : undefined,
      weftColorId: l.weftColorId ? Number(l.weftColorId) : undefined,
      designId: l.designId ? Number(l.designId) : null,
      yarnId: (l.yarnId ?? l.yarnTypeId) ? Number(l.yarnId ?? l.yarnTypeId) : undefined,
      yarnTypeId: (l.yarnTypeId ?? l.yarnId) ? Number(l.yarnTypeId ?? l.yarnId) : undefined,
      colorId: l.colorId ? Number(l.colorId) : undefined,
      supplierId: l.supplierId ? Number(l.supplierId) : undefined,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      description: l.description,
    }));

    const res: any = await directTransactionService.createTransaction({
      transactionType: data.type,
      supplierId: data.supplierId ? Number(data.supplierId) : undefined,
      weaverId: data.weaverId ? Number(data.weaverId) : null,
      merchantId: data.merchantId ? Number(data.merchantId) : null,
      notes: data.notes,
      items,
      lines: items,
    });
    return {
      ...res,
      transactionId: String(res.transactionId ?? res.directTransactionId),
      directTransactionId: res.transactionId ?? res.directTransactionId,
    };
  },
  deliver: async (transactionId: string) => {
    return directTransactionService.getTransaction(Number(transactionId));
  },
  addPayment: async (transactionId: string, data: { amount: number; paymentMethod?: string; notes?: string }) => {
    return directTransactionService.recordPayment(Number(transactionId), {
      amount: data.amount,
      paymentMethod: data.paymentMethod || "cash",
      notes: data.notes,
    });
  },
  cancel: async (transactionId: string) => {
    return directTransactionService.cancelTransaction(Number(transactionId));
  },
};

export const stockApi = {
  get: async () => {
    const summary: any = await stockService.getStockSummary();
    const fabricList = summary.fabrics?.variants ?? (Array.isArray(summary.fabrics) ? summary.fabrics : []);
    const yarnList = summary.yarns?.variants ?? (Array.isArray(summary.yarns) ? summary.yarns : []);
    return {
      fabricVariants: fabricList.map((f: any) => ({
        ...f,
        fabric: f.fabric ?? f.product,
        product: f.product ?? f.fabric,
        currentStock: Number(f.stockSnapshot ?? f.currentStock ?? 0),
      })),
      yarnVariants: yarnList.map((y: any) => ({
        ...y,
        yarn: y.yarn ?? y.yarnType,
        yarnType: y.yarnType ?? y.yarn,
        currentStockKg: Number(y.stockSnapshot ?? y.currentStockKg ?? 0),
      })),
    };
  },
};

export const calculationsApi = {
  batchPreview: async (params?: { cutoffDate?: string }) => {
    const preview: any = await settlementService.previewSettlements({
      cutoffDate: params?.cutoffDate,
    });
    const weavers = preview.weavers ?? (preview.bundles ?? []).map((b: any) => ({
      weaverId: b.weaverUserId,
      fullName: b.weaverName,
      weaverName: b.weaverName,
      workOrders: (b.zigIds ?? []).map((z: any) => ({ workOrderId: z, zigId: z })),
      fabricPieces: b.returnIds?.length ?? 0,
      netPayout: b.preview?.netSettlement ?? 0,
      zigIds: b.zigIds ?? [],
      returnCount: b.returnIds?.length ?? 0,
      yarnCount: b.yarnGivenIds?.length ?? 0,
      netSettlement: b.preview?.netSettlement ?? 0,
      lineItems: b.preview?.lineItems ?? [],
    }));
    const grandTotal = preview.grandTotal ?? preview.estimatedNetPayout ?? 0;
    const weaverCount = preview.weaverCount ?? preview.totalWeavers ?? weavers.length;
    const amharicAmountInWords = preview.amharicAmountInWords ?? `${grandTotal} ብር`;
    const cutoff = preview.cutoffDate ?? preview.periodEnd ?? params?.cutoffDate;

    return {
      previewId: String(preview.previewId ?? preview.batchId),
      status: preview.status ?? "draft",
      generatedAt: preview.generatedAt,
      weaverCount,
      grandTotal,
      amharicAmountInWords,
      cutoffDate: cutoff,
      weavers: weavers.map((w: any) => ({
        weaverId: w.weaverId,
        weaverName: w.weaverName ?? w.fullName ?? `Weaver #${w.weaverId}`,
        zigIds: w.zigIds ?? (w.workOrders ?? []).map((wo: any) => String(wo.workOrderId ?? wo.zigId)),
        returnCount: w.returnCount ?? w.fabricPieces ?? 0,
        yarnCount: w.yarnCount ?? 0,
        netSettlement: w.netSettlement ?? w.netPayout ?? 0,
        isBlocked: w.isBlocked ?? false,
        blockReasons: w.blockReasons ?? [],
        lineItems: w.lineItems ?? [],
      })),
    };
  },
  batchCommit: async (previewId: string, paymentMethod?: string) => {
    const batchId = Number(previewId);
    if (!Number.isInteger(batchId) || batchId < 1) {
      throw new Error("This preview is missing a valid batch ID. Generate a new preview.");
    }
    const batch: any = await settlementService.commitBatch({ batchId, paymentMethod });
    const grandTotal = Number(batch.grandTotal ?? batch.totalAmount ?? 0);
    const settlements = batch.settlements ?? [];
    return {
      previewId: String(batchId),
      batchId,
      status: batch.status ?? "committed",
      totalAmount: grandTotal,
      amountPaid: Number(batch.amountPaid ?? 0),
      payments: settlements.map((s: any) => ({
        paymentId: s.paymentId ?? s.settlementId,
        weaverId: s.weaverId ?? s.weaverUserId,
        weaverName: s.weaverName ?? s.weaver?.fullName ?? `Weaver #${s.weaverId ?? s.weaverUserId}`,
        amount: Number(s.amount ?? s.netPayout ?? s.netAmount ?? 0),
        status: s.status ?? "draft",
        reconciledZigIds: s.reconciledZigIds ?? s.lines?.map((l: any) => l.zigId) ?? [],
      })),
      grandTotal,
      weaverCount: batch.weaverCount ?? settlements.length,
      amharicAmountInWords: batch.amharicAmountInWords ?? `${grandTotal} ብር`,
    };
  },
  payBatch: async (
    previewId: string | number,
    data?: { amount?: number; paymentMethod?: string; notes?: string }
  ) => {
    const batchId = Number(previewId);
    if (!Number.isInteger(batchId) || batchId < 1) {
      throw new Error("Invalid batch ID for payment.");
    }
    return settlementService.payBatch(batchId, data);
  },
  settlementHistory: async () => {
    const batches: any = await settlementService.listBatches();
    const batchList = Array.isArray(batches) ? batches : (batches.batches ?? []);
    return batchList.map((b: any) => {
      const batchId = b.batchId ?? b.settlementBatchId;
      const amount = Number(b.totalAmount ?? b.grandTotal ?? 0);
      const paidTotal = Number(b.amountPaid ?? 0);
      const settlements = b.settlements ?? [];
      let status: "paid" | "partial" | "unpaid" = "unpaid";
      if (paidTotal >= amount - 0.01 && amount > 0) {
        status = "paid";
      } else if (paidTotal > 0.01) {
        status = "partial";
      }

      return {
        previewId: String(batchId),
        batchId,
        createdAt: b.createdAt,
        committedAt: b.committedAt ?? b.createdAt,
        cutoffDate: b.snapshot?.cutoffDate ?? b.cutoffDate,
        weaverCount: b.snapshot?.weaverCount ?? settlements.length,
        grandTotal: amount,
        paidTotal,
        balance: Math.max(0, Number((amount - paidTotal).toFixed(2))),
        status,
        paymentCount: settlements.reduce(
          (sum: number, settlement: any) => sum + (settlement.payments?.length ?? 0),
          0,
        ),
        paymentMethod: settlements[0]?.payments?.[0]?.paymentMethod ?? b.paymentMethod ?? null,
        confirmedBy: b.createdBy?.fullName ?? "Admin",
      };
    });
  },
  getSettlementPreview: async (previewId: string) => {
    const id = Number(previewId);
    if (!Number.isInteger(id) || id < 1) {
      throw new Error("Invalid settlement preview ID");
    }
    const batch: any = await settlementService.getBatch(id);
    const snapshot = batch.snapshot ?? batch;
    const snapshotWeavers = snapshot.weavers ?? (snapshot.bundles ?? []).map((bundle: any) => ({
      weaverId: bundle.weaverUserId,
      weaverName: bundle.weaverName,
      zigIds: bundle.zigIds ?? [],
      netSettlement: bundle.preview?.netSettlement ?? 0,
      lineItems: bundle.preview?.lineItems ?? [],
    }));
    const sourceWeavers = snapshotWeavers.length > 0
      ? snapshotWeavers
      : (batch.settlements ?? []).map((settlement: any) => ({
          weaverId: settlement.weaverUserId,
          weaverName: settlement.weaver?.fullName,
          netSettlement: Number(settlement.netAmount ?? 0),
          zigIds: [
            ...new Set([
              ...(settlement.lines ?? []).map((line: any) => String(line.zigId)),
              ...(settlement.yarnLines ?? []).map((line: any) => String(line.zigId)),
            ]),
          ],
        }));
    const weavers = sourceWeavers.map((weaver: any) => {
      const weaverId = Number(weaver.weaverId ?? weaver.weaverUserId);
      const settlement = (batch.settlements ?? []).find(
        (row: any) => Number(row.weaverUserId ?? row.weaver?.userId) === weaverId,
      );
      const settlementLines = settlement?.lines ?? [];
      const yarnLines = settlement?.yarnLines ?? [];
      const zigIds = [...new Set([
        ...(weaver.zigIds ?? []).map(String),
        ...settlementLines.map((line: any) => String(line.zigId)),
        ...yarnLines.map((line: any) => String(line.zigId)),
      ])];
      const savedZigDetails = Array.isArray(weaver.zigDetails) ? weaver.zigDetails : [];
      const zigDetails = savedZigDetails.length > 0
        ? savedZigDetails.map((zig: any) => ({
            ...zig,
            groupedReturns: zig.groupedReturns ?? zig.returns ?? [],
          }))
        : zigIds.map((zigId) => {
            const fabricLines = settlementLines.filter((line: any) => String(line.zigId) === zigId);
            const zigYarnLines = yarnLines.filter((line: any) => String(line.zigId) === zigId);
            const groupedReturns = fabricLines.map((line: any) => {
              const unitPrice = Number(line.unitPrice ?? 0);
              const deductionPerPiece = Number(line.deductionPerPiece ?? 0);
              return {
                returnIds: (line.returns ?? []).map((item: any) => item.returnId),
                fabricType: line.fabric?.name ?? `Fabric #${line.fabricId}`,
                quantityReturned: Number(line.totalQuantity ?? 0),
                avgWeight: Number(line.averageWeight ?? 0),
                unitPrice,
                deductionPerPiece,
                adjustedPrice: unitPrice - deductionPerPiece,
                lineSubtotal: Number(line.netFabricValue ?? 0),
              };
            });
            const yarnQty = zigYarnLines.reduce(
              (sum: number, line: any) => sum + Number(line.netQuantity ?? 0),
              0,
            );
            const yarnTotal = zigYarnLines.reduce(
              (sum: number, line: any) => sum + Number(line.totalCost ?? 0),
              0,
            );
            const fabricTotal = fabricLines.reduce(
              (sum: number, line: any) => sum + Number(line.netFabricValue ?? 0),
              0,
            );
            return {
              zigId,
              groupedReturns,
              yarnQty,
              yarnTotal,
              yarnAvgPrice: yarnQty > 0 ? Math.round(yarnTotal / yarnQty) : 0,
              fabricTotal,
              netProfit: fabricTotal - yarnTotal,
            };
          });

      return {
        ...weaver,
        weaverId,
        weaverName: weaver.weaverName ?? weaver.fullName ?? settlement?.weaver?.fullName ?? `Weaver #${weaverId}`,
        zigIds,
        netSettlement: Number(weaver.netSettlement ?? weaver.netPayout ?? settlement?.netAmount ?? 0),
        zigDetails,
      };
    });

    return {
      ...snapshot,
      previewId: String(batch.batchId),
      status: batch.status,
      generatedAt: batch.createdAt,
      grandTotal: Number(batch.totalAmount ?? snapshot.grandTotal ?? 0),
      amharicAmountInWords: batch.amharicAmountInWords ?? snapshot.amharicAmountInWords,
      weaverCount: Number(snapshot.weaverCount ?? snapshot.totalWeavers ?? weavers.length),
      weavers,
    };
  },
  downloadPreviewCsv: async (previewId: string) => {
    await reportsApi.downloadBatchHisabCsv(previewId);
  },
  deduction: async (body: any) => ({
    threshold: 500,
    deductionPerPiece: 10,
    adjustedUnitPrice: 140,
    lineCredit: 1400,
    ruleApplied: "Standard Weight Deficit",
    remark: `Calculated for weight ${body.weight ?? 0}`,
  }),
};

export const paymentsApi = {
  list: async () => request<Array<{
    paymentId: number;
    amount: string;
    paymentDate: string;
    weaver: { firstName: string; lastName: string };
  }>>("/reports/hisab"),
};

export const weaverPortalApi = {
  profile: async (_weaverId?: number) => {
    return weaverPortalService.getProfile();
  },
  workOrders: async () => {
    const list = await weaverPortalService.listWorkOrders();
    return list.map((wo: any) => {
      const zigId = String(wo.zigId ?? wo.workOrderId ?? "");
      const fv = wo.fabricVariant ?? {};
      const f = fv.fabric ?? wo.fabric ?? {};
      return {
        ...wo,
        zigId,
        workOrderId: zigId,
        weaverId: wo.weaverUserId ?? wo.weaverId,
        fabricVariantId: wo.fabricVariantId ?? wo.fabricId,
        status: wo.status,
        dateIssued: wo.dateIssued ?? wo.assignedDate,
        assignedDate: wo.dateIssued ?? wo.assignedDate,
        weaver: wo.weaver ?? ({} as any),
        fabric: f,
        fabricVariant: {
          ...fv,
          fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId ?? wo.fabricId,
          sku: fv.sku ?? `FAB-${wo.fabricVariantId ?? wo.fabricId ?? ""}`,
          fabric: f,
          product: {
            productId: f.fabricId ?? fv.fabricId ?? wo.fabricVariantId ?? wo.fabricId,
            name: f.name ?? "Fabric",
            category: "fabric",
            basePrice: fv.currentPrice?.weaverUnitPrice ?? 0,
          },
        },
      };
    });
  },
  workOrder: async (zigId: string) => {
    return workOrdersApi.get(zigId);
  },
  payments: async () => {
    const settlements = await weaverPortalService.listSettlements();
    return settlements.map((s) => ({
      paymentId: s.settlementId,
      amount: String(s.netPayout),
      paymentDate: s.createdAt,
      paymentMethod: "Bank Transfer",
    }));
  },
};

export const merchantApi = {
  availableFabrics: async () => {
    const variants = await merchantPortalService.getCatalog();
    return variants.map((v) => ({
      fabricVariantId: v.fabricVariantId,
      sku: v.sku,
      fabricId: v.fabricId,
      fabricName: v.fabric?.name ?? "Fabric",
      standardLengthCm: v.fabric?.standardLengthCm ?? 200,
      standardWidthCm: v.fabric?.standardWidthCm ?? 100,
      standardWeightG: v.fabric?.standardWeightG ?? 500,
      design: v.design?.name ?? "Standard",
      warpColor: v.warpColor?.name ?? "Natural",
      weftColor: v.weftColor?.name ?? "Natural",
      sellingPrice: Number(v.fabric?.prices?.[0]?.sellingUnitPrice ?? 0),
    }));
  },
  prices: async () => {
    const prices = await catalogService.listFabricPrices();
    return prices.map((p) => ({
      fabricPriceId: p.fabricPriceId,
      fabricId: p.fabricId,
      weaverUnitPrice: p.weaverUnitPrice,
      sellingUnitPrice: p.sellingUnitPrice,
      weaverRate: p.weaverUnitPrice,
      sellingPrice: p.sellingUnitPrice,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo,
      isActive: p.isActive,
      fabric: p.fabric,
    }));
  },
};

export const reportsApi = {
  getHisab: async (paymentId: number) => {
    const stmt: any = await request<any>(`/reports/hisab/${paymentId}`);
    const fullName = stmt.weaver.fullName ?? "";
    return {
      paymentId: stmt.paymentId,
      paymentDate: stmt.paymentDate,
      weaver: {
        weaverId: stmt.weaver.userId,
        firstName: fullName.split(" ")[0] || fullName,
        lastName: fullName.split(" ").slice(1).join(" ") || "",
        phone: stmt.weaver.phone,
        email: null,
        bankAccountNumber: null,
      },
      amount: stmt.amount,
      amharicAmountInWords: stmt.amharicAmountInWords,
      rows: stmt.rows,
    };
  },
  async downloadHisabCsv(paymentId: number) {
    const token = getToken();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1"}/reports/hisab/${paymentId}?format=csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) throw new Error("Failed to download HISAB CSV");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HISAB-${paymentId}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },
  async downloadBatchHisabCsv(previewId: string) {
    const batchId = Number(previewId);
    if (!Number.isInteger(batchId) || batchId < 1) {
      throw new Error("Invalid settlement batch ID");
    }
    const token = getToken();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1"}/settlements/batches/${batchId}/hisab.csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) throw new Error("Failed to download batch HISAB CSV");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HISAB-BATCH-${batchId}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },
};
