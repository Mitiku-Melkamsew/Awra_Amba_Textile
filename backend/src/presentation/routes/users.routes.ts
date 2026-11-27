import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability } from "../middleware/authorize.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import { NumericIdParamSchema, UserRoleParamSchema } from "../dtos/common.dto.js";
import {
  CreateUserSchema,
  UpdateUserSchema,
  SetUserStatusSchema,
  AssignRoleSchema,
  SetRolesSchema,
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
  validateParams(NumericIdParamSchema),
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
  validateParams(NumericIdParamSchema),
  validateBody(UpdateUserSchema),
  UserController.update,
);
usersRouter.put(
  "/:id",
  requireCapability(Capability.USERS_MANAGE),
  validateParams(NumericIdParamSchema),
  validateBody(UpdateUserSchema),
  UserController.update,
);

usersRouter.patch(
  "/:id/status",
  requireCapability(Capability.USERS_MANAGE),
  validateParams(NumericIdParamSchema),
  validateBody(SetUserStatusSchema),
  UserController.setStatus,
);

usersRouter.post(
  "/:id/roles",
  requireCapability(Capability.ROLES_MANAGE),
  validateParams(NumericIdParamSchema),
  validateBody(AssignRoleSchema),
  UserController.assignRole,
);

usersRouter.put(
  "/:id/roles",
  requireCapability(Capability.ROLES_MANAGE),
  validateParams(NumericIdParamSchema),
  validateBody(SetRolesSchema),
  UserController.setRoles,
);

usersRouter.delete(
  "/:id/roles/:role",
  requireCapability(Capability.ROLES_MANAGE),
  validateParams(UserRoleParamSchema),
  UserController.revokeRole,
);

usersRouter.post(
  "/:id/reset-password",
  requireCapability(Capability.USERS_MANAGE),
  validateParams(NumericIdParamSchema),
  validateBody(ResetPasswordSchema),
  UserController.resetPassword,
);

usersRouter.get(
  "/:id/balance",
  requireCapability(Capability.USERS_READ),
  validateParams(NumericIdParamSchema),
  UserController.getBalance,
);
