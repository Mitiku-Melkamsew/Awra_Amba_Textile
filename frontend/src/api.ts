const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export interface AuthUser {
  userId: number;
  username: string;
  role: "admin" | "weaver" | "merchant";
  weaverId: number | null;
  merchantId: number | null;
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const authApi = {
  login: (username: string, password: string) =>
    api<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  signup: (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    username: string;
    password: string;
  }) =>
    api<{ token: string; user: AuthUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => api<{ user: AuthUser }>("/auth/me"),
};

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error("API unreachable");
  return response.json();
}

export interface Weaver {
  weaverId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  bankAccountNumber: string | null;
}

export interface Product {
  productId: number;
  name: string;
  category: string;
  basePrice: string;
  standardLengthCm: string | null;
  standardWidthCm: string | null;
}

export interface FabricVariant {
  fabricVariantId: number;
  sku: string;
  basePrice: string | null;
  stockSnapshot: string;
  product: Product;
  warpColor?: { colorId: number; name: string; colorCode: string };
  weftColor?: { colorId: number; name: string; colorCode: string };
  design?: { designId: number; name: string } | null;
}

export interface WorkOrder {
  zigId: string;
  weaverId: number;
  fabricVariantId: number;
  status: string;
  dateIssued: string;
  weaver: Weaver;
  fabricVariant: FabricVariant;
  _count?: { yarnGiven: number; fabricReturns: number };
}

export interface WorkOrderDetail extends WorkOrder {
  yarnGiven: Array<{
    yarnGivenId: number;
    quantity: string;
    unitPrice: string;
    dateGiven: string;
    paymentId: number | null;
    yarnVariant: {
      yarnVariantId: number;
      sku: string;
      yarnTypeId?: number;
      colorId?: number;
      supplierId?: number;
      yarnType?: { materialName: string; yarnTypeId?: number };
      supplier?: { name: string; supplierId?: number };
      color?: { name: string; colorId?: number };
    };
  }>;
  fabricReturns: Array<{
    returnId: number;
    quantityReturned: number;
    totalWeight: string;
    lengthCm: string | null;
    widthCm: string | null;
    unitPrice: string;
    remark: string | null;
    dateReturned: string;
    paymentId: number | null;
    fabricVariant: FabricVariant;
  }>;
}

export const weaversApi = {
  list: (params?: { search?: string; sort?: "name" | "id"; active?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.active === false) query.set("active", "false");
    const suffix = query.toString() ? `?${query}` : "";
    return api<Weaver[]>(`/weavers${suffix}`);
  },
  get: (id: number) => api<Weaver>(`/weavers/${id}`),
  create: (data: Partial<Weaver>) =>
    api<Weaver>("/weavers", { method: "POST", body: JSON.stringify(data) }),
  unsettled: (id: number) =>
    api<{ returns: unknown[]; yarnGiven: unknown[]; sales: unknown[] }>(
      `/weavers/${id}/unsettled`,
    ),
};

export const catalogApi = {
  lookup: () =>
    api<{
      colors: Array<{ colorId: number; colorCode: string; name: string }>;
      designs: Array<{ designId: number; name: string }>;
      products: Product[];
      suppliers: Array<{ supplierId: number; name: string; contactPhone: string | null }>;
      yarnTypes: Array<{ yarnTypeId: number; materialName: string }>;
    }>("/catalog/lookup"),
  fabricVariants: () => api<FabricVariant[]>("/catalog/fabric-variants"),
  yarnVariants: () =>
    api<
      Array<{
        yarnVariantId: number;
        sku: string;
        stockSnapshot: string;
        basePrice: string | null;
        yarnType: { materialName: string };
        color: { name: string };
        supplier: { name: string };
      }>
    >("/catalog/yarn-variants"),
  products: () => api<Product[]>("/catalog/products"),
  colors: () => api<Array<{ colorId: number; colorCode: string; name: string }>>("/catalog/colors"),
  designs: () => api<Array<{ designId: number; name: string }>>("/catalog/designs"),
  suppliers: () =>
    api<Array<{ supplierId: number; name: string; contactPhone: string | null }>>(
      "/catalog/suppliers",
    ),
  yarnTypes: () => api<Array<{ yarnTypeId: number; materialName: string }>>("/catalog/yarn-types"),
  createColor: (data: { colorCode: string; name: string }) =>
    api<unknown>("/catalog/colors", { method: "POST", body: JSON.stringify(data) }),
  createDesign: (data: { name: string }) =>
    api<unknown>("/catalog/designs", { method: "POST", body: JSON.stringify(data) }),
  createProduct: (data: {
    name: string;
    category: string;
    basePrice: number;
    standardLengthCm?: number;
    standardWidthCm?: number;
  }) => api<unknown>("/catalog/products", { method: "POST", body: JSON.stringify(data) }),
  createSupplier: (data: { name: string; contactPhone?: string }) =>
    api<unknown>("/catalog/suppliers", { method: "POST", body: JSON.stringify(data) }),
  createYarnType: (data: { materialName: string }) =>
    api<unknown>("/catalog/yarn-types", { method: "POST", body: JSON.stringify(data) }),
  createFabricVariant: (data: Record<string, unknown>) =>
    api<unknown>("/catalog/fabric-variants", { method: "POST", body: JSON.stringify(data) }),
  createYarnVariant: (data: Record<string, unknown>) =>
    api<unknown>("/catalog/yarn-variants", { method: "POST", body: JSON.stringify(data) }),
};

export const stockApi = {
  get: () =>
    api<{ yarnVariants: unknown[]; fabricVariants: FabricVariant[] }>("/stock"),
};

export const procurementApi = {
  list: () => api<unknown[]>("/procurement/yarn-purchases"),
  create: (data: {
    supplierId: number;
    notes?: string;
    lines: Array<{ yarnVariantId: number; quantity: number; unitPrice: number }>;
  }) =>
    api<unknown>("/procurement/yarn-purchases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export type CommercialTxnType =
  | "yarn_purchase"
  | "fabric_purchase"
  | "yarn_sale"
  | "fabric_sale"
  | "weaver_payout";

export type CommercialTxnStatus =
  | "pending"
  | "in_progress"
  | "awaiting_delivery"
  | "awaiting_payment"
  | "completed"
  | "cancelled";

export type PaymentTerms = "prepaid" | "on_delivery" | "installment";

export interface CommercialTransaction {
  transactionId: string;
  type: CommercialTxnType;
  status: CommercialTxnStatus;
  paymentTerms: PaymentTerms;
  supplierId: number | null;
  weaverId: number | null;
  merchantId: number | null;
  totalAmount: string;
  amountPaid: string;
  deliveredAt: string | null;
  notes: string | null;
  linkedPaymentId: number | null;
  createdAt: string;
  supplier?: { name: string } | null;
  weaver?: { firstName: string; lastName: string } | null;
  merchant?: { companyName: string | null; contactPhone: string } | null;
  lines: Array<{
    lineId: number;
    yarnVariantId: number | null;
    fabricVariantId: number | null;
    quantity: string;
    unitPrice: string;
    deliveredQuantity: string;
    description: string | null;
    yarnVariant?: {
      sku: string;
      yarnType?: { materialName: string };
      color?: { name: string };
      supplier?: { name: string };
    } | null;
    fabricVariant?: FabricVariant | null;
  }>;
  payments: Array<{
    installmentId: number;
    amount: string;
    paymentDate: string;
    paymentMethod: string | null;
    notes: string | null;
  }>;
}

export const transactionsApi = {
  nextId: () => api<{ transactionId: string }>("/transactions/next-id"),
  list: (params?: { type?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query}` : "";
    return api<CommercialTransaction[]>(`/transactions${suffix}`);
  },
  get: (transactionId: string) =>
    api<CommercialTransaction>(`/transactions/${transactionId}`),
  create: (data: {
    transactionId?: string;
    type: CommercialTxnType;
    paymentTerms: PaymentTerms;
    supplierId?: number;
    weaverId?: number;
    merchantId?: number;
    notes?: string;
    lines: Array<{
      yarnVariantId?: number;
      fabricVariantId?: number;
      yarnTypeId?: number;
      colorId?: number;
      supplierId?: number;
      productId?: number;
      warpColorId?: number;
      weftColorId?: number;
      designId?: number | null;
      quantity: number;
      unitPrice: number;
      description?: string;
    }>;
  }) =>
    api<CommercialTransaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deliver: (transactionId: string) =>
    api<CommercialTransaction>(`/transactions/${transactionId}/deliver`, {
      method: "POST",
    }),
  addPayment: (
    transactionId: string,
    data: { amount: number; paymentMethod?: string; notes?: string },
  ) =>
    api<CommercialTransaction>(`/transactions/${transactionId}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancel: (transactionId: string) =>
    api<CommercialTransaction>(`/transactions/${transactionId}/cancel`, {
      method: "PATCH",
    }),
};

export const merchantsApi = {
  list: () =>
    api<
      Array<{
        merchantId: number;
        companyName: string | null;
        contactPhone: string;
        contactEmail: string | null;
      }>
    >("/merchants"),
  create: (data: {
    companyName?: string;
    contactPhone: string;
    contactEmail?: string;
  }) =>
    api<{ merchantId: number; companyName: string | null; contactPhone: string }>(
      "/merchants",
      { method: "POST", body: JSON.stringify(data) },
    ),
};

export const workOrdersApi = {
  list: (params?: { status?: string; weaverId?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.weaverId) query.set("weaverId", String(params.weaverId));
    const suffix = query.toString() ? `?${query}` : "";
    return api<WorkOrder[]>(`/work-orders${suffix}`);
  },
  get: (zigId: string) => api<WorkOrderDetail>(`/work-orders/${zigId}`),
  nextId: () => api<{ zigId: string }>("/work-orders/next-id"),
  create: (data: {
    weaverId: number;
    zigId?: string;
    productId: number;
    warpColorId: number;
    weftColorId: number;
    designId?: number | null;
    unitPrice?: number;
    yarnLines?: Array<{
      yarnVariantId?: number;
      yarnTypeId?: number;
      colorId?: number;
      supplierId?: number;
      quantity: number;
      unitPrice: number;
    }>;
  }) => api<WorkOrder>("/work-orders", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (zigId: string, status: string) =>
    api<WorkOrder>(`/work-orders/${zigId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export const yarnGivenApi = {
  create: (data: {
    zigId: string;
    lines: Array<{
      yarnVariantId?: number;
      yarnTypeId?: number;
      colorId?: number;
      supplierId?: number;
      quantity: number;
      unitPrice: number;
    }>;
  }) =>
    api<{
      rows: unknown[];
      variantResolved: Array<{ created: boolean; sku: string }>;
    }>("/yarn-given", { method: "POST", body: JSON.stringify(data) }),
  update: (
    yarnGivenId: number,
    data: {
      yarnVariantId?: number;
      yarnTypeId?: number;
      colorId?: number;
      supplierId?: number;
      quantity: number;
      unitPrice: number;
    },
  ) =>
    api<unknown>(`/yarn-given/${yarnGivenId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const fabricReturnsApi = {
  create: (data: {
    zigId: string;
    fabricVariantId?: number;
    warpColorId?: number;
    weftColorId?: number;
    designId?: number | null;
    quantityReturned: number;
    totalWeight: number;
    unitPrice: number;
    lengthCm?: number;
    widthCm?: number;
    remark?: string;
  }) =>
    api<unknown>("/fabric-returns", { method: "POST", body: JSON.stringify(data) }),
  update: (
    returnId: number,
    data: {
      fabricVariantId?: number;
      warpColorId?: number;
      weftColorId?: number;
      designId?: number | null;
      quantityReturned: number;
      totalWeight: number;
      unitPrice: number;
      lengthCm?: number;
      widthCm?: number;
      remark?: string;
    },
  ) =>
    api<unknown>(`/fabric-returns/${returnId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export interface DeductionResult {
  threshold: number;
  deductionPerPiece: number;
  adjustedUnitPrice: number;
  lineCredit: number;
  ruleApplied: string;
  remark: string;
}

export interface BonusResult {
  bonusPerPiece: number;
  totalBonus: number;
  ruleApplied: string;
  remark: string;
}

export interface HisabReport {
  paymentId: number;
  paymentDate: string;
  weaver: Weaver;
  amount: number;
  amharicAmountInWords: string;
  rows: Array<{
    weaverId: string | number;
    weaverName: string;
    zigId: string;
    fabricType: string;
    fabricQty: string | number;
    avgWeight: string | number;
    basePrice: string | number;
    deduction: string | number;
    adjustedPrice: string | number;
    lineSubtotal: string | number;
    fabricTotalValue: string | number;
    yarnQty: string | number;
    yarnAvgPrice: string | number;
    yarnTotal: string | number;
    netProfit: string | number;
    totalNetProfit: string | number;
  }>;
}

export interface SettlementPreview {
  lineItems: Array<{
    returnId: number;
    zigId: string;
    netCredit: number;
    deductionPerPiece: number;
    bonusAmount: number;
    remark: string;
  }>;
  yarnDebits: Array<{ yarnGivenId: number; cost: number }>;
  saleAdjustments: Array<{ saleId: number; signedAmount: number }>;
  netSettlement: number;
  amharicAmountInWords: string;
}

export const weaverPortalApi = {
  profile: (weaverId: number) => api<Weaver>(`/weavers/${weaverId}`),
  workOrders: () => api<WorkOrder[]>("/work-orders"),
  workOrder: (zigId: string) => api<WorkOrderDetail>(`/work-orders/${zigId}`),
  payments: () =>
    api<
      Array<{
        paymentId: number;
        amount: string;
        paymentDate: string;
        paymentMethod: string | null;
      }>
    >("/payments"),
};

export const paymentsApi = {
  list: (weaverId?: number) => {
    const suffix = weaverId ? `?weaverId=${weaverId}` : "";
    return api<
      Array<{
        paymentId: number;
        amount: string;
        paymentDate: string;
        weaver: { firstName: string; lastName: string };
      }>
    >(`/payments${suffix}`);
  },
};

export const reportsApi = {
  getHisab: (paymentId: number) => api<HisabReport>("/reports/hisab/" + paymentId),
  async downloadHisabCsv(paymentId: number) {
    const token = getToken();
    const response = await fetch(
      `${API_BASE}/reports/hisab/${paymentId}?format=csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!response.ok) throw new Error("Failed to download HISAB report");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HISAB-${paymentId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  async downloadBatchHisabCsv(previewId: string) {
    const token = getToken();
    const response = await fetch(
      `${API_BASE}/reports/hisab/batch/${previewId}?format=csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!response.ok) throw new Error("Failed to download batch HISAB report");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HISAB-batch-${previewId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

/** One line per fabric type in a zig, with the returns merged. */
export interface GroupedFabricLine {
  returnIds: number[];
  returnCount: number;
  fabricType: string;
  quantityReturned: number;
  avgWeight: number;
  unitPrice: number;
  deductionPerPiece: number;
  adjustedPrice: number;
  lineSubtotal: number;
  netCredit: number;
}

export interface CommittedSettlementSummary {
  previewId: string;
  createdAt: string;
  committedAt: string | null;
  cutoffDate: string | null;
  weaverCount: number;
  grandTotal: number;
  paymentCount: number;
  paidTotal: number;
  paymentMethod: string | null;
  confirmedBy: string;
}

export const calculationsApi = {
  settlementHistory: () =>
    api<CommittedSettlementSummary[]>("/calculations/settlements/history"),
  deduction: (body: Record<string, unknown>) =>
    api<DeductionResult>("/calculations/deduction", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  bonus: (body: Record<string, unknown>) =>
    api<BonusResult>("/calculations/bonus", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  previewSettlement: (body: {
    weaverId: number;
    returnIds: number[];
    yarnGivenIds: number[];
    saleIds: number[];
  }) =>
    api<SettlementPreview>("/calculations/settlements/preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  batchPreview: (params?: { cutoffDate?: string }) =>
    api<{
      previewId: string;
      weavers: Array<{
        weaverId: number;
        weaverName: string;
        zigIds: string[];
        returnCount: number;
        yarnCount: number;
        netSettlement: number;
        lineItems: SettlementPreview["lineItems"];
      }>;
      weaverCount: number;
      grandTotal: number;
      amharicAmountInWords: string;
      cutoffDate?: string | null;
    }>("/calculations/settlements/batch-preview", {
      method: "POST",
      body: JSON.stringify(params ?? {}),
    }),
  getSettlementPreview: (previewId: string) =>
    api<{
      previewId: string;
      status: string;
      weaverCount: number;
      grandTotal: number;
      amharicAmountInWords: string;
      generatedAt: string;
      cutoffDate?: string | null;
      weavers: Array<{
        weaverId: number;
        weaverName: string;
        netSettlement: number;
        zigIds: string[];
        zigDetails: Array<{
          zigId: string;
          returns: Array<{
            returnId: number;
            fabricType: string;
            quantityReturned: number;
            avgWeight: number;
            unitPrice: number;
            netCredit: number;
          }>;
          /** Same fabric type merged into one line (added by the server). */
          groupedReturns?: GroupedFabricLine[];
          yarnQty: number;
          yarnTotal: number;
          netProfit: number;
        }>;
      }>;
    }>(`/calculations/settlements/preview/${previewId}`),
  async downloadPreviewCsv(previewId: string) {
    const token = getToken();
    const response = await fetch(
      `${API_BASE}/calculations/settlements/preview/${previewId}/export?format=csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!response.ok) throw new Error("CSV download failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlement-preview-${previewId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
  batchCommit: (previewId: string, paymentMethod?: string, cutoffDate?: string) =>
    api<{
      previewId: string;
      payments: Array<{
        paymentId: number;
        weaverId: number;
        weaverName: string;
        amount: number;
        reconciledZigIds: string[];
      }>;
      grandTotal: number;
      weaverCount: number;
      amharicAmountInWords: string;
    }>("/calculations/settlements/batch-commit", {
      method: "POST",
      body: JSON.stringify({ previewId, paymentMethod, cutoffDate }),
    }),
  commitSettlement: (body: {
    weaverId: number;
    returnIds: number[];
    yarnGivenIds: number[];
    saleIds: number[];
    paymentMethod?: string;
    notes?: string;
  }) =>
    api<{ paymentId: number; amount: number; amharicAmountInWords: string }>(
      "/calculations/settlements/commit",
      { method: "POST", body: JSON.stringify(body) },
    ),
};