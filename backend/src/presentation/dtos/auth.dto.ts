import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
  );

export const LoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Signup aligned with User model: firstName (required) + lastName (optional).
 */
export const SignupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z
    .string()
    .trim()
    .max(60)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(60),
  password: passwordSchema,
  role: z.enum(["weaver", "merchant"]).default("weaver"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z
    .string()
    .trim()
    .max(60)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(60),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});
