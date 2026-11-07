import { z } from "zod";

export const CreateFabricSchema = z.object({
  name: z.string().min(1).max(120),
  standardLengthCm: z.number().positive(),
  standardWidthCm: z.number().positive(),
  standardWeightG: z.number().positive(),
});

export const UpdateFabricSchema = z.object({
  standardLengthCm: z.number().positive().optional(),
  standardWidthCm: z.number().positive().optional(),
  standardWeightG: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const CreateYarnSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  materialName: z.string().min(1).max(80).optional(),
});

export const UpdateYarnSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  materialName: z.string().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export const CreateColorSchema = z.object({
  name: z.string().min(1).max(80),
  colorCode: z.string().optional().nullable(),
});

export const UpdateColorSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  colorCode: z.string().optional().nullable(),
});

export const CreateDesignSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
});

export const UpdateDesignSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().optional().nullable(),
});

export const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(120),
  contactPhone: z.string().max(30).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

export const UpdateSupplierSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  contactPhone: z.string().max(30).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const CreateFabricVariantSchema = z.object({
  fabricId: z.number().int().positive(),
  designId: z.number().int().positive().optional().nullable(),
  warpColorId: z.number().int().positive().optional().nullable(),
  weftColorId: z.number().int().positive().optional().nullable(),
  sku: z.string().max(40).optional(),
});

export const CreateYarnVariantSchema = z.object({
  yarnId: z.number().int().positive(),
  colorId: z.number().int().positive().optional().nullable(),
  supplierId: z.number().int().positive(),
  sku: z.string().max(40).optional(),
});

export const CreateFabricPriceSchema = z.object({
  fabricId: z.number().int().positive(),
  weaverRate: z.number().positive().optional(),
  weaverUnitPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  sellingUnitPrice: z.number().positive().optional(),
  effectiveFrom: z.string().datetime().optional().or(z.string().optional()),
});

export const CreateYarnPriceSchema = z.object({
  yarnId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  purchasePrice: z.number().positive().optional(),
  costPerKg: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  sellingPricePerKg: z.number().positive().optional(),
  effectiveFrom: z.string().datetime().optional().or(z.string().optional()),
});

export const CreateQualityRuleSchema = z.object({
  factor: z.string().min(1).max(80),
  unit: z.string().min(1).max(30),
  deductionPerUnit: z.number().positive(),
  notes: z.string().optional().nullable(),
});

export const UpdateQualityRuleSchema = z.object({
  factor: z.string().min(1).max(80).optional(),
  unit: z.string().min(1).max(30).optional(),
  deductionPerUnit: z.number().positive().optional(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const SetActiveStatusSchema = z.object({
  isActive: z.boolean(),
});
