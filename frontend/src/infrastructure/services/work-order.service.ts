import { request } from "../http/api-client";
import type {
  WorkOrder,
  WorkOrderStatus,
  YarnGiven,
  FabricReturn,
  YarnReturn,
  FabricReturnToWeaver,
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
    if (params?.weaverUserId) query.append("weaverUserId", params.weaverUserId.toString());
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await request<any>(`/work-orders${queryString}`);
    return Array.isArray(res) ? res : (res.workOrders ?? []);
  },

  async getWorkOrder(id: string | number): Promise<WorkOrder> {
    return request<WorkOrder>(`/work-orders/${id}`);
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

  async updateStatus(id: string | number, status: WorkOrderStatus): Promise<WorkOrder> {
    return request<WorkOrder>(`/work-orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async cancelWorkOrder(id: string | number, reason?: string): Promise<WorkOrder> {
    return request<WorkOrder>(`/work-orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // --- Yarn Given ---
  async addYarnGiven(
    workOrderId: string | number,
    data: {
      yarnVariantId: number;
      quantity: number;
      unitPrice?: number;
    }
  ): Promise<YarnGiven> {
    return request<YarnGiven>(`/work-orders/${workOrderId}/yarn-given`, {
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
    }
  ): Promise<YarnGiven> {
    return request<YarnGiven>(`/work-orders/yarn-given/${yarnGivenId}`, {
      method: "PATCH",
      body: JSON.stringify({
        quantity: data.quantity,
        unitPrice: data.unitPrice,
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
    workOrderId: string | number,
    data: {
      fabricVariantId: number;
      quantityReturned: number;
      totalWeight: number;
      unitPrice?: number;
      lengthCm?: number;
      widthCm?: number;
      remark?: string;
      returnDate?: string;
    }
  ): Promise<FabricReturn> {
    return request<FabricReturn>(`/work-orders/${workOrderId}/fabric-returns`, {
      method: "POST",
      body: JSON.stringify({
        fabricVariantId: data.fabricVariantId,
        quantityReturned: data.quantityReturned,
        totalWeight: data.totalWeight,
        unitPrice: data.unitPrice ?? 0,
        lengthCm: data.lengthCm,
        widthCm: data.widthCm,
        remark: data.remark,
        returnDate: data.returnDate,
      }),
    });
  },

  async updateFabricReturn(
    fabricReturnId: number,
    data: {
      quantityReturned?: number;
      totalWeight?: number;
      unitPrice?: number;
      remark?: string;
    }
  ): Promise<FabricReturn> {
    return request<FabricReturn>(`/work-orders/fabric-returns/${fabricReturnId}`, {
      method: "PATCH",
      body: JSON.stringify({
        quantityReturned: data.quantityReturned,
        totalWeight: data.totalWeight,
        unitPrice: data.unitPrice,
        remark: data.remark,
      }),
    });
  },

  async deleteFabricReturn(fabricReturnId: number): Promise<void> {
    return request<void>(`/work-orders/fabric-returns/${fabricReturnId}`, {
      method: "DELETE",
    });
  },

  // --- Yarn Returns ---
  async addYarnReturn(
    workOrderId: string | number,
    data: {
      yarnVariantId: number;
      quantity: number;
      remark?: string;
      returnDate?: string;
    }
  ): Promise<YarnReturn> {
    return request<YarnReturn>(`/work-orders/${workOrderId}/yarn-returns`, {
      method: "POST",
      body: JSON.stringify({
        yarnVariantId: data.yarnVariantId,
        quantity: data.quantity,
        remark: data.remark,
        returnDate: data.returnDate,
      }),
    });
  },

  async deleteYarnReturn(yarnReturnId: number): Promise<void> {
    return request<void>(`/work-orders/yarn-returns/${yarnReturnId}`, {
      method: "DELETE",
    });
  },

  // --- Fabric Returns To Weaver ---
  async addFabricReturnToWeaver(
    workOrderId: string | number,
    data: {
      fabricVariantId: number;
      quantity: number;
      remark?: string;
      returnDate?: string;
    }
  ): Promise<FabricReturnToWeaver> {
    return request<FabricReturnToWeaver>(
      `/work-orders/${workOrderId}/returns-to-weaver`,
      {
        method: "POST",
        body: JSON.stringify({
          fabricVariantId: data.fabricVariantId,
          quantity: data.quantity,
          remark: data.remark,
          returnDate: data.returnDate,
        }),
      }
    );
  },

  async deleteFabricReturnToWeaver(id: number): Promise<void> {
    return request<void>(`/work-orders/fabric-returns-to-weaver/${id}`, {
      method: "DELETE",
    });
  },
};
