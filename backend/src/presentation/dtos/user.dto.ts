import { z } from "zod";
import { UserRole } from "@prisma/client";

export const CreateUserSchema = z.object({
  username: z
    .string()
    .max(60)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  password: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  fullName: z.string().min(1, "Full name is required").max(120),
  phone: z
    .string()
    .max(30)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : null)),
  email: z
    .string()
    .email()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.trim() ? val.trim() : null)),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  role: z.nativeEnum(UserRole).optional(),
  companyName: z.string().optional().nullable(),
});

export const UpdateUserSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
  companyName: z.string().optional().nullable(),
});

export const SetUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const AssignRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const ResetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

export const ListUsersQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
