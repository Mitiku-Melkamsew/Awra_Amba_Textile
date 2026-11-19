import { z } from "zod";

export const SettlementPreviewQuerySchema = z.object({
  cutoffDate: z.string().datetime().optional().or(z.string().optional()),
  periodEnd: z.string().datetime().optional().or(z.string().optional()),
  includeZigIds: z.array(z.string()).optional(),
  overrides: z.array(
    z.object({
      returnId: z.number().int().positive(),
      calculatedDeduction: z.number().nonnegative(),
      remark: z.string().optional(),
    }),
  ).optional(),
});

export const CommitBatchSettlementSchema = z.object({
  batchId: z.number().int().positive().optional(),
  cutoffDate: z.string().datetime().optional().or(z.string().optional()),
  includeZigIds: z.array(z.string()).optional(),
  overrides: z.array(
    z.object({
      returnId: z.number().int().positive(),
      calculatedDeduction: z.number().nonnegative(),
      remark: z.string().optional(),
    }),
  ).optional(),
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional().nullable(),
  autoPay: z.boolean().optional(),
  expectedNetSettlement: z.number().nonnegative().optional(),
});

export const CommitSingleSettlementSchema = z.object({
  weaverUserId: z.number().int().positive(),
  returnIds: z.array(z.number().int().positive()).min(1),
  yarnGivenIds: z.array(z.number().int().positive()),
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
  autoPay: z.boolean().optional(),
  expectedNetSettlement: z.number().nonnegative().optional(),
});

export const PaySettlementSchema = z.object({
  amount: z.number().positive().optional(),
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
});

export const CancelSettlementSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required"),
});

export const OverrideSettlementLineSchema = z
  .object({
    deductionPerPiece: z.number().nonnegative().optional(),
    /** Legacy alias for deductionPerPiece (not a line total). */
    deductionAmount: z.number().nonnegative().optional(),
    reason: z.string().min(1, "Reason is required for quality override"),
  })
  .refine(
    (data) => data.deductionPerPiece !== undefined || data.deductionAmount !== undefined,
    { message: "deductionPerPiece is required" },
  );
