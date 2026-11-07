import type { Fabric, Yarn, YarnVariant, Weaver, FabricVariant } from "./index";

export type WorkOrderStatus =
  | "assigned"
  | "in_progress"
  | "returned"
  | "reconciled"
  | "cancelled";

export interface YarnGiven {
  yarnGivenId: number;
  workOrderId?: number;
  yarnId?: number;
  yarnVariantId?: number | null;
  supplierId?: number | null;
  quantityKg?: number | string;
  quantity?: number | string;
  unitPrice: number | string;
  dateGiven?: string;
  paymentId?: number | null;
  yarn?: Yarn;
  yarnVariant?: YarnVariant | any;
  supplier?: { supplierId: number; name: string } | null;
  settled?: boolean;
}

export interface FabricReturn {
  fabricReturnId?: number;
  returnId?: number;
  workOrderId?: number;
  returnDate?: string;
  dateReturned?: string;
  quantityReturned: number;
  actualWeightG?: number | string;
  totalWeight?: number | string;
  avgWeight?: number | string;
  unitPrice: number | string;
  lengthCm?: number | null;
  widthCm?: number | null;
  notes?: string | null;
  remark?: string | null;
  paymentId?: number | null;
  fabricVariant?: FabricVariant;
  settled?: boolean;
}

export interface YarnReturn {
  yarnReturnId: number;
  workOrderId?: number;
  yarnId?: number;
  yarnVariantId?: number;
  quantityKg?: number | string;
  quantity?: number | string;
  returnDate?: string;
  dateReturned?: string;
  remark?: string | null;
  yarn?: Yarn;
  yarnVariant?: any;
}

export interface FabricReturnToWeaver {
  fabricReturnToWeaverId: number;
  workOrderId?: number;
  fabricVariantId?: number;
  quantity: number;
  returnDate?: string;
  dateReturned?: string;
  reason?: string | null;
  remark?: string | null;
  fabricVariant?: FabricVariant;
}

export interface WorkOrder {
  workOrderId: number;
  zigId?: string;
  orderNumber?: string;
  weaverId: number;
  fabricId: number;
  fabricVariantId?: number;
  warpColorId?: number | null;
  weftColorId?: number | null;
  designId?: number | null;
  status: WorkOrderStatus;
  assignedDate: string;
  dateIssued?: string;
  expectedDate?: string | null;
  returnedDate?: string | null;
  notes?: string | null;
  weaverUnitPriceSnapshot?: number | string;
  weaver?: Weaver;
  fabric?: Fabric;
  fabricVariant?: FabricVariant;
  yarnGiven?: YarnGiven[];
  fabricReturns?: FabricReturn[];
  yarnReturns?: YarnReturn[];
  fabricReturnsToWeaver?: FabricReturnToWeaver[];
  _count?: {
    yarnGiven?: number;
    fabricReturns?: number;
  };
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
