import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { LoginSchema, SignupSchema, ChangePasswordSchema } from "../dtos/auth.dto.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(LoginSchema), AuthController.login);
authRouter.post("/signup", validateBody(SignupSchema), AuthController.signup);
authRouter.get("/me", authenticate, AuthController.me);
authRouter.post(
  "/change-password",
  authenticate,
  validateBody(ChangePasswordSchema),
  AuthController.changePassword,
);
