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
    weaverId?: number;
  }): Promise<WorkOrder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    const wid = params?.weaverUserId ?? params?.weaverId;
    if (wid != null && !isNaN(Number(wid))) {
      query.append("weaverUserId", wid.toString());
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

  // --- Yarn Returns ---
  async addYarnReturn(
    zigId: string,
    data: {
      yarnVariantId: number;
      quantity: number;
      remark?: string | null;
      dateReturned?: string;
    }
  ): Promise<YarnReturn> {
    return request<YarnReturn>(`/work-orders/${zigId}/yarn-returns`, {
      method: "POST",
      body: JSON.stringify({
        yarnVariantId: data.yarnVariantId,
        quantity: data.quantity,
        remark: data.remark,
        dateReturned: data.dateReturned,
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
    zigId: string,
    data: {
      fabricVariantId: number;
      quantity: number;
      remark?: string | null;
      dateReturned?: string;
    }
  ): Promise<FabricReturnToWeaver> {
    return request<FabricReturnToWeaver>(
      `/work-orders/${zigId}/returns-to-weaver`,
      {
        method: "POST",
        body: JSON.stringify({
          fabricVariantId: data.fabricVariantId,
          quantity: data.quantity,
          remark: data.remark,
          dateReturned: data.dateReturned,
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
