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
 * Signup aligned with the User model: `fullName` is the canonical field.
 *
 * The legacy `firstName` / `lastName` / `companyName` fields are still accepted
 * because the web and Flutter clients post them today; the controller folds
 * them into `fullName`. New clients should send `fullName` only.
 */
export const SignupSchema = z
  .object({
    fullName: z.string().min(1).max(120).optional(),
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    companyName: z.string().max(120).optional(),
    phone: z.string().max(30).optional().nullable(),
    username: z.string().min(3).max(60),
    password: passwordSchema,
    role: z.enum(["weaver", "merchant"]).default("weaver"),
  })
  .superRefine((data, ctx) => {
    const hasName =
      Boolean(data.fullName?.trim()) ||
      Boolean(data.companyName?.trim()) ||
      Boolean(data.firstName?.trim() && data.lastName?.trim());
    if (!hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide fullName (or firstName and lastName)",
        path: ["fullName"],
      });
    }
  });

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
