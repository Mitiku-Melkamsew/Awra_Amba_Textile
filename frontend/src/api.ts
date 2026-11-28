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
    const weavers = await userService.listWeavers(
      params?.active !== undefined ? { isActive: params.active } : undefined
    );
    let result = weavers;
    if (params?.active !== undefined) {
      result = result.filter((w) => w.isActive === params.active);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (w) =>
          (w.fullName ?? "").toLowerCase().includes(q) ||
          (w.phone && w.phone.includes(q))
      );
    }
    if (params?.sort === "name") {
      result.sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? ""));
    }
    return result;
  },
  get: async (id: number) => {
    const user = await userService.getUser(id);
    const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return {
      userId: user.userId,
      firstName: user.firstName || fullName,
      lastName: user.lastName ?? "",
      fullName,
      phone: user.phone,
      email: user.email ?? null,
      isActive: user.isActive,
      user: {
        userId: user.userId,
        username: user.username,
        isActive: user.isActive,
      },
    };
  },
  create: async (data: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    username?: string;
  }) => {
    let firstName = (data.firstName ?? "").trim();
    let lastName = (data.lastName ?? "").trim();
    if (!firstName && data.fullName) {
      const parts = data.fullName.trim().split(/\s+/).filter(Boolean);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ");
    }
    if (!firstName) {
      throw new Error("First name is required");
    }
    return userService.createUser({
      username: data.username || data.phone || undefined,
      firstName,
      lastName: lastName || undefined,
      phone: data.phone || undefined,
      roles: ["weaver"],
    });
  },
};

export const merchantsApi = {
  list: async (params?: { active?: boolean }) => {
    const users = await userService.listUsers({
      role: "merchant",
      isActive: params?.active,
    });
    return users.map((u) => ({
      userId: u.userId,
      firstName: u.firstName,
      lastName: u.lastName ?? null,
      companyName: u.fullName,
      contactPhone: u.phone ?? "",
      contactEmail: null,
      isActive: u.isActive,
    }));
  },
  create: async (data: { companyName?: string; firstName?: string; lastName?: string; contactPhone: string; contactEmail?: string }) => {
    const parts = (data.companyName || "New Merchant").trim().split(/\s+/).filter(Boolean);
    const firstName = (data.firstName ?? parts[0] ?? "Merchant").trim();
    const lastName = (data.lastName ?? parts.slice(1).join(" ")).trim();
    const u = await userService.createUser({
      username: data.contactPhone || `merchant_${Date.now()}`,
      firstName,
      lastName: lastName || undefined,
      phone: data.contactPhone,
      roles: ["merchant"],
    });
    return {
      userId: u.userId,
      companyName: data.companyName ?? null,
      contactPhone: data.contactPhone,
    };
  },
};

export const catalogApi = {
  publicCatalog: async () => {
    return catalogService.getPublicCatalog();
  },
  lookup: async () => {
    const bundle = await catalogService.getLookup();
    const fabricsWithRates = bundle.fabrics.map((f: any) => {
      const p = (f.prices && f.prices[0]) || f.currentPrice;
      const weaverRate = p ? Number(p.weaverRate ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? 0) : 0;
      return {
        fabricId: f.fabricId,
        name: f.name,
        standardLengthCm: f.standardLengthCm ?? null,
        standardWidthCm: f.standardWidthCm ?? null,
        standardWeightG: f.standardWeightG ?? null,
        isActive: f.isActive,
        weaverRate,
        sellingPrice,
        basePrice: weaverRate || sellingPrice,
      };
    });

    const yarnsWithRates = bundle.yarns.map((y: any) => {
      const p = (y.yarnPrices && y.yarnPrices[0]) || y.prices?.[0];
      const purchasePrice = p ? Number(p.purchasePrice ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? 0) : 0;
      return {
        yarnId: y.yarnId,
        name: y.name,
        purchasePrice,
        sellingPrice,
        basePrice: String(sellingPrice || purchasePrice || 0),
        isActive: y.isActive,
      };
    });

    return {
      ...bundle,
      fabrics: fabricsWithRates,
      yarns: yarnsWithRates,
      colors: bundle.colors.map((c) => ({
        colorId: c.colorId,
        name: c.name,
      })),
      suppliers: bundle.suppliers.map((s) => ({
        supplierId: s.supplierId,
        name: s.name,
        contactPhone: s.contactPhone,
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
      const weaverRate = p ? Number(p.weaverRate ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? 0) : 0;
      return {
        ...fv,
        fabric: fv.fabric,
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
      const purchasePrice = p ? Number(p.purchasePrice ?? 0) : 0;
      const sellingPrice = p ? Number(p.sellingPrice ?? 0) : 0;
      return {
        yarnVariantId: yv.yarnVariantId,
        sku: yv.sku,
        stockSnapshot: String(yv.stockSnapshot ?? 0),
        purchasePrice,
        sellingPrice,
        basePrice: String(sellingPrice || purchasePrice || 0),
        isActive: yv.isActive,
        supplierId: yv.supplierId,
        colorId: yv.colorId,
        yarn: { yarnId: yv.yarnId, name: yv.yarn?.name ?? "Standard Yarn", isActive: yv.yarn?.isActive ?? true },
        color: { colorId: yv.colorId, name: yv.color?.name ?? "Standard" },
        supplier: { supplierId: yv.supplierId, name: yv.supplier?.name ?? "Cooperative", contactPhone: yv.supplier?.contactPhone ?? null, isActive: yv.supplier?.isActive ?? true },
      };
    });
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
    return catalogService.updateYarn(id, { name: data.name });
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
      contactPhone: data.contactPhone,
    });
  },
  updateSupplier: async (id: number, data: any) => {
    if (data.isActive !== undefined) {
      return catalogService.toggleSupplierStatus(id, data.isActive);
    }
    return catalogService.updateSupplier(id, {
      name: data.name,
      contactPhone: data.contactPhone,
    });
  },
  deactivateSupplier: (id: number) => catalogService.toggleSupplierStatus(id, false),

  createFabricVariant: catalogService.createFabricVariant,
  updateFabricVariant: (id: number, data: { isActive: boolean }) =>
    catalogService.toggleFabricVariantStatus(id, data.isActive),
  deactivateFabricVariant: (id: number) => catalogService.toggleFabricVariantStatus(id, false),

  createYarnVariant: catalogService.createYarnVariant,
  updateYarnVariant: (id: number, data: { isActive: boolean }) =>
    catalogService.toggleYarnVariantStatus(id, data.isActive),
  deactivateYarnVariant: (id: number) => catalogService.toggleYarnVariantStatus(id, false),

  fabricPrices: async (params?: { fabricId?: number; activeOnly?: boolean } | number) => {
    const list = await catalogService.listFabricPrices(params);
    return list.map((p) => ({
      fabricPriceId: p.fabricPriceId,
      fabricId: p.fabricId,
      weaverRate: p.weaverRate,
      sellingPrice: p.sellingPrice,
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
      weaverRate: data.weaverRate,
      sellingPrice: data.sellingPrice,
      effectiveFrom: data.effectiveFrom,
    });
    return {
      fabricPriceId: created.fabricPriceId,
      fabricId: created.fabricId,
      weaverRate: created.weaverRate,
      sellingPrice: created.sellingPrice,
      effectiveFrom: created.effectiveFrom,
      effectiveTo: created.effectiveTo,
      isActive: created.isActive,
      fabric: created.fabric,
    };
  },

  yarnPrices: async (params?: { yarnId?: number; activeOnly?: boolean } | number) => {
    const list = await catalogService.listYarnPrices(params);
    return list.map((p) => ({
      yarnPriceId: p.yarnPriceId,
      yarnId: p.yarnId,
      supplierId: p.supplierId,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo,
      isActive: p.isActive,
      yarn: p.yarn ? { yarnId: p.yarn.yarnId, name: p.yarn.name, isActive: p.yarn.isActive ?? true } : undefined,
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
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      effectiveFrom: data.effectiveFrom,
    });
    return {
      yarnPriceId: created.yarnPriceId,
      yarnId: created.yarnId,
      supplierId: created.supplierId,
      purchasePrice: created.purchasePrice,
      sellingPrice: created.sellingPrice,
      effectiveFrom: created.effectiveFrom,
      effectiveTo: created.effectiveTo,
      isActive: created.isActive,
    };
  },

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
  list: async (params?: { status?: string; weaverUserId?: number; userId?: number }) => {
    const wid = params?.weaverUserId ?? params?.userId;
    const list = await workOrderService.listWorkOrders({
      ...params,
      weaverUserId: wid,
    } as any);
    const mapped = list.map((wo: any) => {
      const zigId = String(wo.zigId ?? "");
      const fv = wo.fabricVariant ?? {};
      const f = fv.fabric ?? wo.fabric ?? {};
      const weaverRaw = wo.weaver ?? {};
      const fullName = (weaverRaw.fullName ?? `${weaverRaw.firstName ?? ""} ${weaverRaw.lastName ?? ""}`.trim()) || "Weaver";
      const parts = fullName.split(" ");
      const weaver = {
        ...weaverRaw,
        userId: weaverRaw.userId ?? wo.weaverUserId,
        fullName,
        firstName: weaverRaw.firstName ?? parts[0] ?? "Weaver",
        lastName: weaverRaw.lastName ?? parts.slice(1).join(" ") ?? "",
        phone: weaverRaw.phone ?? null,
      };
      return {
        ...wo,
        zigId,
        weaverUserId: weaver.userId,
        fabricVariantId: wo.fabricVariantId ?? wo.fabricId,
        status: wo.status,
        dateIssued: wo.dateIssued,
        weaver,
        fabric: f,
        fabricVariant: {
          ...fv,
          fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId,
          sku: fv.sku ?? `FAB-${wo.fabricVariantId ?? ""}`,
          fabric: f,
        },
      };
    });

    if (wid !== undefined && wid !== null && !isNaN(Number(wid))) {
      return mapped.filter((wo: any) => {
        const orderUserId = wo.weaverUserId ?? wo.weaver?.userId;
        return Number(orderUserId) === Number(wid);
      });
    }

    return mapped;
  },
  get: async (zigId: string) => {
    const wo: any = await workOrderService.getWorkOrder(zigId);
    const zId = String(wo.zigId ?? zigId);
    const fv = wo.fabricVariant ?? {};
    const f = fv.fabric ?? wo.fabric ?? {};
    const weaverRaw = wo.weaver ?? {};
    const fullName = (weaverRaw.fullName ?? `${weaverRaw.firstName ?? ""} ${weaverRaw.lastName ?? ""}`.trim()) || "Weaver";
    const parts = fullName.split(" ");
    const weaver = {
      ...weaverRaw,
      userId: weaverRaw.userId ?? wo.weaverUserId,
      fullName,
      firstName: weaverRaw.firstName ?? parts[0] ?? "Weaver",
      lastName: weaverRaw.lastName ?? parts.slice(1).join(" ") ?? "",
      phone: weaverRaw.phone ?? null,
    };

    return {
      ...wo,
      zigId: zId,
      weaverUserId: weaver.userId,
      weaver,
      fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId,
      status: wo.status,
      dateIssued: wo.dateIssued,
      fabric: f,
      fabricVariant: {
        ...fv,
        fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId,
        sku: fv.sku ?? `FAB-${wo.fabricVariantId}`,
        fabric: f,
        warpColor: fv.warpColor,
        weftColor: fv.weftColor,
        design: fv.design,
        basePrice: Number(fv.currentPrice?.weaverRate ?? fv.fabric?.prices?.[0]?.weaverRate ?? fv.basePrice ?? 0),
      },
      netPayable: wo.netPayable !== undefined ? Number(wo.netPayable) : undefined,
      dateReturned: wo.dateReturned ?? null,
      settlementId: wo.settlementId ?? null,
      settlementBatchId: wo.settlementBatchId ?? null,
      yarnGiven: (wo.yarnGiven ?? []).map((yg: any) => ({
        yarnGivenId: yg.yarnGivenId,
        quantity: yg.quantity,
        unitPrice: yg.unitPrice,
        remark: yg.remark ?? null,
        dateGiven: yg.dateGiven ?? wo.dateIssued,
        yarnVariant: yg.yarnVariant ?? {
          yarnVariantId: yg.yarnVariantId ?? yg.yarnId,
          sku: yg.yarnVariant?.sku ?? `YRN-${yg.yarnId}`,
          yarn: { yarnId: yg.yarnId, name: yg.yarn?.name ?? yg.yarnVariant?.yarn?.name ?? "Yarn" },
          supplier: yg.supplier ?? yg.yarnVariant?.supplier ?? undefined,
        },
      })),
      fabricReturns: (wo.fabricReturns ?? []).map((fr: any) => ({
        returnId: fr.returnId,
        quantityReturned: fr.quantityReturned,
        totalWeight: fr.totalWeight,
        lengthCm: fr.lengthCm ?? null,
        widthCm: fr.widthCm ?? null,
        unitPrice: fr.unitPrice,
        grossFabricValue: fr.grossFabricValue !== undefined ? Number(fr.grossFabricValue) : (Number(fr.quantityReturned || 0) * Number(fr.unitPrice || 0)),
        deductionAmount: fr.deductionAmount !== undefined ? Number(fr.deductionAmount) : 0,
        deductions: fr.deductions ?? [],
        remark: fr.remark ?? null,
        dateReturned: fr.dateReturned,
        fabricVariant: fr.fabricVariant ?? fv,
      })),
    };
  },
  nextId: async () => workOrderService.getNextZigId(),
  create: async (data: any) => {
    const created: any = await workOrderService.createWorkOrder({
      weaverUserId: Number(data.weaverUserId ?? data.userId),
      fabricVariantId: Number(data.fabricVariantId),
      yarnLines: data.yarnLines?.map((yl: any) => ({
        yarnVariantId: Number(yl.yarnVariantId),
        quantity: Number(yl.quantity ?? 0),
        unitPrice: Number(yl.unitPrice ?? 0),
      })),
    });
    const zId = String(created.zigId ?? "");
    const fv = created.fabricVariant ?? {};
    const f = fv.fabric ?? created.fabric ?? {};
    const weaverRaw = created.weaver ?? {};
    const fullName = (weaverRaw.fullName ?? `${weaverRaw.firstName ?? ""} ${weaverRaw.lastName ?? ""}`.trim()) || "Weaver";
    const parts = fullName.split(" ");
    const weaver = {
      ...weaverRaw,
      userId: weaverRaw.userId ?? created.weaverUserId,
      fullName,
      firstName: weaverRaw.firstName ?? parts[0] ?? "Weaver",
      lastName: weaverRaw.lastName ?? parts.slice(1).join(" ") ?? "",
      phone: weaverRaw.phone ?? null,
    };
    return {
      ...created,
      zigId: zId,
      weaverUserId: weaver.userId,
      fabricVariantId: created.fabricVariantId ?? created.fabricId,
      status: created.status,
      dateIssued: created.dateIssued,
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
};

export const yarnGivenApi = {
  create: async (data: {
    zigId: string;
    lines: Array<{
      yarnVariantId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }) => {
    const results = await Promise.all(
      data.lines.map((l) =>
        workOrderService.addYarnGiven(data.zigId, {
          yarnVariantId: Number(l.yarnVariantId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })
      )
    );
    return { rows: results, variantResolved: [] };
  },
  update: async (yarnGivenId: number, data: { quantity?: number; unitPrice?: number; remark?: string | null }) => {
    return workOrderService.updateYarnGiven(yarnGivenId, {
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      remark: data.remark,
    });
  },
  delete: (yarnGivenId: number) => workOrderService.deleteYarnGiven(yarnGivenId),
};

export const fabricReturnsApi = {
  create: async (data: any) => {
    const zigId = String(data.zigId ?? "");
    const fabricVariantId = Number(data.fabricVariantId);
    if (!fabricVariantId) {
      throw new Error("fabricVariantId is required for fabric return");
    }
    return workOrderService.addFabricReturn(zigId, {
      dateReturned: data.dateReturned ?? data.returnDate ?? new Date().toISOString(),
      fabricVariantId,
      quantityReturned: Number(data.quantityReturned),
      totalWeight: Number(data.totalWeight ?? 0),
      unitPrice: Number(data.unitPrice ?? 0),
      lengthCm: data.lengthCm ? Number(data.lengthCm) : undefined,
      widthCm: data.widthCm ? Number(data.widthCm) : undefined,
      remark: data.remark,
      deductions: data.deductions,
    });
  },
  update: async (returnId: number, data: any) => {
    return workOrderService.updateFabricReturn(returnId, {
      quantityReturned: data.quantityReturned,
      totalWeight: data.totalWeight,
      unitPrice: data.unitPrice,
      lengthCm: data.lengthCm,
      widthCm: data.widthCm,
      remark: data.remark,
      deductions: data.deductions,
    });
  },
  delete: (returnId: number) => workOrderService.deleteFabricReturn(returnId),
};

export const transactionsApi = {
  list: async (params?: { type?: string; status?: string }) => {
    const txns = await directTransactionService.listTransactions(params as any);
    return txns.map((t: any) => {
      const transactionId = String(t.transactionId ?? "");
      const lines = (t.lines ?? []).map((item: any) => ({
        ...item,
        lineId: item.lineId,
        quantity: String(item.quantity ?? 0),
        unitPrice: String(item.unitPrice ?? 0),
        lineTotal: String(item.lineTotal ?? (Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0))),
      }));
      const payments = (t.payments ?? []).map((p: any) => ({
        ...p,
        paymentId: p.paymentId,
        amount: String(p.amount ?? 0),
        paymentDate: p.paymentDate ?? p.createdAt ?? new Date().toISOString(),
      }));

      const weaver = t.weaver
        ? {
            ...t.weaver,
            userId: t.weaver.userId,
            fullName: t.weaver.fullName,
            firstName: t.weaver.fullName?.split(" ")[0] ?? t.weaver.fullName,
            lastName: t.weaver.fullName?.split(" ").slice(1).join(" ") ?? "",
            phone: t.weaver.phone,
          }
        : undefined;

      const merchant = t.merchant
        ? {
            ...t.merchant,
            companyName: t.merchant.fullName,
            fullName: t.merchant.fullName,
            contactPhone: t.merchant.phone,
            phone: t.merchant.phone,
          }
        : undefined;

      const totalAmount = String(t.totalAmount ?? 0);
      const amountPaid = String(t.amountPaid ?? 0);
      const date = t.transactionDate ?? t.createdAt ?? new Date().toISOString();

      return {
        ...t,
        transactionId,
        type: t.type,
        status: t.status ?? "unpaid",
        totalAmount,
        amountPaid,
        transactionDate: date,
        createdAt: date,
        weaver,
        merchant,
        lines,
        payments,
      };
    });
  },
  get: async (id: string | number) => {
    const t: any = await directTransactionService.getTransaction(id);
    const transactionId = String(t.transactionId ?? id);
    const lines = (t.lines ?? []).map((item: any) => ({
      ...item,
      lineId: item.lineId,
      quantity: String(item.quantity ?? 0),
      unitPrice: String(item.unitPrice ?? 0),
      lineTotal: String(item.lineTotal ?? (Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0))),
    }));
    const payments = (t.payments ?? []).map((p: any) => ({
      ...p,
      paymentId: p.paymentId,
      amount: String(p.amount ?? 0),
      paymentDate: p.paymentDate ?? p.createdAt ?? new Date().toISOString(),
    }));

    const weaver = t.weaver
      ? {
          ...t.weaver,
          userId: t.weaver.userId,
          fullName: t.weaver.fullName,
          firstName: t.weaver.fullName?.split(" ")[0] ?? t.weaver.fullName,
          lastName: t.weaver.fullName?.split(" ").slice(1).join(" ") ?? "",
          phone: t.weaver.phone,
        }
      : undefined;

    const merchant = t.merchant
      ? {
          ...t.merchant,
          companyName: t.merchant.fullName,
          fullName: t.merchant.fullName,
          contactPhone: t.merchant.phone,
          phone: t.merchant.phone,
        }
      : undefined;

    const totalAmount = String(t.totalAmount ?? 0);
    const amountPaid = String(t.amountPaid ?? 0);
    const date = t.transactionDate ?? t.createdAt ?? new Date().toISOString();

    return {
      ...t,
      transactionId,
      type: t.type,
      status: t.status ?? "unpaid",
      totalAmount,
      amountPaid,
      transactionDate: date,
      createdAt: date,
      weaver,
      merchant,
      lines,
      payments,
    };
  },
  create: async (data: any) => {
    const lines = (data.lines ?? []).map((l: any) => ({
      fabricVariantId: l.fabricVariantId ? Number(l.fabricVariantId) : null,
      yarnVariantId: l.yarnVariantId ? Number(l.yarnVariantId) : null,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      ...(l.description ? { description: l.description } : {}),
    }));

    const res: any = await directTransactionService.createTransaction({
      type: data.type,
      supplierId: data.supplierId ? Number(data.supplierId) : undefined,
      weaverUserId: data.weaverUserId ? Number(data.weaverUserId) : null,
      merchantUserId: data.merchantUserId ? Number(data.merchantUserId) : null,
      notes: data.notes,
      lines,
    });
    return {
      ...res,
      transactionId: String(res.transactionId),
    };
  },
  addPayment: async (transactionId: string, data: { amount: number; paymentMethod?: string; notes?: string }) => {
    return directTransactionService.recordPayment(transactionId, {
      amount: data.amount,
      paymentMethod: data.paymentMethod || "cash",
      notes: data.notes,
    });
  },
  cancel: async (transactionId: string) => {
    return directTransactionService.cancelTransaction(transactionId);
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
        fabric: f.fabric,
        currentStock: Number(f.stockSnapshot ?? f.currentStock ?? 0),
      })),
      yarnVariants: yarnList.map((y: any) => ({
        ...y,
        yarn: y.yarn,
        currentStockPieces: Math.round(Number(y.stockSnapshot ?? y.currentStockPieces ?? 0)),
      })),
    };
  },
};

export const calculationsApi = {
  batchPreview: async (params?: { cutoffDate?: string; includeZigIds?: string[] }) => {
    const preview: any = await settlementService.previewSettlements({
      cutoffDate: params?.cutoffDate,
      includeZigIds: params?.includeZigIds,
    });
    const weavers = (preview.bundles ?? []).map((b: any) => {
      const lineItems = (b.fabricLines ?? []).map((line: any) => {
        const quantity = Number(line.quantityReturned ?? 0);
        const deductionAmount = Number(line.deductionAmount ?? 0);
        const grossValue = Number(line.grossFabricValue ?? 0);
        return {
          returnId: line.returnId,
          zigId: line.zigId,
          fabricId: line.fabricVariantId,
          quantityReturned: quantity,
          quantity,
          totalWeight: Number(line.totalWeight ?? 0),
          avgWeight: Number(line.avgWeight ?? 0),
          unitPrice: Number(line.unitPrice ?? 0),
          deductionPerPiece:
            quantity > 0 ? Math.round((deductionAmount / quantity) * 100) / 100 : 0,
          grossValue,
          deductionAmount,
          netCredit: Number(line.netFabricValue ?? 0),
          remark: line.remark ?? "",
        };
      });
      const yarnDebits = (b.yarnLines ?? []).map((line: any) => ({
        yarnGivenId: line.yarnGivenId,
        zigId: line.zigId,
        cost: Number(line.totalCost ?? 0),
        quantity: Number(line.quantity ?? 0),
        unitPrice: Number(line.unitPrice ?? 0),
        yarnSku: line.yarnSku ?? null,
        remark: line.remark ?? null,
      }));
      const zigIds: string[] = b.zigIds ?? [];
      const zigDetails = zigIds.map((zigId) => {
        const groupedReturns = lineItems.filter((line: any) => String(line.zigId) === zigId);
        const zigYarn = yarnDebits.filter((line: any) => String(line.zigId) === zigId);
        const yarnQty = zigYarn.reduce((sum: number, line: any) => sum + line.quantity, 0);
        const yarnTotal = zigYarn.reduce((sum: number, line: any) => sum + line.cost, 0);
        const fabricTotal = groupedReturns.reduce(
          (sum: number, line: any) => sum + line.netCredit,
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
        userId: b.weaverUserId,
        weaverName: b.weaverName,
        zigIds,
        returnCount: lineItems.reduce((sum: number, line: any) => sum + line.quantity, 0),
        yarnCount: yarnDebits.length,
        netSettlement: Number(b.netSettlement ?? 0),
        isBlocked: b.isBlocked ?? false,
        blockReasons: b.blockReasons ?? [],
        lineItems,
        yarnDebits,
        zigDetails,
      };
    });

    return {
      weaverCount: preview.weaverCount ?? weavers.length,
      grandTotal: Number(preview.grandTotal ?? 0),
      amharicAmountInWords: preview.amharicAmountInWords,
      cutoffDate: preview.cutoffDate ?? params?.cutoffDate,
      outOfCutoffZigs: preview.outOfCutoffZigs ?? [],
      weavers,
    };
  },
  batchCommit: async (params: {
    cutoffDate?: string;
    includeZigIds?: string[];
    paymentMethod?: string;
    notes?: string;
    autoPay?: boolean;
    expectedNetSettlement?: number;
  }) => {
    const batch: any = await settlementService.commitBatch({
      autoPay: false,
      ...params,
    });
    const settlements = batch.settlements ?? [];
    const grandTotal = Number(batch.grandTotal ?? 0);
    return {
      previewId: String(batch.batchId),
      batchId: batch.batchId,
      status: batch.status,
      grandTotal,
      amountPaid: Number(batch.amountPaid ?? 0),
      payments: settlements.map((s: any) => ({
        settlementId: s.settlementId,
        weaverUserId: s.weaverUserId,
        weaverName: s.weaver?.fullName ?? `Weaver #${s.weaverUserId}`,
        amount: Number(s.netAmount ?? 0),
        status: s.status,
      })),
      weaverCount: batch.weaverCount ?? settlements.length,
      amharicAmountInWords: batch.amharicAmountInWords,
    };
  },
  cancelSettlement: async (settlementId: number | string, reason: string) => {
    return settlementService.cancelSettlement(settlementId, reason);
  },
  cancelBatch: async (batchId: number | string, reason: string) => {
    return settlementService.cancelBatch(batchId, reason);
  },
  pendingSummary: async () => {
    return settlementService.getPendingSummary();
  },
  zigsLedger: async (status?: string) => {
    return settlementService.getZigsLedger(status);
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
      const batchId = b.batchId;
      const amount = Number(b.totalAmount ?? 0);
      const paidTotal = Number(b.amountPaid ?? 0);
      const settlements = b.settlements ?? [];
      let status: "paid" | "partial" | "unpaid" | "cancelled" = "unpaid";
      if (b.status === "cancelled") {
        status = "cancelled";
      } else if (paidTotal >= amount - 0.01 && amount > 0) {
        status = "paid";
      } else if (paidTotal > 0.01) {
        status = "partial";
      }

      return {
        previewId: String(batchId),
        batchId,
        createdAt: b.createdAt,
        committedAt: b.committedAt ?? b.createdAt,
        cutoffDate: b.cutoffDate,
        weaverCount: settlements.length,
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
      throw new Error("Invalid settlement batch ID");
    }
    const batch: any = await settlementService.getBatch(id);
    const weavers = (batch.settlements ?? []).map((settlement: any) => {
      const workOrders = settlement.workOrders ?? [];
      const zigIds = workOrders.map((wo: any) => String(wo.zigId));
      const zigDetails = workOrders.map((wo: any) => {
        const fabricReturns = wo.fabricReturns ?? [];
        const yarnGiven = wo.yarnGiven ?? [];
        const groupedReturns = fabricReturns.map((fr: any) => {
          const quantity = Number(fr.quantityReturned ?? 0);
          const unitPrice = Number(fr.unitPrice ?? 0);
          const deductionAmount = Number(fr.deductionAmount ?? 0);
          const deductionPerPiece = quantity > 0 ? deductionAmount / quantity : 0;
          return {
            returnIds: [fr.returnId],
            fabricType: fr.fabricVariant?.fabric?.name ?? "Fabric",
            quantityReturned: quantity,
            avgWeight:
              quantity > 0 ? Math.floor(Number(fr.totalWeight ?? 0) / quantity) : 0,
            unitPrice,
            deductionPerPiece,
            adjustedPrice: unitPrice - deductionPerPiece,
            lineSubtotal: Number(fr.grossFabricValue ?? 0) - deductionAmount,
          };
        });
        const yarnQty = yarnGiven.reduce(
          (sum: number, line: any) => sum + Number(line.quantity ?? 0),
          0,
        );
        const yarnTotal = yarnGiven.reduce(
          (sum: number, line: any) =>
            sum + Number(line.quantity ?? 0) * Number(line.unitPrice ?? 0),
          0,
        );
        const fabricTotal = fabricReturns.reduce(
          (sum: number, fr: any) =>
            sum + Number(fr.grossFabricValue ?? 0) - Number(fr.deductionAmount ?? 0),
          0,
        );
        return {
          zigId: wo.zigId,
          groupedReturns,
          yarnQty,
          yarnTotal,
          yarnAvgPrice: yarnQty > 0 ? Math.round(yarnTotal / yarnQty) : 0,
          fabricTotal,
          netProfit: fabricTotal - yarnTotal,
        };
      });

      return {
        settlementId: settlement.settlementId,
        status: settlement.status,
        userId: settlement.weaverUserId,
        weaverName: settlement.weaver?.fullName ?? `Weaver #${settlement.weaverUserId}`,
        zigIds,
        netSettlement: Number(settlement.netAmount ?? 0),
        zigDetails,
      };
    });

    return {
      previewId: String(batch.batchId),
      batchId: batch.batchId,
      status: batch.status,
      cutoffDate: batch.cutoffDate,
      generatedAt: batch.createdAt,
      grandTotal: Number(batch.totalAmount ?? 0),
      amharicAmountInWords: batch.amharicAmountInWords,
      weaverCount: weavers.length,
      weavers,
      settlements: batch.settlements,
    };
  },
  downloadPreviewCsv: async (previewId: string) => {
    await reportsApi.downloadBatchHisabCsv(previewId);
  },
};

export const settlementsApi = calculationsApi;

export const paymentsApi = {
  list: async () => request<Array<{
    paymentId: number;
    amount: string;
    paymentDate: string;
    weaver: { userId?: number; fullName: string };
  }>>("/reports/hisab"),
};

export const weaverPortalApi = {
  profile: async (_userId?: number) => {
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
        weaverUserId: wo.weaverUserId,
        userId: wo.weaverUserId,
        fabricVariantId: wo.fabricVariantId ?? wo.fabricId,
        status: wo.status,
        dateIssued: wo.dateIssued,
        weaver: wo.weaver ?? ({} as any),
        fabric: f,
        fabricVariant: {
          ...fv,
          fabricVariantId: wo.fabricVariantId ?? fv.fabricVariantId ?? wo.fabricId,
          sku: fv.sku ?? `FAB-${wo.fabricVariantId ?? wo.fabricId ?? ""}`,
          fabric: f,
        },
      };
    });
  },
  workOrder: async (zigId: string) => {
    return workOrdersApi.get(zigId);
  },
  payments: async () => {
    return weaverPortalService.listPayments();
  },
};

export const merchantApi = {
  availableFabrics: async () => {
    const variants = (await merchantPortalService.getCatalog()) as any[];
    return variants.map((v) => ({
      fabricVariantId: v.fabricVariantId,
      sku: v.sku,
      fabricId: v.fabricId,
      fabricName: v.fabricName ?? v.fabric?.name ?? "Fabric",
      standardLengthCm: v.standardLengthCm ?? v.fabric?.standardLengthCm ?? null,
      standardWidthCm: v.standardWidthCm ?? v.fabric?.standardWidthCm ?? null,
      standardWeightG: v.standardWeightG ?? v.fabric?.standardWeightG ?? null,
      design: typeof v.design === "string" ? v.design : (v.design?.name ?? "Standard"),
      warpColor: typeof v.warpColor === "string" ? v.warpColor : (v.warpColor?.name ?? "Natural"),
      weftColor: typeof v.weftColor === "string" ? v.weftColor : (v.weftColor?.name ?? "Natural"),
      sellingPrice: Number(v.sellingPrice ?? v.fabric?.prices?.[0]?.sellingPrice ?? 0),
    }));
  },
  prices: async () => {
    const prices = await catalogService.listFabricPrices();
    return prices.map((p) => ({
      fabricPriceId: p.fabricPriceId,
      fabricId: p.fabricId,
      weaverRate: p.weaverRate,
      sellingPrice: p.sellingPrice,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo,
      isActive: p.isActive,
      fabric: p.fabric,
    }));
  },
};

export const reportsApi = {
  getHisab: async (id: number, type: "payment" | "settlement") => {
    const stmt: any = await request<any>(`/reports/hisab/${type}/${id}`);
    const fullName = stmt.weaver.fullName ?? "";
    return {
      paymentId: stmt.paymentId ?? null,
      settlementId: stmt.settlementId,
      paymentDate: stmt.paymentDate,
      isPaid: Boolean(stmt.isPaid),
      status: stmt.status,
      weaver: {
        userId: stmt.weaver.userId,
        fullName,
        firstName: fullName.split(" ")[0] || fullName,
        lastName: fullName.split(" ").slice(1).join(" ") || "",
        phone: stmt.weaver.phone,
        email: null,
        isActive: stmt.weaver.isActive ?? true,
      },
      amount: stmt.amount,
      amharicAmountInWords: stmt.amharicAmountInWords,
      rows: stmt.rows,
    };
  },
  async downloadHisabCsv(id: number, type: "payment" | "settlement") {
    const token = getToken();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1"}/reports/hisab/${type}/${id}?format=csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) throw new Error("Failed to download HISAB CSV");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HISAB-${type.toUpperCase()}-${id}.csv`;
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
