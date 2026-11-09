import { z } from "zod";
import { WorkOrderStatus } from "@prisma/client";

export const CreateWorkOrderSchema = z
  .object({
    zigId: z.string().regex(/^z-[\w-]+$/i).optional(),
    weaverUserId: z.coerce.number().int().positive().optional(),
    weaverId: z.coerce.number().int().positive().optional(),
    fabricVariantId: z.coerce.number().int().positive(),
    yarnLines: z
      .array(
        z.object({
          yarnVariantId: z.coerce.number().int().positive(),
          quantity: z.coerce.number().min(0).optional(),
          quantityKg: z.coerce.number().min(0).optional(),
          unitPrice: z.coerce.number().nonnegative().optional(),
        }),
      )
      .optional(),
  })
  .refine((data) => data.weaverUserId != null || data.weaverId != null, {
    message: "weaverUserId is required",
    path: ["weaverUserId"],
  });

export const UpdateWorkOrderStatusSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus),
});

export const AddYarnGivenSchema = z.object({
  lines: z
    .array(
      z.object({
        yarnVariantId: z.number().int().positive().optional(),
        yarnId: z.number().int().positive().optional(),
        yarnTypeId: z.number().int().positive().optional(),
        colorId: z.number().int().positive().optional().nullable(),
        supplierId: z.number().int().positive().optional().nullable(),
        quantity: z.number().int().positive().optional(),
        quantityKg: z.number().int().positive().optional(),
        unitPrice: z.number().nonnegative().optional(),
      }),
    )
    .optional(),
  yarnVariantId: z.number().int().positive().optional(),
  yarnId: z.number().int().positive().optional(),
  yarnTypeId: z.number().int().positive().optional(),
  colorId: z.number().int().positive().optional().nullable(),
  supplierId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().positive().optional(),
  quantityKg: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
});

export const UpdateYarnGivenSchema = z.object({
  quantity: z.number().int().positive().optional(),
  quantityKg: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
});

export const AddFabricReturnSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(),
  fabricId: z.number().int().positive().optional(),
  warpColorId: z.number().int().positive().optional().nullable(),
  weftColorId: z.number().int().positive().optional().nullable(),
  designId: z.number().int().positive().optional().nullable(),
  quantityReturned: z.number().int().positive(),
  totalWeight: z.number().positive().optional(),
  actualWeightG: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional().default(0),
  lengthCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  returnDate: z.string().optional(),
});

export const UpdateFabricReturnSchema = z.object({
  quantityReturned: z.number().int().positive().optional(),
  totalWeight: z.number().positive().optional(),
  actualWeightG: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  lengthCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const AddYarnReturnSchema = z.object({
  yarnVariantId: z.number().int().positive().optional(),
  yarnId: z.number().int().positive().optional(),
  colorId: z.number().int().positive().optional().nullable(),
  supplierId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().positive().optional(),
  quantityKg: z.number().int().positive().optional(),
  remark: z.string().optional().nullable(),
  returnDate: z.string().optional(),
});

export const AddFabricReturnToWeaverSchema = z.object({
  fabricVariantId: z.number().int().positive().optional(),
  quantity: z.number().int().positive(),
  remark: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  returnDate: z.string().optional(),
});
