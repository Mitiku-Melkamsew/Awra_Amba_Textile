import { z } from "zod";
import { DirectTxnType, DirectTxnStatus } from "@prisma/client";

/**
 * Canonical direct-transaction DTOs aligned with the Prisma schema.
 *
 * Canonical fields: `type`, `weaverUserId`, `merchantUserId`, `lines[]` with
 * `fabricVariantId` / `yarnVariantId`, `quantity`, `unitPrice`.
 *
 * Legacy clients (web + Flutter) still send `transactionType`, `weaverId`,
 * `merchantId`, `items`, and the short type names below. Those are accepted and
 * normalised instead of rejected, so this alignment is not a breaking change.
 *
 * Canonical `DirectTxnType` values:
 *   - fabric_purchase_from_weaver
 *   - yarn_sale_to_weaver
 *   - fabric_sale_to_merchant
 */

/** Short type names still sent by the admin UI, mapped to canonical enum values. */
const LEGACY_TXN_TYPES = {
  fabric_purchase: DirectTxnType.fabric_purchase_from_weaver,
  yarn_sale: DirectTxnType.yarn_sale_to_weaver,
  fabric_sale: DirectTxnType.fabric_sale_to_merchant,
} as const;

/**
 * `yarn_purchase` has no DirectTxnType counterpart: the controller routes it to
 * the procurement flow, so it is preserved verbatim.
 */
const DirectTxnTypeInput = z
  .enum([
    "fabric_purchase_from_weaver",
    "yarn_sale_to_weaver",
    "fabric_sale_to_merchant",
    "yarn_purchase",
    "fabric_purchase",
    "yarn_sale",
    "fabric_sale",
  ])
  .transform((value) =>
    value in LEGACY_TXN_TYPES
      ? LEGACY_TXN_TYPES[value as keyof typeof LEGACY_TXN_TYPES]
      : (value as DirectTxnType | "yarn_purchase"),
  );

export const CreateDirectTxnLineSchema = z
  .object({
    // Canonical identifiers.
    fabricVariantId: z.coerce.number().int().positive().optional().nullable(),
    yarnVariantId: z.coerce.number().int().positive().optional().nullable(),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().positive(),
    description: z.string().max(255).optional().nullable(),

    // Legacy line identifiers accepted for backward compatibility.
    productId: z.coerce.number().int().positive().optional().nullable(),
    fabricId: z.coerce.number().int().positive().optional().nullable(),
    yarnId: z.coerce.number().int().positive().optional().nullable(),
    yarnTypeId: z.coerce.number().int().positive().optional().nullable(),
    colorId: z.coerce.number().int().positive().optional().nullable(),
    warpColorId: z.coerce.number().int().positive().optional().nullable(),
    weftColorId: z.coerce.number().int().positive().optional().nullable(),
    designId: z.coerce.number().int().positive().optional().nullable(),
    supplierId: z.coerce.number().int().positive().optional().nullable(),
  })
  .refine(
    (line) =>
      line.fabricVariantId != null ||
      line.yarnVariantId != null ||
      line.productId != null ||
      line.fabricId != null ||
      line.yarnId != null ||
      line.yarnTypeId != null,
    { message: "Each line must reference a fabric or yarn variant" },
  );

export const CreateDirectTransactionSchema = z.object({
  type: DirectTxnTypeInput.optional(),
  transactionType: DirectTxnTypeInput.optional(),
  supplierId: z.coerce.number().int().positive().optional().nullable(),
  weaverUserId: z.coerce.number().int().positive().optional().nullable(),
  weaverId: z.coerce.number().int().positive().optional().nullable(),
  merchantUserId: z.coerce.number().int().positive().optional().nullable(),
  merchantId: z.coerce.number().int().positive().optional().nullable(),
  transactionDate: z.string().datetime().optional().or(z.string().optional()),
  notes: z.string().max(500).optional().nullable(),
  lines: z.array(CreateDirectTxnLineSchema).optional(),
  items: z.array(CreateDirectTxnLineSchema).optional(),
  initialPaymentAmount: z.coerce.number().nonnegative().optional(),
  initialPayment: z
    .object({
      amount: z.coerce.number().nonnegative(),
      paymentMethod: z.string().max(30).optional(),
      referenceNumber: z.string().max(100).optional(),
      notes: z.string().max(500).optional(),
    })
    .optional(),
  paymentMethod: z.string().max(30).optional(),
});

export const AddDirectTxnPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paymentMethod: z.string().max(30).optional().nullable(),
  paymentDate: z.string().optional(),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const ListDirectTransactionsQuerySchema = z.object({
  type: DirectTxnTypeInput.optional(),
  status: z.nativeEnum(DirectTxnStatus).optional(),
  weaverUserId: z.coerce.number().int().positive().optional(),
  weaverId: z.coerce.number().int().positive().optional(),
  merchantUserId: z.coerce.number().int().positive().optional(),
  merchantId: z.coerce.number().int().positive().optional(),
  counterpartyId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});