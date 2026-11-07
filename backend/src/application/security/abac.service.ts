import { UserRole } from "@prisma/client";
import type {
  AbacSubject,
  AbacResource,
  AbacDecision,
  AbacAction,
} from "../../domain/security/abac-policy.types.js";
import { ForbiddenError, ConflictError } from "../../domain/errors/domain-errors.js";

export class AbacService {
  /**
   * Evaluates ownership for a Weaver resource. Admins bypass.
   */
  static evaluateWeaverOwnership(
    subject: AbacSubject,
    resource: AbacResource,
  ): AbacDecision {
    if (subject.roles.includes(UserRole.admin)) {
      return { allow: true };
    }
    if (subject.roles.includes(UserRole.weaver)) {
      if (resource.weaverUserId !== undefined && resource.weaverUserId === subject.userId) {
        return { allow: true };
      }
      return {
        allow: false,
        reason: "Access denied: Weaver does not own this resource",
      };
    }
    return {
      allow: false,
      reason: "Access denied: Insufficient role permissions for weaver resource",
    };
  }

  /**
   * Evaluates ownership for a Merchant resource. Admins bypass.
   */
  static evaluateMerchantOwnership(
    subject: AbacSubject,
    resource: AbacResource,
  ): AbacDecision {
    if (subject.roles.includes(UserRole.admin)) {
      return { allow: true };
    }
    if (subject.roles.includes(UserRole.merchant)) {
      if (resource.merchantUserId !== undefined && resource.merchantUserId === subject.userId) {
        return { allow: true };
      }
      return {
        allow: false,
        reason: "Access denied: Merchant does not own this resource",
      };
    }
    return {
      allow: false,
      reason: "Access denied: Insufficient role permissions for merchant resource",
    };
  }

  /**
   * Evaluates state-based mutation and immutability policies.
   */
  static evaluateResourceState(
    action: AbacAction,
    resource: AbacResource,
  ): AbacDecision {
    // 1. Immutability of settled fabric returns and yarn given
    if (["update", "delete"].includes(action)) {
      if (resource.settlementLineId !== null && resource.settlementLineId !== undefined) {
        return {
          allow: false,
          reason: "Cannot modify or delete an item that is part of a committed settlement line",
        };
      }
      if (resource.paymentId !== null && resource.paymentId !== undefined) {
        return {
          allow: false,
          reason: "Cannot modify or delete an item that has already been paid",
        };
      }
    }

    // 2. Cancellation of direct commercial transactions
    if (action === "cancel") {
      if (resource.status === "cancelled") {
        return { allow: false, reason: "Transaction is already cancelled" };
      }
      if (resource.amountPaid && Number(resource.amountPaid) > 0) {
        return {
          allow: false,
          reason: "Cannot cancel a transaction that already has recorded payments",
        };
      }
    }

    // 3. Work order status transitions
    if (action === "cancel" && resource.entityType === "work_order") {
      if (resource.status !== "assigned") {
        return {
          allow: false,
          reason: `Cannot cancel work order in '${resource.status}' status`,
        };
      }
    }

    return { allow: true };
  }

  /**
   * Asserts Weaver ownership or throws ForbiddenError
   */
  static enforceWeaverOwnership(subject: AbacSubject, resource: AbacResource): void {
    const decision = this.evaluateWeaverOwnership(subject, resource);
    if (!decision.allow) {
      throw new ForbiddenError(decision.reason);
    }
  }

  /**
   * Asserts Merchant ownership or throws ForbiddenError
   */
  static enforceMerchantOwnership(subject: AbacSubject, resource: AbacResource): void {
    const decision = this.evaluateMerchantOwnership(subject, resource);
    if (!decision.allow) {
      throw new ForbiddenError(decision.reason);
    }
  }

  /**
   * Asserts state validity or throws ConflictError
   */
  static enforceResourceState(action: AbacAction, resource: AbacResource): void {
    const decision = this.evaluateResourceState(action, resource);
    if (!decision.allow) {
      throw new ConflictError(decision.reason);
    }
  }

  /**
   * Field-level data masking for merchants: hides weaver rates, yarn costs, and supplier details
   */
  static maskForRole<T extends Record<string, any>>(
    roles: UserRole[],
    data: T,
  ): Partial<T> {
    if (roles.includes(UserRole.admin)) {
      return data;
    }

    if (roles.includes(UserRole.merchant)) {
      const sanitized = { ...data };
      delete (sanitized as any).weaverRate;
      delete (sanitized as any).rawYarnCost;
      delete (sanitized as any).supplierId;
      delete (sanitized as any).supplier;
      delete (sanitized as any).margin;
      return sanitized;
    }

    return data;
  }
}
