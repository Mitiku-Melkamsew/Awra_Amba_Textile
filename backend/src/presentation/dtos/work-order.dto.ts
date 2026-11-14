import { z } from "zod";
import { WorkOrderStatus } from "@prisma/client";

/**
 * Canonical work-order DTOs aligned with the Prisma schema.
 *
 * Canonical fields: `weaverUserId`, `fabricVariantId`, `yarnVariantId`, `quantity`.
 * Legacy aliases (`weaverId`, `yarnId`, `yarnTypeId`, `quantityKg`, `productId`,
 * `actualWeightG`, ...) are still accepted because the web and Flutter clients
 * send them; the services already normalise them.
 */

export const CreateWorkOrderSchema = z
  .object({
    zigId: z
      .string()
      .regex(/^z-[\w-]+$/i, "zigId must match pattern z-<id>")
      .optional(),
    weaverUserId: z.coerce.number().int().positive().optional(),
    weaverId: z.coerce.number().int().positive().optional(),
    fabricVariantId: z.coerce.number().int().positive(),
    yarnLines: z
      .array(
        z.object({
          yarnVariantId: z.coerce.number().int().positive(),
          quantity: z.coerce.number().positive().optional(),
          quantityKg: z.coerce.number().positive().optional(),
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

const YarnGivenLineSchema = z.object({
  yarnVariantId: z.coerce.number().int().positive().optional(),
  yarnId: z.coerce.number().int().positive().optional(),
  yarnTypeId: z.coerce.number().int().positive().optional(),
  colorId: z.coerce.number().int().positive().optional().nullable(),
  supplierId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().positive().optional(),
  quantityKg: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

export const AddYarnGivenSchema = z
  .object({
    lines: z.array(YarnGivenLineSchema).optional(),
    yarnVariantId: z.coerce.number().int().positive().optional(),
    yarnId: z.coerce.number().int().positive().optional(),
    yarnTypeId: z.coerce.number().int().positive().optional(),
    colorId: z.coerce.number().int().positive().optional().nullable(),
    supplierId: z.coerce.number().int().positive().optional().nullable(),
    quantity: z.coerce.number().positive().optional(),
    quantityKg: z.coerce.number().positive().optional(),
    unitPrice: z.coerce.number().nonnegative().optional(),
  })
  .refine(
    (data) =>
      (data.lines && data.lines.length > 0) ||
      ((data.yarnVariantId ?? data.yarnId ?? data.yarnTypeId) != null &&
        (data.quantity ?? data.quantityKg) != null),
    { message: "Provide either lines[] or a yarn id with quantity" },
  );

export const UpdateYarnGivenSchema = z.object({
  quantity: z.coerce.number().positive().optional(),
  quantityKg: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

export const AddFabricReturnSchema = z.object({
  fabricVariantId: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  fabricId: z.coerce.number().int().positive().optional(),
  warpColorId: z.coerce.number().int().positive().optional().nullable(),
  weftColorId: z.coerce.number().int().positive().optional().nullable(),
  designId: z.coerce.number().int().positive().optional().nullable(),
  quantityReturned: z.coerce.number().int().positive(),
  totalWeight: z.coerce.number().positive().optional(),
  actualWeightG: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional().default(0),
  lengthCm: z.coerce.number().positive().optional().nullable(),
  widthCm: z.coerce.number().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  returnDate: z.string().optional(),
});

export const UpdateFabricReturnSchema = z.object({
  quantityReturned: z.coerce.number().int().positive().optional(),
  totalWeight: z.coerce.number().positive().optional(),
  actualWeightG: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  lengthCm: z.coerce.number().positive().optional().nullable(),
  widthCm: z.coerce.number().positive().optional().nullable(),
  remark: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const AddYarnReturnSchema = z
  .object({
    yarnVariantId: z.coerce.number().int().positive().optional(),
    yarnId: z.coerce.number().int().positive().optional(),
    yarnTypeId: z.coerce.number().int().positive().optional(),
    colorId: z.coerce.number().int().positive().optional().nullable(),
    supplierId: z.coerce.number().int().positive().optional().nullable(),
    quantity: z.coerce.number().positive().optional(),
    quantityKg: z.coerce.number().positive().optional(),
    remark: z.string().max(500).optional().nullable(),
    returnDate: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.yarnVariantId ?? data.yarnId ?? data.yarnTypeId) != null &&
      (data.quantity ?? data.quantityKg) != null,
    { message: "Provide a yarn id and quantity" },
  );

export const AddFabricReturnToWeaverSchema = z.object({
  fabricVariantId: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive(),
  remark: z.string().max(500).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  returnDate: z.string().optional(),
});