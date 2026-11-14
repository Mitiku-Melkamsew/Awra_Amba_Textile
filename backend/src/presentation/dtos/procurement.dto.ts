import { z } from "zod";

/**
 * Procurement DTOs aligned with the Prisma schema (YarnPurchase / YarnPurchaseLine).
 *
 * Canonical line fields: `yarnVariantId`, `quantity`, `unitPrice`.
 * Legacy aliases (`yarnId`, `yarnTypeId`, `quantityKg`, `unitCost`, ...) are
 * still accepted and normalised by the service, so existing clients keep working.
 */

export const CreateProcurementLineSchema = z.object({
  yarnVariantId: z.coerce.number().int().positive().optional().nullable(),
  yarnId: z.coerce.number().int().positive().optional().nullable(),
  yarnTypeId: z.coerce.number().int().positive().optional().nullable(),
  colorId: z.coerce.number().int().positive().optional().nullable(),
  supplierId: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().positive().optional(),
  quantityKg: z.coerce.number().positive().optional(),
  unitPrice: z.coerce.number().positive().optional(),
  unitCost: z.coerce.number().positive().optional(),
});

export const CreateProcurementSchema = z.object({
  supplierId: z.coerce.number().int().positive(),
  purchaseDate: z.string().datetime().optional().or(z.string().optional()),
  invoiceNumber: z.string().max(80).optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(CreateProcurementLineSchema).min(1),
});