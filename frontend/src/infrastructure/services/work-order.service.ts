import { request } from "../http/api-client";
import type {
  WorkOrder,
  WorkOrderStatus,
  YarnGiven,
  FabricReturn,
  YarnReturn,
  FabricReturnToWeaver,
} from "../../domain/models";

export interface CreateWorkOrderDto {
  weaverId: number;
  fabricId: number;
  warpColorId?: number | null;
  weftColorId?: number | null;
  designId?: number | null;
  expectedDate?: string | null;
  notes?: string | null;
  yarnLines?: Array<{
    yarnId: number;
    yarnVariantId?: number | null;
    supplierId?: number | null;
    quantityKg: number;
    unitPrice?: number;
  }>;
}

export const workOrderService = {
  async listWorkOrders(params?: {
    status?: WorkOrderStatus;
    weaverId?: number;
  }): Promise<WorkOrder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.weaverId) query.append("weaverUserId", params.weaverId.toString());
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
      body: JSON.stringify(data),
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

  // Yarn Given
  async addYarnGiven(
    workOrderId: string | number,
    data: {
      yarnId: number;
      yarnVariantId?: number | null;
      supplierId?: number | null;
      quantityKg: number;
      unitPrice?: number;
    }
  ): Promise<YarnGiven> {
    return request<YarnGiven>(`/work-orders/${workOrderId}/yarn-given`, {
      method: "POST",
      body: JSON.stringify({
        lines: [
          {
            yarnId: data.yarnId,
            yarnVariantId: data.yarnVariantId,
            supplierId: data.supplierId,
            quantity: data.quantityKg,
            unitPrice: data.unitPrice ?? 0,
          },
        ],
      }),
    });
  },

  async updateYarnGiven(
    yarnGivenId: number,
    data: {
      quantityKg?: number;
      unitPrice?: number;
    }
  ): Promise<YarnGiven> {
    return request<YarnGiven>(`/work-orders/yarn-given/${yarnGivenId}`, {
      method: "PATCH",
      body: JSON.stringify({
        quantity: data.quantityKg,
        unitPrice: data.unitPrice,
      }),
    });
  },

  async deleteYarnGiven(yarnGivenId: number): Promise<void> {
    return request<void>(`/work-orders/yarn-given/${yarnGivenId}`, {
      method: "DELETE",
    });
  },

  // Fabric Returns
  async addFabricReturn(
    workOrderId: string | number,
    data: {
      returnDate?: string;
      fabricVariantId?: number;
      productId?: number;
      warpColorId?: number;
      weftColorId?: number;
      designId?: number;
      quantityReturned: number;
      actualWeightG?: number;
      totalWeight?: number;
      unitPrice?: number;
      lengthCm?: number;
      widthCm?: number;
      notes?: string;
      remark?: string;
    }
  ): Promise<FabricReturn> {
    return request<FabricReturn>(`/work-orders/${workOrderId}/fabric-returns`, {
      method: "POST",
      body: JSON.stringify({
        fabricVariantId: data.fabricVariantId,
        productId: data.productId,
        warpColorId: data.warpColorId,
        weftColorId: data.weftColorId,
        designId: data.designId,
        quantityReturned: data.quantityReturned,
        totalWeight: data.totalWeight ?? data.actualWeightG ?? 0,
        unitPrice: data.unitPrice ?? 0,
        lengthCm: data.lengthCm,
        widthCm: data.widthCm,
        remark: data.remark ?? data.notes,
      }),
    });
  },

  async updateFabricReturn(
    fabricReturnId: number,
    data: {
      quantityReturned?: number;
      actualWeightG?: number;
      totalWeight?: number;
      unitPrice?: number;
      notes?: string;
      remark?: string;
    }
  ): Promise<FabricReturn> {
    return request<FabricReturn>(`/work-orders/fabric-returns/${fabricReturnId}`, {
      method: "PATCH",
      body: JSON.stringify({
        quantityReturned: data.quantityReturned,
        totalWeight: data.totalWeight ?? data.actualWeightG,
        unitPrice: data.unitPrice,
        remark: data.remark ?? data.notes,
      }),
    });
  },

  async deleteFabricReturn(fabricReturnId: number): Promise<void> {
    return request<void>(`/work-orders/fabric-returns/${fabricReturnId}`, {
      method: "DELETE",
    });
  },

  // Unused Yarn Returns
  async addYarnReturn(
    workOrderId: string | number,
    data: {
      yarnId?: number;
      yarnVariantId?: number;
      quantityKg?: number;
      quantity?: number;
      returnDate?: string;
      remark?: string;
    }
  ): Promise<YarnReturn> {
    return request<YarnReturn>(`/work-orders/${workOrderId}/yarn-returns`, {
      method: "POST",
      body: JSON.stringify({
        yarnId: data.yarnId,
        yarnVariantId: data.yarnVariantId,
        quantity: data.quantity ?? data.quantityKg,
        remark: data.remark,
      }),
    });
  },

  async deleteYarnReturn(yarnReturnId: number): Promise<void> {
    return request<void>(`/work-orders/yarn-returns/${yarnReturnId}`, {
      method: "DELETE",
    });
  },

  // Fabric Returns To Weaver
  async addFabricReturnToWeaver(
    workOrderId: string | number,
    data: {
      quantity: number;
      fabricVariantId?: number;
      returnDate?: string;
      reason?: string;
      remark?: string;
    }
  ): Promise<FabricReturnToWeaver> {
    return request<FabricReturnToWeaver>(
      `/work-orders/${workOrderId}/returns-to-weaver`,
      {
        method: "POST",
        body: JSON.stringify({
          quantity: data.quantity,
          fabricVariantId: data.fabricVariantId,
          remark: data.remark ?? data.reason,
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
