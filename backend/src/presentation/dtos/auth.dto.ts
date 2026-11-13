import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
  );

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Signup aligned with User model: fullName (not firstName/lastName).
 * Password rules kept from production security hardening.
 */
export const SignupSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().max(30).optional().nullable(),
  username: z.string().min(3).max(60),
  password: passwordSchema,
  role: z.enum(["weaver", "merchant"]).default("weaver"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
