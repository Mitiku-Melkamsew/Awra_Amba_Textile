import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  companyName: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  username: z.string().min(3).max(60),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["weaver", "merchant"]).default("weaver"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
