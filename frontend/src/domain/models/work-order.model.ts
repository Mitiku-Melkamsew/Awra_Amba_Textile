import type { Fabric, Yarn, YarnVariant, Weaver, FabricVariant } from "./index";

/** Mirrors Prisma `WorkOrderStatus` enum. */
export type WorkOrderStatus =
  | "assigned"
  | "in_progress"
  | "returned"
  | "reconciled"
  | "cancelled";

export interface YarnGiven {
  yarnGivenId: number;
  zigId: string;
  yarnVariantId: number;
  quantity: number | string;
  unitPrice: number | string;
  dateGiven?: string;
  recordedByUserId?: number;
  yarnVariant?: YarnVariant | any;
  yarn?: Yarn;
  settled?: boolean;
}

export interface FabricReturn {
  returnId: number;
  zigId: string;
  fabricVariantId: number;
  quantityReturned: number;
  totalWeight: number | string;
  unitPrice: number | string;
  lengthCm?: number | null;
  widthCm?: number | null;
  dateReturned?: string;
  recordedByUserId?: number;
  remark?: string | null;
  fabricVariant?: FabricVariant;
  settled?: boolean;
}

export interface YarnReturn {
  yarnReturnId: number;
  zigId: string;
  yarnVariantId: number;
  quantity: number | string;
  dateReturned?: string;
  recordedByUserId?: number;
  remark?: string | null;
  yarnVariant?: YarnVariant | any;
}

export interface FabricReturnToWeaver {
  fabricReturnToWeaverId: number;
  zigId: string;
  fabricVariantId: number;
  quantity: number;
  dateReturned?: string;
  recordedByUserId?: number;
  remark?: string | null;
  fabricVariant?: FabricVariant;
}

export interface WorkOrder {
  zigId: string;
  weaverUserId: number;
  fabricVariantId: number;
  status: WorkOrderStatus;
  dateIssued?: string;
  issuedByUserId?: number;
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
}

export interface WorkOrderDetail extends WorkOrder {
  weaver: Weaver;
  fabricVariant: FabricVariant;
  fabricReturns: FabricReturn[];
  yarnGiven: YarnGiven[];
  yarnReturns: YarnReturn[];
  fabricReturnsToWeaver: FabricReturnToWeaver[];
}
