import { z } from "zod";

export const CreateProcurementLineSchema = z.object({
  yarnVariantId: z.number().int().positive(),
  quantity: z.number().int().positive().optional(),
  quantityKg: z.number().int().positive().optional(),
  unitPrice: z.number().positive().optional(),
  unitCost: z.number().positive().optional(),
});

export const CreateProcurementSchema = z.object({
  supplierId: z.number().int().positive(),
  purchaseDate: z.string().datetime().optional().or(z.string().optional()),
  notes: z.string().optional().nullable(),
  lines: z.array(CreateProcurementLineSchema).min(1),
});
