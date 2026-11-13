import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { LoginSchema, SignupSchema, ChangePasswordSchema } from "../dtos/auth.dto.js";

export const authRouter = Router();

// Rate limit: 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

// Sign-up gets its own, looser budget: several weavers/merchants often register
// from the same shared office or mobile-network IP and must not exhaust the
// login budget for everyone else.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many sign-up attempts. Please try again later.",
});

authRouter.post("/login", loginLimiter, validateBody(LoginSchema), AuthController.login);
authRouter.post("/signup", signupLimiter, validateBody(SignupSchema), AuthController.signup);
authRouter.get("/me", authenticate, AuthController.me);
authRouter.post(
  "/change-password",
  authenticate,
  validateBody(ChangePasswordSchema),
  AuthController.changePassword,
);
