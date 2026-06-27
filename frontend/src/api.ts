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

export interface FabricVariant {
  fabricVariantId: number;
  sku: string;
  basePrice: string | null;
  product: { name: string };
}

export interface WorkOrder {
  zigId: string;
  weaverId: number;
  fabricVariantId: number;
  status: string;
  weaver: Weaver;
  fabricVariant: FabricVariant;
}

export const weaversApi = {
  list: () => api<Weaver[]>("/weavers"),
  create: (data: Partial<Weaver>) =>
    api<Weaver>("/weavers", { method: "POST", body: JSON.stringify(data) }),
  unsettled: (id: number) =>
    api<{ returns: unknown[]; yarnGiven: unknown[]; sales: unknown[] }>(
      `/weavers/${id}/unsettled`,
    ),
};

export const catalogApi = {
  fabricVariants: () => api<FabricVariant[]>("/catalog/fabric-variants"),
  yarnVariants: () => api<unknown[]>("/catalog/yarn-variants"),
};

export const workOrdersApi = {
  list: (params?: { status?: string; weaverId?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.weaverId) query.set("weaverId", String(params.weaverId));
    const suffix = query.toString() ? `?${query}` : "";
    return api<WorkOrder[]>(`/work-orders${suffix}`);
  },
  get: (zigId: string) => api<unknown>(`/work-orders/${zigId}`),
  create: (data: { zigId: string; weaverId: number; fabricVariantId: number }) =>
    api<WorkOrder>("/work-orders", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (zigId: string, status: string) =>
    api<WorkOrder>(`/work-orders/${zigId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export const yarnGivenApi = {
  create: (data: {
    zigId: string;
    yarnVariantId: number;
    quantity: number;
    unitPrice: number;
  }) => api<unknown>("/yarn-given", { method: "POST", body: JSON.stringify(data) }),
};

export const fabricReturnsApi = {
  create: (data: {
    zigId: string;
    fabricVariantId: number;
    quantityReturned: number;
    totalWeight: number;
    unitPrice: number;
  }) =>
    api<unknown>("/fabric-returns", { method: "POST", body: JSON.stringify(data) }),
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
};

export const calculationsApi = {
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