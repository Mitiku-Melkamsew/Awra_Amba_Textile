import { Router } from "express";
import { WorkOrderController } from "../controllers/work-order.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireCapability, requireAnyCapability } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { Capability } from "../../domain/security/capabilities.js";
import {
  CreateWorkOrderSchema,
  UpdateWorkOrderStatusSchema,
  AddYarnGivenSchema,
  UpdateYarnGivenSchema,
  AddFabricReturnSchema,
  UpdateFabricReturnSchema,
  AddYarnReturnSchema,
  AddFabricReturnToWeaverSchema,
} from "../dtos/work-order.dto.js";

export const workOrdersRouter = Router();

workOrdersRouter.use(authenticate);

workOrdersRouter.get(
  "/",
  requireAnyCapability(Capability.WORK_ORDERS_READ_ALL, Capability.WORK_ORDERS_READ_OWN),
  WorkOrderController.list,
);

workOrdersRouter.get(
  "/next-id",
  requireCapability(Capability.WORK_ORDERS_MANAGE),
  WorkOrderController.getNextZigId,
);

workOrdersRouter.get(
  "/:zigId",
  requireAnyCapability(Capability.WORK_ORDERS_READ_ALL, Capability.WORK_ORDERS_READ_OWN),
  WorkOrderController.getByZigId,
);

workOrdersRouter.post(
  "/",
  requireCapability(Capability.WORK_ORDERS_MANAGE),
  validateBody(CreateWorkOrderSchema),
  WorkOrderController.create,
);

workOrdersRouter.patch(
  "/:zigId/status",
  requireCapability(Capability.WORK_ORDERS_MANAGE),
  validateBody(UpdateWorkOrderStatusSchema),
  WorkOrderController.updateStatus,
);

workOrdersRouter.post(
  "/:zigId/cancel",
  requireCapability(Capability.WORK_ORDERS_MANAGE),
  WorkOrderController.cancel,
);

// Yarn Given
workOrdersRouter.post(
  "/:zigId/yarn-given",
  requireCapability(Capability.YARN_GIVEN_MANAGE),
  validateBody(AddYarnGivenSchema),
  WorkOrderController.addYarnGiven,
);

workOrdersRouter.patch(
  "/yarn-given/:id",
  requireCapability(Capability.YARN_GIVEN_MANAGE),
  validateBody(UpdateYarnGivenSchema),
  WorkOrderController.updateYarnGiven,
);
workOrdersRouter.put(
  "/yarn-given/:id",
  requireCapability(Capability.YARN_GIVEN_MANAGE),
  validateBody(UpdateYarnGivenSchema),
  WorkOrderController.updateYarnGiven,
);

workOrdersRouter.delete(
  "/yarn-given/:id",
  requireCapability(Capability.YARN_GIVEN_MANAGE),
  WorkOrderController.deleteYarnGiven,
);

// Fabric Returns
workOrdersRouter.post(
  "/:zigId/fabric-returns",
  requireCapability(Capability.FABRIC_RETURNS_MANAGE),
  validateBody(AddFabricReturnSchema),
  WorkOrderController.addFabricReturn,
);

workOrdersRouter.patch(
  "/fabric-returns/:id",
  requireCapability(Capability.FABRIC_RETURNS_MANAGE),
  validateBody(UpdateFabricReturnSchema),
  WorkOrderController.updateFabricReturn,
);
workOrdersRouter.put(
  "/fabric-returns/:id",
  requireCapability(Capability.FABRIC_RETURNS_MANAGE),
  validateBody(UpdateFabricReturnSchema),
  WorkOrderController.updateFabricReturn,
);

workOrdersRouter.delete(
  "/fabric-returns/:id",
  requireCapability(Capability.FABRIC_RETURNS_MANAGE),
  WorkOrderController.deleteFabricReturn,
);

// Yarn Returns
workOrdersRouter.post(
  "/:zigId/yarn-returns",
  requireCapability(Capability.YARN_GIVEN_MANAGE),
  validateBody(AddYarnReturnSchema),
  WorkOrderController.addYarnReturn,
);

// Fabric Returns to Weaver
workOrdersRouter.post(
  "/:zigId/returns-to-weaver",
  requireCapability(Capability.FABRIC_RETURNS_MANAGE),
  validateBody(AddFabricReturnToWeaverSchema),
  WorkOrderController.addFabricReturnToWeaver,
);
workOrdersRouter.post(
  "/:zigId/fabric-returns-to-weaver",
  requireCapability(Capability.FABRIC_RETURNS_MANAGE),
  validateBody(AddFabricReturnToWeaverSchema),
  WorkOrderController.addFabricReturnToWeaver,
);
