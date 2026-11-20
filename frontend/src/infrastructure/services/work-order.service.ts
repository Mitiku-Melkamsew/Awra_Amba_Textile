import { request } from "../http/api-client";
import type {
  WorkOrder,
  WorkOrderStatus,
  YarnGiven,
  FabricReturn,
} from "../../domain/models";

/** Payload matching backend CreateWorkOrderSchema (schema fields only). */
export interface CreateWorkOrderDto {
  zigId?: string;
  weaverUserId: number;
  fabricVariantId: number;
  yarnLines?: Array<{
    yarnVariantId: number;
    quantity: number;
    unitPrice?: number;
  }>;
}

export const workOrderService = {
  async listWorkOrders(params?: {
    status?: WorkOrderStatus;
    weaverUserId?: number;
  }): Promise<WorkOrder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.weaverUserId != null && !isNaN(Number(params.weaverUserId))) {
      query.append("weaverUserId", params.weaverUserId.toString());
    }
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await request<any>(`/work-orders${queryString}`);
    return Array.isArray(res) ? res : (res.workOrders ?? []);
  },

  async getWorkOrder(zigId: string): Promise<WorkOrder> {
    return request<WorkOrder>(`/work-orders/${zigId}`);
  },

  async createWorkOrder(data: CreateWorkOrderDto): Promise<WorkOrder> {
    return request<WorkOrder>("/work-orders", {
      method: "POST",
      body: JSON.stringify({
        zigId: data.zigId,
        weaverUserId: data.weaverUserId,
        fabricVariantId: data.fabricVariantId,
        yarnLines: data.yarnLines,
      }),
    });
  },

  async updateStatus(zigId: string, status: WorkOrderStatus): Promise<WorkOrder> {
    return request<WorkOrder>(`/work-orders/${zigId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async cancelWorkOrder(zigId: string, reason?: string): Promise<WorkOrder> {
    return request<WorkOrder>(`/work-orders/${zigId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // --- Yarn Given ---
  async addYarnGiven(
    zigId: string,
    data: {
      yarnVariantId: number;
      quantity: number;
      unitPrice?: number;
    }
  ): Promise<YarnGiven> {
    return request<YarnGiven>(`/work-orders/${zigId}/yarn-given`, {
      method: "POST",
      body: JSON.stringify({
        yarnVariantId: data.yarnVariantId,
        quantity: data.quantity,
        unitPrice: data.unitPrice ?? 0,
      }),
    });
  },

  async updateYarnGiven(
    yarnGivenId: number,
    data: {
      quantity?: number;
      unitPrice?: number;
      remark?: string | null;
    }
  ): Promise<YarnGiven> {
    return request<YarnGiven>(`/work-orders/yarn-given/${yarnGivenId}`, {
      method: "PATCH",
      body: JSON.stringify({
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        remark: data.remark,
      }),
    });
  },

  async deleteYarnGiven(yarnGivenId: number): Promise<void> {
    return request<void>(`/work-orders/yarn-given/${yarnGivenId}`, {
      method: "DELETE",
    });
  },

  // --- Fabric Returns ---
  async addFabricReturn(
    zigId: string,
    data: {
      fabricVariantId: number;
      quantityReturned: number;
      totalWeight: number;
      unitPrice?: number;
      lengthCm?: number | null;
      widthCm?: number | null;
      remark?: string | null;
      dateReturned?: string;
      deductions?: Array<{ factor: string; perPiece: number; remark?: string }>;
    }
  ): Promise<FabricReturn> {
    return request<FabricReturn>(`/work-orders/${zigId}/fabric-returns`, {
      method: "POST",
      body: JSON.stringify({
        fabricVariantId: data.fabricVariantId,
        quantityReturned: data.quantityReturned,
        totalWeight: data.totalWeight,
        unitPrice: data.unitPrice ?? 0,
        lengthCm: data.lengthCm,
        widthCm: data.widthCm,
        remark: data.remark,
        dateReturned: data.dateReturned,
        deductions: data.deductions,
      }),
    });
  },

  async updateFabricReturn(
    returnId: number,
    data: {
      quantityReturned?: number;
      totalWeight?: number;
      unitPrice?: number;
      lengthCm?: number | null;
      widthCm?: number | null;
      remark?: string | null;
      deductions?: Array<{ factor: string; perPiece: number; remark?: string }>;
    }
  ): Promise<FabricReturn> {
    return request<FabricReturn>(`/work-orders/fabric-returns/${returnId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteFabricReturn(returnId: number): Promise<void> {
    return request<void>(`/work-orders/fabric-returns/${returnId}`, {
      method: "DELETE",
    });
  },
};
