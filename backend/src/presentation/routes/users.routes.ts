import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import {
  CreateUserSchema,
  UpdateUserSchema,
  SetUserStatusSchema,
  AssignRoleSchema,
  ResetPasswordSchema,
  ListUsersQuerySchema,
} from "../dtos/user.dto.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  "/",
  requireCapability(Capability.USERS_READ),
  validateQuery(ListUsersQuerySchema),
  UserController.list,
);

usersRouter.get(
  "/:id",
  requireCapability(Capability.USERS_READ),
  UserController.getById,
);

usersRouter.post(
  "/",
  requireCapability(Capability.USERS_MANAGE),
  validateBody(CreateUserSchema),
  UserController.create,
);

usersRouter.patch(
  "/:id",
  requireCapability(Capability.USERS_MANAGE),
  validateBody(UpdateUserSchema),
  UserController.update,
);
usersRouter.put(
  "/:id",
  requireCapability(Capability.USERS_MANAGE),
  validateBody(UpdateUserSchema),
  UserController.update,
);

usersRouter.patch(
  "/:id/status",
  requireCapability(Capability.USERS_MANAGE),
  validateBody(SetUserStatusSchema),
  UserController.setStatus,
);

usersRouter.post(
  "/:id/roles",
  requireCapability(Capability.ROLES_MANAGE),
  validateBody(AssignRoleSchema),
  UserController.assignRole,
);

usersRouter.delete(
  "/:id/roles/:role",
  requireCapability(Capability.ROLES_MANAGE),
  UserController.revokeRole,
);

usersRouter.post(
  "/:id/reset-password",
  requireCapability(Capability.USERS_MANAGE),
  validateBody(ResetPasswordSchema),
  UserController.resetPassword,
);

usersRouter.get(
  "/:id/balance",
  requireCapability(Capability.USERS_READ),
  UserController.getBalance,
);
