import { z } from "zod";
import { DirectTxnType, DirectTxnStatus } from "@prisma/client";

export const CreateDirectTxnLineSchema = z.object({
  fabricVariantId: z.number().int().positive().optional().nullable(),
  yarnVariantId: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  description: z.string().max(255).optional().nullable(),
});

export const CreateDirectTransactionSchema = z.object({
  type: z
    .nativeEnum(DirectTxnType)
    .or(
      z.enum([
        "yarn_purchase",
        "fabric_purchase",
        "yarn_sale",
        "fabric_sale",
        "fabric_purchase_from_weaver",
        "yarn_sale_to_weaver",
        "fabric_sale_to_merchant",
      ]).transform((val) => {
        if (val === "yarn_purchase") return "yarn_purchase" as any;
        if (val === "fabric_purchase") return DirectTxnType.fabric_purchase_from_weaver;
        if (val === "yarn_sale") return DirectTxnType.yarn_sale_to_weaver;
        if (val === "fabric_sale") return DirectTxnType.fabric_sale_to_merchant;
        return val as DirectTxnType;
      }),
    )
    .optional(),
  transactionType: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (val === "yarn_purchase") return "yarn_purchase" as any;
      if (val === "fabric_purchase") return DirectTxnType.fabric_purchase_from_weaver;
      if (val === "yarn_sale") return DirectTxnType.yarn_sale_to_weaver;
      if (val === "fabric_sale") return DirectTxnType.fabric_sale_to_merchant;
      return val as DirectTxnType;
    }),
  supplierId: z.coerce.number().int().positive().optional().nullable(),
  weaverUserId: z.number().int().positive().optional().nullable(),
  weaverId: z.number().int().positive().optional().nullable(),
  merchantUserId: z.number().int().positive().optional().nullable(),
  merchantId: z.number().int().positive().optional().nullable(),
  transactionDate: z.string().datetime().optional().or(z.string().optional()),
  notes: z.string().optional().nullable(),
  lines: z.array(CreateDirectTxnLineSchema).optional(),
  items: z.array(CreateDirectTxnLineSchema).optional(),
  initialPaymentAmount: z.number().nonnegative().optional(),
  initialPayment: z
    .object({
      amount: z.number().nonnegative(),
      paymentMethod: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.string().max(30).optional(),
});

export const RecordTxnPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().max(30).optional(),
  notes: z.string().optional(),
});

export const ListDirectTxnsQuerySchema = z.object({
  type: z
    .nativeEnum(DirectTxnType)
    .or(
      z.enum([
        "yarn_purchase",
        "fabric_purchase",
        "yarn_sale",
        "fabric_sale",
        "fabric_purchase_from_weaver",
        "yarn_sale_to_weaver",
        "fabric_sale_to_merchant",
      ]).transform((val) => {
        if (val === "yarn_purchase") return "yarn_purchase" as any;
        if (val === "fabric_purchase") return DirectTxnType.fabric_purchase_from_weaver;
        if (val === "yarn_sale") return DirectTxnType.yarn_sale_to_weaver;
        if (val === "fabric_sale") return DirectTxnType.fabric_sale_to_merchant;
        return val as DirectTxnType;
      }),
    )
    .optional(),
  status: z.nativeEnum(DirectTxnStatus).optional(),
  weaverUserId: z.coerce.number().int().positive().optional(),
  weaverId: z.coerce.number().int().positive().optional(),
  merchantUserId: z.coerce.number().int().positive().optional(),
  merchantId: z.coerce.number().int().positive().optional(),
  counterpartyId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
