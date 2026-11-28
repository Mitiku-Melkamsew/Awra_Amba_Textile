import { z } from "zod";
import { UserRole } from "../../domain/types/enums.js";

export const NumericIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid numeric ID"),
});

export const UserRoleParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid user ID"),
  role: z.nativeEnum(UserRole),
});

export const DirectTxnIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .refine(
      (val) => /^\d+$/.test(val) && Number(val) > 0 || /^yp[-_]\d+$/i.test(val),
      "Invalid transaction ID",
    ),
});
