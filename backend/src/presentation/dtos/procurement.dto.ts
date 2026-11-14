import { z } from "zod";

/**
 * Canonical procurement DTOs aligned with Prisma schema (YarnPurchase / YarnPurchaseLine).
 * Removed: quantityKg, yarnTypeId, unitCost aliases.
 */

export const CreateProcurementLineSchema = z.object({
  yarnVariantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
});

export const CreateProcurementSchema = z.object({
  supplierId: z.coerce.number().int().positive(),
  purchaseDate: z.string().datetime().optional().or(z.string().optional()),
  notes: z.string().optional().nullable(),
  lines: z.array(CreateProcurementLineSchema).min(1),
});
