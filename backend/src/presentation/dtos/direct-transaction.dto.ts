import { z } from "zod";
import { DirectTxnType, DirectTxnStatus } from "@prisma/client";

/**
 * Canonical direct-transaction DTOs aligned with Prisma schema.
 * Removed: productId, weaverId, merchantId, counterpartyId, yarnTypeId,
 * legacy type aliases (yarn_purchase, fabric_purchase, etc.).
 *
 * Allowed types (enum DirectTxnType):
 *   - fabric_purchase_from_weaver
 *   - yarn_sale_to_weaver
 *   - fabric_sale_to_merchant
 */

export const CreateDirectTxnLineSchema = z
  .object({
    fabricVariantId: z.coerce.number().int().positive().optional().nullable(),
    yarnVariantId: z.coerce.number().int().positive().optional().nullable(),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().positive(),
    description: z.string().max(200).optional().nullable(),
  })
  .refine(
    (line) => line.fabricVariantId != null || line.yarnVariantId != null,
    { message: "Each line must have fabricVariantId or yarnVariantId" },
  );

export const CreateDirectTransactionSchema = z
  .object({
    type: z.nativeEnum(DirectTxnType),
    weaverUserId: z.coerce.number().int().positive().optional().nullable(),
    merchantUserId: z.coerce.number().int().positive().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    lines: z.array(CreateDirectTxnLineSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (
      (data.type === DirectTxnType.fabric_purchase_from_weaver ||
        data.type === DirectTxnType.yarn_sale_to_weaver) &&
      data.weaverUserId == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "weaverUserId is required for weaver-related transactions",
        path: ["weaverUserId"],
      });
    }
    if (
      data.type === DirectTxnType.fabric_sale_to_merchant &&
      data.merchantUserId == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "merchantUserId is required for fabric_sale_to_merchant",
        path: ["merchantUserId"],
      });
    }
  });

export const AddDirectTxnPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paymentMethod: z.string().max(30).optional().nullable(),
  paymentDate: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const ListDirectTransactionsQuerySchema = z.object({
  type: z.nativeEnum(DirectTxnType).optional(),
  status: z.nativeEnum(DirectTxnStatus).optional(),
  weaverUserId: z.coerce.number().int().positive().optional(),
  merchantUserId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
