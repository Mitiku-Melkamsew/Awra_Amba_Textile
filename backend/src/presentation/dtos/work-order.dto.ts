import { z } from "zod";
import { WorkOrderStatus } from "@prisma/client";

/**
 * Canonical work-order DTOs aligned with Prisma schema.
 * Removed legacy aliases: weaverId, productId, quantityKg, yarnTypeId,
 * actualWeightG, fabricId-as-product, etc.
 */

export const CreateWorkOrderSchema = z.object({
  zigId: z
    .string()
    .regex(/^z-[\w-]+$/i, "zigId must match pattern z-<id>")
    .optional(),
  weaverUserId: z.coerce.number().int().positive(),
  fabricVariantId: z.coerce.number().int().positive(),
  yarnLines: z
    .array(
      z.object({
        yarnVariantId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().nonnegative().optional(),
      }),
    )
    .optional(),
});

export const UpdateWorkOrderStatusSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus),
});

export const AddYarnGivenSchema = z
  .object({
    lines: z
      .array(
        z.object({
          yarnVariantId: z.coerce.number().int().positive(),
          quantity: z.coerce.number().positive(),
          unitPrice: z.coerce.number().nonnegative().optional(),
        }),
      )
      .optional(),
    yarnVariantId: z.coerce.number().int().positive().optional(),
    quantity: z.coerce.number().positive().optional(),
    unitPrice: z.coerce.number().nonnegative().optional(),
  })
  .refine(
    (data) =>
      (data.lines && data.lines.length > 0) ||
      (data.yarnVariantId != null && data.quantity != null),
    { message: "Provide either lines[] or yarnVariantId + quantity" },
  );

export const UpdateYarnGivenSchema = z.object({
  quantity: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

export const AddFabricReturnSchema = z.object({
  fabricVariantId: z.coerce.number().int().positive(),
  quantityReturned: z.coerce.number().int().positive(),
  totalWeight: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative().optional().default(0),
  lengthCm: z.coerce.number().positive().optional().nullable(),
  widthCm: z.coerce.number().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
  returnDate: z.string().optional(),
});

export const UpdateFabricReturnSchema = z.object({
  quantityReturned: z.coerce.number().int().positive().optional(),
  totalWeight: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  lengthCm: z.coerce.number().positive().optional().nullable(),
  widthCm: z.coerce.number().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
});

export const AddYarnReturnSchema = z.object({
  yarnVariantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  remark: z.string().optional().nullable(),
  returnDate: z.string().optional(),
});

export const AddFabricReturnToWeaverSchema = z.object({
  fabricVariantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  remark: z.string().optional().nullable(),
  returnDate: z.string().optional(),
});
