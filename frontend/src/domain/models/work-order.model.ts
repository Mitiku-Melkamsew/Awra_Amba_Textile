import type { Fabric, Yarn, YarnVariant, Weaver, FabricVariant } from "./index";

export type WorkOrderStatus =
  | "assigned"
  | "in_progress"
  | "returned"
  | "reconciled"
  | "cancelled";

/** Canonical: schema uses quantity (not quantityKg). */
export interface YarnGiven {
  yarnGivenId: number;
  zigId?: string;
  yarnVariantId: number;
  quantity: number | string;
  unitPrice: number | string;
  dateGiven?: string;
  yarnVariant?: YarnVariant | any;
  yarn?: Yarn;
  settled?: boolean;
}

/** Canonical: returnId, totalWeight (not actualWeightG). */
export interface FabricReturn {
  returnId: number;
  zigId?: string;
  fabricVariantId?: number;
  dateReturned?: string;
  quantityReturned: number;
  totalWeight: number | string;
  unitPrice: number | string;
  lengthCm?: number | null;
  widthCm?: number | null;
  remark?: string | null;
  fabricVariant?: FabricVariant;
  settled?: boolean;
}

export interface YarnReturn {
  yarnReturnId: number;
  zigId?: string;
  yarnVariantId: number;
  quantity: number | string;
  dateReturned?: string;
  remark?: string | null;
  yarnVariant?: any;
}

export interface FabricReturnToWeaver {
  fabricReturnToWeaverId: number;
  zigId?: string;
  fabricVariantId?: number;
  quantity: number;
  dateReturned?: string;
  remark?: string | null;
  fabricVariant?: FabricVariant;
}

/** Canonical: zigId, weaverUserId, fabricVariantId (not weaverId/fabricId). */
export interface WorkOrder {
  zigId: string;
  weaverUserId: number;
  fabricVariantId: number;
  status: WorkOrderStatus;
  dateIssued?: string;
  weaver?: Weaver;
  fabricVariant?: FabricVariant;
  fabric?: Fabric;
  yarnGiven?: YarnGiven[];
  fabricReturns?: FabricReturn[];
  yarnReturns?: YarnReturn[];
  fabricReturnsToWeaver?: FabricReturnToWeaver[];
  _count?: {
    yarnGiven?: number;
    fabricReturns?: number;
  };
  // Compatibility shims still used by some UI components during transition
  workOrderId?: number;
  weaverId?: number;
  fabricId?: number;
}

export interface WorkOrderDetail extends WorkOrder {
  zigId: string;
  weaver: Weaver;
  fabricVariant: FabricVariant;
  yarnGiven: YarnGiven[];
  fabricReturns: FabricReturn[];
  yarnReturns?: YarnReturn[];
  fabricReturnsToWeaver?: FabricReturnToWeaver[];
}
